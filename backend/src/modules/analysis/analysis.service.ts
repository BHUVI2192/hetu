import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type TraceEvent = {
  spanId?: string; span_id?: string; parentSpanId?: string; parent_span_id?: string; agent?: string; node?: string;
  operation?: string; type?: string; eventType?: string; status?: string; startTime?: string | number; timestamp?: string | number;
  endTime?: string | number; durationMs?: number; duration_ms?: number; input?: unknown; output?: unknown; error?: unknown;
  model?: unknown; modelMetadata?: unknown; tokenUsage?: unknown; metadata?: unknown; hallucinationRisk?: number; hallucination_risk?: number;
};

const secretKey = /(api[_-]?key|password|passwd|secret|bearer|authorization|cookie|credential|private[_-]?key|access[_-]?token|refresh[_-]?token)/i;
const forbiddenReasoningKey = /^(reasoning|chain[_-]?of[_-]?thought|thoughts?|scratchpad)$/i;

export function redactMetadata(value: unknown, depth = 0): unknown {
  if (depth > 5 || value === null || value === undefined) return value ?? null;
  if (typeof value !== 'object') return typeof value === 'string' && value.length > 10000 ? value.slice(0, 10000) : value;
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => redactMetadata(item, depth + 1));
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !secretKey.test(key) && !forbiddenReasoningKey.test(key)).slice(0, 100).map(([key, item]) => [key, redactMetadata(item, depth + 1)]));
}

export function normalizeEvent(input: TraceEvent, index: number) {
  const spanId = String(input.spanId ?? input.span_id ?? `event-${index + 1}`);
  const rawType = String(input.type ?? input.eventType ?? input.operation ?? 'CUSTOM_EVENT').toUpperCase();
  const type = rawType.includes('TOOL') && rawType.includes('RESULT') ? 'TOOL_RESULT' : rawType.includes('TOOL') ? 'TOOL_CALL' : rawType.includes('MODEL') ? 'MODEL_CALL' : rawType.includes('RETRIEV') ? 'RETRIEVAL' : rawType.includes('MEMORY') && rawType.includes('WRITE') ? 'MEMORY_WRITE' : rawType.includes('MEMORY') ? 'MEMORY_READ' : rawType.includes('RETRY') ? 'RETRY' : rawType.includes('ERROR') ? 'ERROR' : rawType.includes('START') ? 'AGENT_START' : rawType.includes('END') || rawType.includes('OUTPUT') ? 'AGENT_OUTPUT' : rawType.includes('STATE') ? 'STATE_CHANGE' : 'CUSTOM_EVENT';
  const statusRaw = String(input.status ?? (input.error ? 'error' : 'ok')).toLowerCase();
  const status = /timeout/.test(statusRaw) ? 'timeout' : /error|fail|fatal/.test(statusRaw) ? 'error' : 'ok';
  const timestamp = input.startTime ?? input.timestamp;
  const startTime = timestamp ? new Date(typeof timestamp === 'number' ? timestamp : timestamp).toISOString() : undefined;
  return { spanId, parentSpanId: input.parentSpanId ?? input.parent_span_id ?? undefined, agent: input.agent, node: input.node, operation: input.operation, type, startTime, endTime: input.endTime ? new Date(typeof input.endTime === 'number' ? input.endTime : input.endTime).toISOString() : undefined, durationMs: input.durationMs ?? input.duration_ms, status, inputMetadata: redactMetadata(input.input ?? input.metadata), outputMetadata: redactMetadata(input.output), errorMetadata: redactMetadata(input.error ? { message: input.error } : undefined), modelMetadata: redactMetadata(input.model ?? input.modelMetadata), tokenUsage: redactMetadata(input.tokenUsage), hallucinationRisk: input.hallucinationRisk ?? input.hallucination_risk ?? 0 };
}

@Injectable()
export class AnalysisService {
  constructor(private prisma: PrismaService) {}

  async ingestExecution(userId: string, body: { projectId: string; traceId?: string; framework?: string; runtime?: string; environment?: string; events: TraceEvent[]; inputMetadata?: unknown; outputMetadata?: unknown; modelMetadata?: unknown; tokenUsage?: unknown; estimatedCost?: number }) {
    if (!body?.projectId || !Array.isArray(body.events) || body.events.length === 0) throw new BadRequestException('projectId and a non-empty events array are required');
    if (body.events.length > 10000) throw new BadRequestException('A single execution is limited to 10,000 events');
    const project = await this.prisma.project.findFirst({ where: { id: body.projectId, deletedAt: null, workspace: { ownerId: userId, deletedAt: null } } });
    if (!project) throw new ForbiddenException('Project is not in the authenticated workspace');
    const events = body.events.map(normalizeEvent);
    const execution = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const upload = await tx.upload.create({ data: { projectId: project.id, uploadStatus: 'COMPLETED', totalFiles: 1, completedAt: new Date() } });
      const created = await tx.execution.create({ data: { projectId: project.id, ownerId: userId, traceId: body.traceId ?? `trace_${Date.now()}`, framework: body.framework ?? 'generic', runtime: body.runtime, environment: body.environment, startTime: events[0]?.startTime ? new Date(events[0].startTime) : undefined, endTime: events.at(-1)?.endTime ? new Date(events.at(-1)!.endTime!) : undefined, durationMs: events.reduce((sum, event) => sum + (event.durationMs ?? 0), 0), status: events.some((event) => event.status === 'error') ? 'FAILED' : 'COMPLETED', inputMetadata: redactMetadata(body.inputMetadata) as any, outputMetadata: redactMetadata(body.outputMetadata) as any, errorMetadata: redactMetadata(events.find((event) => event.status === 'error')?.errorMetadata) as any, modelMetadata: redactMetadata(body.modelMetadata) as any, tokenUsage: redactMetadata(body.tokenUsage) as any, estimatedCost: body.estimatedCost } });
      await tx.executionEvent.createMany({ data: events.map((event) => ({ executionId: created.id, spanId: event.spanId, parentSpanId: event.parentSpanId, agent: event.agent, node: event.node, operation: event.operation, type: event.type, startTime: event.startTime ? new Date(event.startTime) : undefined, endTime: event.endTime ? new Date(event.endTime) : undefined, durationMs: event.durationMs, status: event.status, inputMetadata: event.inputMetadata as any, outputMetadata: event.outputMetadata as any, errorMetadata: event.errorMetadata as any, modelMetadata: event.modelMetadata as any, tokenUsage: event.tokenUsage as any })) });
      const candidates = events.filter((event) => event.status === 'error' || event.status === 'timeout' || event.type === 'RETRY' || event.hallucinationRisk >= 0.7);
      const root = candidates[0];
      const rootIndex = root ? events.indexOf(root) : -1;
      const downstream = root ? events.slice(rootIndex + 1).filter((event) => event.status !== 'ok' || events.indexOf(event) < rootIndex + 4).slice(0, 20) : [];
      const category = root ? root.type === 'RETRY' ? 'retry_storm' : root.type === 'TOOL_CALL' ? 'tool_failure' : root.type === 'RETRIEVAL' ? 'retrieval_failure' : root.type === 'MEMORY_WRITE' ? 'memory_contamination' : root.type === 'MODEL_CALL' ? 'model_failure' : root.hallucinationRisk >= 0.7 ? 'hallucination' : root.status === 'timeout' ? 'timeout' : 'workflow_failure' : 'no_observed_failure';
      const confidence = root ? Math.min(99, 58 + candidates.length * 8 + (root.parentSpanId ? 5 : 0)) : 34;
      const rootCause = root ? `The earliest observed causal break is ${root.type} at span ${root.spanId}${root.agent ? ` in ${root.agent}` : ''}. ${downstream.length} downstream event(s) follow this candidate.` : 'No explicit failure signal was observed in the normalized execution.';
      const recommendation = root ? category === 'tool_failure' ? 'Validate tool arguments against the registered schema, capture the tool result, and replay with the tool output mocked.' : category === 'retrieval_failure' ? 'Inspect query, result quality, and grounding checks at this span; replay with recorded documents.' : 'Capture a snapshot before this step, replay in a safe mode, and change one controlled variable at a time.' : 'Add outcome assertions and structured error metadata before treating this run as successful.';
      const analysis = await tx.analysis.create({ data: { projectId: project.id, uploadId: upload.id, executionId: created.id, status: 'COMPLETED', overallConfidence: confidence, summary: rootCause, desStepId: root?.spanId, desCategory: category, desSeverity: root ? downstream.length > 4 ? 'CRITICAL' : 'HIGH' : 'INFO', desConfidence: confidence, alternativeHypotheses: root ? ['The trace may be incomplete.', 'A framework adapter may have normalized a custom failure.'] : ['The failure may be represented in an unrecognized custom event.'], recommendation, completedAt: new Date() } });
      const nodes = events.map((event) => ({ analysisId: analysis.id, nodeName: event.spanId, nodeType: event.type, metadata: { agent: event.agent, operation: event.operation, status: event.status, parentSpanId: event.parentSpanId } }));
      await tx.dependencyNode.createMany({ data: nodes });
      const evidence = await tx.evidenceNode.createManyAndReturn({ data: events.filter((event) => event.spanId === root?.spanId || downstream.some((item) => item.spanId === event.spanId)).map((event) => ({ analysisId: analysis.id, evidenceType: event.spanId === root?.spanId ? 'observable' : 'inferred', title: `${event.type} · ${event.spanId}`, description: event.errorMetadata ? JSON.stringify(event.errorMetadata) : `Observed ${event.status} event in normalized execution order.`, confidence: event.spanId === root?.spanId ? 96 : 70, metadata: { spanId: event.spanId, agent: event.agent, operation: event.operation } })) });
      if (evidence.length > 1) await tx.evidenceEdge.createMany({ data: evidence.slice(1).map((item: { id: string }) => ({ sourceNodeId: evidence[0].id, targetNodeId: item.id, relationship: 'propagates_to', confidence: 72 })) });
      await tx.recommendation.create({ data: { analysisId: analysis.id, category, recommendation, priority: root ? 'HIGH' : 'LOW', impact: downstream.length ? `${downstream.length} downstream event(s)` : 'No observed propagation', effort: 'medium' } });
      return { execution: created, analysis, evidenceCount: evidence.length, downstreamCount: downstream.length };
    });
    return execution;
  }

  async getRca(userId: string, executionId: string) {
    const execution = await this.prisma.execution.findFirst({ where: { id: executionId, ownerId: userId }, include: { analyses: { orderBy: { createdAt: 'desc' }, take: 1, include: { evidenceNodes: true, recommendations: true } } } });
    if (!execution) throw new NotFoundException('Execution not found');
    return { execution, analysis: execution.analyses[0] ?? null };
  }

  async getGraph(userId: string, executionId: string) {
    const execution = await this.prisma.execution.findFirst({ where: { id: executionId, ownerId: userId }, include: { events: { orderBy: { startTime: 'asc' } }, analyses: { orderBy: { createdAt: 'desc' }, take: 1, include: { dependencyNodes: true, dependencyEdges: true } } } });
    if (!execution) throw new NotFoundException('Execution not found');
    return { executionId, nodes: execution.events, analysis: execution.analyses[0] ?? null };
  }

  async getTimeline(userId: string, executionId: string) {
    const execution = await this.prisma.execution.findFirst({ where: { id: executionId, ownerId: userId }, include: { events: { orderBy: { startTime: 'asc' } } } });
    if (!execution) throw new NotFoundException('Execution not found');
    return execution.events;
  }
}
