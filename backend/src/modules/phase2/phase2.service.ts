import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { redactMetadata } from '../analysis/analysis.service';

type JsonRecord = Record<string, unknown>;
type ReplayLimits = { maxEvents?: number; maxToolCalls?: number; maxOutputSize?: number; maxExecutionTimeMs?: number };
const SAFE_REPLAY_MODES = new Set(['SANDBOX', 'MOCK_TOOLS', 'RECORDED_TOOLS', 'READ_ONLY']);
const ALLOWED_FORK_KEYS = new Set(['prompt', 'model', 'tools', 'context', 'retrieval', 'memory', 'validation', 'agentConfiguration']);

export function isSafeReplayMode(mode: string) { return SAFE_REPLAY_MODES.has(mode) && mode !== 'LIVE'; }
export function validateForkModificationKeys(modifications: JsonRecord) { return Object.keys(modifications ?? {}).every((key) => ALLOWED_FORK_KEYS.has(key)); }

function json(value: unknown): Prisma.InputJsonValue {
  return redactMetadata(value) as Prisma.InputJsonValue;
}

function numberFrom(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function compactEvent(event: any) {
  return {
    spanId: event.spanId,
    parentSpanId: event.parentSpanId,
    agent: event.agent,
    node: event.node,
    operation: event.operation,
    type: event.type,
    startTime: event.startTime,
    endTime: event.endTime,
    durationMs: event.durationMs,
    status: event.status,
    inputMetadata: event.inputMetadata,
    outputMetadata: event.outputMetadata,
    errorMetadata: event.errorMetadata,
    modelMetadata: event.modelMetadata,
    tokenUsage: event.tokenUsage,
  };
}

@Injectable()
export class Phase2Service {
  constructor(private readonly prisma: PrismaService) {}

  private async ownedExecution(userId: string, id: string) {
    const execution = await this.prisma.execution.findFirst({ where: { id, ownerId: userId }, include: { events: { orderBy: { startTime: 'asc' } }, agent: true, agentVersion: true, project: { include: { workspace: true } } } });
    if (!execution) throw new NotFoundException('EXECUTION_NOT_FOUND');
    return execution;
  }

  private async ownedSnapshot(userId: string, id: string) {
    const snapshot = await this.prisma.snapshot.findFirst({ where: { id, ownerId: userId }, include: { execution: { include: { events: { orderBy: { startTime: 'asc' } }, agent: true, agentVersion: true, project: { include: { workspace: true } } } }, agentVersion: true, parentSnapshot: true, childSnapshots: true, replays: true, forks: true } });
    if (!snapshot) throw new NotFoundException('SNAPSHOT_NOT_FOUND');
    return snapshot;
  }

  async createSnapshot(userId: string, input: { executionId: string; spanId?: string; stepId?: string; label?: string; reason?: string }) {
    const execution = await this.ownedExecution(userId, input.executionId);
    const spanId = input.spanId ?? input.stepId ?? execution.events[0]?.spanId;
    if (!spanId) throw new BadRequestException('SNAPSHOT_STEP_REQUIRED');
    const event = execution.events.find((item) => item.spanId === spanId);
    if (!event) throw new NotFoundException('SNAPSHOT_SPAN_NOT_FOUND');
    const existing = await this.prisma.snapshot.findFirst({ where: { ownerId: userId, executionId: execution.id, spanId, state: { equals: json({ event: compactEvent(event) }) as any } } }).catch(() => null);
    if (existing) return existing;
    const snapshot = await this.prisma.snapshot.create({ data: {
      executionId: execution.id, ownerId: userId, agentId: execution.agentId, agentVersionId: execution.agentVersionId, spanId,
      framework: execution.framework, runtime: execution.runtime, environment: execution.environment,
      state: json({ event: compactEvent(event), stepIndex: execution.events.indexOf(event), status: execution.status }),
      context: json({ input: execution.inputMetadata, output: event.outputMetadata }),
      modelMetadata: json(event.modelMetadata ?? execution.modelMetadata),
      toolMetadata: json({ operation: event.operation, input: event.inputMetadata, output: event.outputMetadata }),
      memoryRefs: json({}), retrievalRefs: json({}), tokenMetadata: json(event.tokenUsage ?? execution.tokenUsage), costMetadata: json({ estimatedCost: execution.estimatedCost, latencyMs: event.durationMs }),
    } });
    console.info(JSON.stringify({ event: 'snapshot.created', snapshotId: snapshot.id, executionId: execution.id, spanId }));
    return snapshot;
  }

  async listSnapshots(userId: string, query: { executionId?: string; spanId?: string; agentId?: string; label?: string }) {
    return this.prisma.snapshot.findMany({ where: { ownerId: userId, executionId: query.executionId, spanId: query.spanId, agentId: query.agentId }, orderBy: { createdAt: 'desc' }, take: 100, include: { execution: { select: { id: true, traceId: true, framework: true, status: true, createdAt: true } }, agentVersion: true } });
  }

  async getSnapshot(userId: string, id: string) { return this.ownedSnapshot(userId, id); }

  async replaySnapshot(userId: string, input: { snapshotId: string; mode?: 'SANDBOX' | 'MOCK_TOOLS' | 'RECORDED_TOOLS' | 'READ_ONLY' | 'LIVE'; overrides?: JsonRecord; limits?: ReplayLimits; idempotencyKey?: string }) {
    const snapshot = await this.ownedSnapshot(userId, input.snapshotId);
    const mode = input.mode ?? 'SANDBOX';
    if (!isSafeReplayMode(mode)) throw new ForbiddenException('LIVE_REPLAY_REQUIRES_EXPLICIT_AUTHORIZATION');
    const limits = input.limits ?? { maxEvents: 10000, maxToolCalls: 100, maxOutputSize: 100000 };
    if ((limits.maxEvents ?? 10000) < snapshot.execution.events.length) throw new BadRequestException('RESOURCE_LIMIT_EXCEEDED');
    const overrides = { mode, limits, ...(input.overrides ?? {}) };
    if (input.idempotencyKey) {
      const prior = await this.prisma.replay.findFirst({ where: { ownerId: userId, sourceSnapshotId: snapshot.id, overrides: { equals: json({ ...overrides, idempotencyKey: input.idempotencyKey }) as any } } });
      if (prior) return prior;
    }
    const replay = await this.prisma.replay.create({ data: { sourceExecutionId: snapshot.executionId, sourceSnapshotId: snapshot.id, ownerId: userId, mode, overrides: json({ ...overrides, idempotencyKey: input.idempotencyKey }) } });
    console.info(JSON.stringify({ event: 'replay.started', replayId: replay.id, snapshotId: snapshot.id, mode }));
    try {
      const source = snapshot.execution;
      const result = await this.prisma.$transaction(async (tx) => {
        const resultExecution = await tx.execution.create({ data: { projectId: source.projectId, ownerId: userId, agentId: source.agentId, agentVersionId: source.agentVersionId, traceId: `${source.traceId}:replay:${replay.id}`, framework: source.framework, runtime: source.runtime, environment: `replay:${mode}`, startTime: source.startTime, endTime: source.endTime, durationMs: source.durationMs, status: source.status, inputMetadata: json({ sourceSnapshotId: snapshot.id, mode, overrides }), outputMetadata: source.outputMetadata as any, errorMetadata: source.errorMetadata as any, modelMetadata: json({ source: source.modelMetadata, overrides }), tokenUsage: source.tokenUsage as any, estimatedCost: source.estimatedCost } });
        await tx.executionEvent.createMany({ data: source.events.slice(0, limits.maxEvents ?? 10000).map((event) => ({ executionId: resultExecution.id, spanId: `${event.spanId}:replay:${replay.id}`, parentSpanId: event.parentSpanId ? `${event.parentSpanId}:replay:${replay.id}` : undefined, agent: event.agent, node: event.node, operation: event.operation, type: mode === 'MOCK_TOOLS' && event.type === 'TOOL_CALL' ? 'TOOL_CALL_MOCKED' : event.type, startTime: event.startTime, endTime: event.endTime, durationMs: event.durationMs, status: event.status, inputMetadata: event.inputMetadata as any, outputMetadata: mode === 'MOCK_TOOLS' && event.type === 'TOOL_CALL' ? json({ mocked: true, sourceSpanId: event.spanId }) : event.outputMetadata as any, errorMetadata: event.errorMetadata as any, modelMetadata: event.modelMetadata as any, tokenUsage: event.tokenUsage as any })) });
        await tx.replay.update({ where: { id: replay.id }, data: { status: 'COMPLETED', resultExecutionId: resultExecution.id } });
        await tx.replayResult.create({ data: { replayId: replay.id, resultExecutionId: resultExecution.id, status: 'COMPLETED', latencyMs: resultExecution.durationMs, tokenUsage: resultExecution.tokenUsage as any, costMetadata: json({ estimatedCost: resultExecution.estimatedCost }), outputMetadata: resultExecution.outputMetadata as any, errorMetadata: resultExecution.errorMetadata as any, divergence: json({ mode, sourceExecutionId: source.id, eventCount: source.events.length }) } });
        return resultExecution;
      });
      console.info(JSON.stringify({ event: 'replay.completed', replayId: replay.id, executionId: result.id }));
      return this.prisma.replay.findUnique({ where: { id: replay.id }, include: { result: true, resultExecution: true, sourceSnapshot: true } });
    } catch (error) {
      await this.prisma.replay.update({ where: { id: replay.id }, data: { status: 'FAILED' } });
      console.error(JSON.stringify({ event: 'replay.failed', replayId: replay.id }));
      throw error;
    }
  }

  async getReplay(userId: string, id: string) {
    const replay = await this.prisma.replay.findFirst({ where: { id, ownerId: userId }, include: { sourceSnapshot: true, sourceExecution: true, result: true, resultExecution: { include: { events: true } } } });
    if (!replay) throw new NotFoundException('REPLAY_NOT_FOUND');
    return replay;
  }

  async createFork(userId: string, input: { snapshotId: string; name: string; modifications: JsonRecord; idempotencyKey?: string }) {
    const snapshot = await this.ownedSnapshot(userId, input.snapshotId);
    if (!input.name?.trim() || !validateForkModificationKeys(input.modifications)) throw new BadRequestException('INVALID_FORK_CONFIGURATION');
    const fork = await this.prisma.fork.create({ data: { sourceExecutionId: snapshot.executionId, sourceSnapshotId: snapshot.id, ownerId: userId, name: input.name.trim().slice(0, 120), changes: json({ ...input.modifications, idempotencyKey: input.idempotencyKey }) } });
    console.info(JSON.stringify({ event: 'fork.created', forkId: fork.id, snapshotId: snapshot.id }));
    return fork;
  }

  async runFork(userId: string, id: string) {
    const fork = await this.prisma.fork.findFirst({ where: { id, ownerId: userId }, include: { sourceSnapshot: true, sourceExecution: { include: { events: true } } } });
    if (!fork) throw new NotFoundException('FORK_NOT_FOUND');
    const source = fork.sourceExecution;
    await this.prisma.fork.update({ where: { id }, data: { status: 'RUNNING' } });
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const changes = (fork.changes ?? {}) as JsonRecord;
        const execution = await tx.execution.create({ data: { projectId: source.projectId, ownerId: userId, agentId: source.agentId, agentVersionId: source.agentVersionId, traceId: `${source.traceId}:fork:${fork.id}`, framework: source.framework, runtime: source.runtime, environment: 'fork:sandbox', startTime: source.startTime, endTime: source.endTime, durationMs: source.durationMs, status: source.status, inputMetadata: json({ forkId: fork.id, sourceSnapshotId: fork.sourceSnapshotId, modifications: changes }), outputMetadata: source.outputMetadata as any, errorMetadata: source.errorMetadata as any, modelMetadata: json({ source: source.modelMetadata, fork: changes.model ?? null }), tokenUsage: source.tokenUsage as any, estimatedCost: source.estimatedCost } });
        await tx.executionEvent.createMany({ data: source.events.map((event) => ({ executionId: execution.id, spanId: `${event.spanId}:fork:${fork.id}`, parentSpanId: event.parentSpanId ? `${event.parentSpanId}:fork:${fork.id}` : undefined, agent: event.agent, node: event.node, operation: event.operation, type: event.type, startTime: event.startTime, endTime: event.endTime, durationMs: event.durationMs, status: event.status, inputMetadata: event.inputMetadata as any, outputMetadata: event.outputMetadata as any, errorMetadata: event.errorMetadata as any, modelMetadata: event.modelMetadata as any, tokenUsage: event.tokenUsage as any })) });
        await tx.fork.update({ where: { id }, data: { status: 'COMPLETED', resultExecutionId: execution.id } });
        return execution;
      });
      console.info(JSON.stringify({ event: 'fork.completed', forkId: id, executionId: result.id }));
      return this.prisma.fork.findUnique({ where: { id }, include: { sourceSnapshot: true, sourceExecution: true, resultExecution: true } });
    } catch (error) {
      await this.prisma.fork.update({ where: { id }, data: { status: 'FAILED' } });
      console.error(JSON.stringify({ event: 'fork.failed', forkId: id }));
      throw error;
    }
  }

  async getFork(userId: string, id: string) {
    const fork = await this.prisma.fork.findFirst({ where: { id, ownerId: userId }, include: { sourceSnapshot: true, sourceExecution: true, resultExecution: true } });
    if (!fork) throw new NotFoundException('FORK_NOT_FOUND');
    return fork;
  }

  private async resolveExecution(userId: string, executionId?: string, snapshotId?: string) {
    if (executionId) return this.ownedExecution(userId, executionId);
    if (snapshotId) return (await this.ownedSnapshot(userId, snapshotId)).execution;
    throw new BadRequestException('DIFF_SOURCE_REQUIRED');
  }

  async createDiff(userId: string, input: { leftExecutionId?: string; rightExecutionId?: string; leftSnapshotId?: string; rightSnapshotId?: string }) {
    const [left, right] = await Promise.all([this.resolveExecution(userId, input.leftExecutionId, input.leftSnapshotId), this.resolveExecution(userId, input.rightExecutionId, input.rightSnapshotId)]);
    if (left.id === right.id) throw new BadRequestException('DIFF_REQUIRES_TWO_EXECUTIONS');
    const leftTypes = left.events.map((event) => event.type);
    const rightTypes = right.events.map((event) => event.type);
    const leftFailures = left.events.filter((event) => event.status !== 'ok').length;
    const rightFailures = right.events.filter((event) => event.status !== 'ok').length;
    const leftTokens = (left.tokenUsage as any)?.total ?? null;
    const rightTokens = (right.tokenUsage as any)?.total ?? null;
    const changes = { identity: { framework: [left.framework, right.framework], environment: [left.environment, right.environment] }, graph: { addedTypes: rightTypes.filter((type) => !leftTypes.includes(type)), removedTypes: leftTypes.filter((type) => !rightTypes.includes(type)), eventCount: [left.events.length, right.events.length] }, timeline: { durationMs: [left.durationMs, right.durationMs], failures: [leftFailures, rightFailures] }, model: { left: left.modelMetadata, right: right.modelMetadata }, output: { left: left.outputMetadata, right: right.outputMetadata }, errors: { count: [leftFailures, rightFailures], left: left.errorMetadata, right: right.errorMetadata }, tokens: { left: leftTokens, right: rightTokens }, cost: { left: left.estimatedCost, right: right.estimatedCost }, latency: { left: left.durationMs, right: right.durationMs } };
    const summary = rightFailures < leftFailures ? 'Right execution has fewer observed failures.' : rightFailures > leftFailures ? 'Right execution introduces additional observed failures.' : 'Failure count is unchanged between executions.';
    const diff = await this.prisma.diff.create({ data: { ownerId: userId, leftExecutionId: left.id, rightExecutionId: right.id, summary, changes: json(changes) } });
    console.info(JSON.stringify({ event: 'diff.created', diffId: diff.id, leftExecutionId: left.id, rightExecutionId: right.id }));
    return this.getDiff(userId, diff.id);
  }

  async getDiff(userId: string, id: string) {
    const diff = await this.prisma.diff.findFirst({ where: { id, ownerId: userId }, include: { leftExecution: { include: { analyses: { orderBy: { createdAt: 'desc' }, take: 1, include: { evidenceNodes: true, recommendations: true } } } }, rightExecution: { include: { analyses: { orderBy: { createdAt: 'desc' }, take: 1, include: { evidenceNodes: true, recommendations: true } } } } } });
    if (!diff) throw new NotFoundException('DIFF_SOURCE_NOT_FOUND');
    const leftAnalysis: any = diff.leftExecution.analyses[0];
    const rightAnalysis: any = diff.rightExecution.analyses[0];
    const leftFailed = diff.leftExecution.status !== 'COMPLETED' || (leftAnalysis?.desCategory && leftAnalysis.desCategory !== 'no_observed_failure');
    const rightFailed = diff.rightExecution.status !== 'COMPLETED' || (rightAnalysis?.desCategory && rightAnalysis.desCategory !== 'no_observed_failure');
    return { ...diff, rcaComparison: { rootCauseChanged: leftAnalysis?.summary !== rightAnalysis?.summary, decisiveStepChanged: leftAnalysis?.desStepId !== rightAnalysis?.desStepId, errorRemoved: Boolean(leftFailed) && !Boolean(rightFailed), propagation: [leftAnalysis?.recommendations?.[0]?.impact ?? 'Unavailable', rightAnalysis?.recommendations?.[0]?.impact ?? 'Unavailable'], confidence: [leftAnalysis?.overallConfidence ?? null, rightAnalysis?.overallConfidence ?? null], evidence: [leftAnalysis?.evidenceNodes?.length ?? null, rightAnalysis?.evidenceNodes?.length ?? null], conclusion: leftFailed && !rightFailed ? 'Original failure resolved; right execution has no observed failure.' : !leftFailed && rightFailed ? 'Right execution introduced a new failure.' : 'Execution succeeded, but formal evidence does not prove a fix.' } };
  }
}
