import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createAgent, createAgentVersion, createAnalysisBundle, createDiff, createEvaluation, createEvaluationRun, createExecution, createExperiment, createFork, createReplay, createReplayResult, createSnapshot, getAnalysisBundle, getExecution, getReplay, listAgentVersions, listAgents, listDiffs, listEvaluationRuns, listEvaluations, listExecutions, listExperiments, listReplays, listSnapshots, updateEvaluationScore, updateReplayStatus } from "./db";
import { normalizeTrace } from "./trace-normalizer";
import { analyzeTrace, diffTraces } from "./analysis";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  trace: router({
    normalize: publicProcedure.input(z.object({ rawTrace: z.string().min(1).max(2_000_000) })).mutation(({ input }) => normalizeTrace(input.rawTrace)),
  }),

  workspace: router({
    agents: protectedProcedure.query(({ ctx }) => listAgents(ctx.user.id)),
    createAgent: protectedProcedure.input(z.object({ name: z.string().min(2).max(160), framework: z.string().min(2).max(64), config: z.record(z.string(), z.unknown()).default({}) })).mutation(({ ctx, input }) => createAgent({ userId: ctx.user.id, name: input.name, framework: input.framework, config: JSON.stringify(input.config) })),
    agentVersions: protectedProcedure.input(z.object({ agentId: z.number().int().positive() })).query(({ ctx, input }) => listAgentVersions(ctx.user.id, input.agentId)),
    createAgentVersion: protectedProcedure.input(z.object({ agentId: z.number().int().positive(), version: z.string().min(1).max(32), status: z.enum(["draft", "staged", "production", "archived"]).optional(), config: z.record(z.string(), z.unknown()).default({}) })).mutation(({ ctx, input }) => createAgentVersion({ userId: ctx.user.id, agentId: input.agentId, version: input.version, status: input.status, config: JSON.stringify(input.config) })),
    executions: protectedProcedure.query(({ ctx }) => listExecutions(ctx.user.id)),
    ingest: protectedProcedure.input(z.object({ rawTrace: z.string().min(1).max(2_000_000), agentId: z.number().int().positive().optional() })).mutation(async ({ ctx, input }) => {
      const normalized = normalizeTrace(input.rawTrace);
      const failed = normalized.summary.errors > 0;
      return createExecution({ userId: ctx.user.id, agentId: input.agentId, externalId: normalized.runId, framework: normalized.framework, eventCount: normalized.events.length, rootCause: failed ? normalized.events.find((event) => event.status === "error")?.name : undefined, normalizedEvents: JSON.stringify(normalized.events), metadata: JSON.stringify({ summary: normalized.summary, warnings: normalized.warnings }) });
    }),
    experiments: protectedProcedure.query(({ ctx }) => listExperiments(ctx.user.id)),
    createExperiment: protectedProcedure.input(z.object({ name: z.string().min(2).max(160), hypothesis: z.string().min(2), agentId: z.number().int().positive().optional(), config: z.record(z.string(), z.unknown()).default({}) })).mutation(({ ctx, input }) => createExperiment({ userId: ctx.user.id, agentId: input.agentId, name: input.name, hypothesis: input.hypothesis, config: JSON.stringify(input.config) })),
    evaluations: protectedProcedure.query(({ ctx }) => listEvaluations(ctx.user.id)),
    createEvaluation: protectedProcedure.input(z.object({ name: z.string().min(2).max(160), rubric: z.string().min(2), agentId: z.number().int().positive().optional(), executionId: z.number().int().positive().optional(), score: z.number().int().min(0).max(100).optional() })).mutation(({ ctx, input }) => createEvaluation({ userId: ctx.user.id, ...input })),
    snapshots: protectedProcedure.input(z.object({ executionId: z.number().int().positive() })).query(({ ctx, input }) => listSnapshots(ctx.user.id, input.executionId)),
    createSnapshot: protectedProcedure.input(z.object({ executionId: z.number().int().positive(), name: z.string().min(2).max(160), stepId: z.string().min(1).max(120), state: z.record(z.string(), z.unknown()).default({}), metadata: z.record(z.string(), z.unknown()).default({}) })).mutation(({ ctx, input }) => createSnapshot({ userId: ctx.user.id, executionId: input.executionId, name: input.name, stepId: input.stepId, state: JSON.stringify(input.state), metadata: JSON.stringify(input.metadata) })),
    replays: protectedProcedure.input(z.object({ executionId: z.number().int().positive() })).query(({ ctx, input }) => listReplays(ctx.user.id, input.executionId)),
    createReplay: protectedProcedure.input(z.object({ executionId: z.number().int().positive(), snapshotId: z.number().int().positive().optional(), mode: z.enum(["sandbox", "mock_tools", "recorded_tools", "read_only"]), overrides: z.record(z.string(), z.unknown()).default({}) })).mutation(({ ctx, input }) => createReplay({ userId: ctx.user.id, executionId: input.executionId, snapshotId: input.snapshotId, mode: input.mode, overrides: JSON.stringify(input.overrides) })),
    createFork: protectedProcedure.input(z.object({ executionId: z.number().int().positive(), snapshotId: z.number().int().positive().optional(), name: z.string().min(2).max(160), changes: z.record(z.string(), z.unknown()).default({}) })).mutation(({ ctx, input }) => createFork({ userId: ctx.user.id, executionId: input.executionId, snapshotId: input.snapshotId, name: input.name, changes: JSON.stringify(input.changes) })),
    analyzeExecution: protectedProcedure.input(z.object({ executionId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const execution = await getExecution(ctx.user.id, input.executionId);
      if (!execution) throw new Error("Execution not found in this workspace");
      const normalized = { framework: execution.framework as "opentelemetry" | "langgraph" | "langchain" | "crewai" | "autogen" | "generic", runId: execution.externalId, events: JSON.parse(execution.normalizedEvents), summary: JSON.parse(execution.metadata).summary ?? { agents: 0, tools: 0, errors: 0 }, warnings: [] };
      const result = analyzeTrace(normalized);
      const saved = await createAnalysisBundle({ userId: ctx.user.id, executionId: input.executionId, decisiveStep: result.decisiveStep, category: result.category, severity: result.severity, confidence: result.confidence, rootCause: result.rootCause, recommendation: result.recommendation, alternatives: JSON.stringify(result.alternatives), propagation: JSON.stringify(result.propagation) }, { evidence: result.evidence, propagation: result.propagation });
      return { ...saved, evidence: result.evidence, propagation: result.propagation };
    }),
    analysis: protectedProcedure.input(z.object({ executionId: z.number().int().positive() })).query(({ ctx, input }) => getAnalysisBundle(ctx.user.id, input.executionId)),
    createDiff: protectedProcedure.input(z.object({ leftExecutionId: z.number().int().positive(), rightExecutionId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const [left, right] = await Promise.all([getExecution(ctx.user.id, input.leftExecutionId), getExecution(ctx.user.id, input.rightExecutionId)]);
      if (!left || !right) throw new Error("Both executions must belong to this workspace");
      const diff = diffTraces(left.id, left, right.id, right);
      return createDiff({ userId: ctx.user.id, leftExecutionId: left.id, rightExecutionId: right.id, summary: diff.summary, changes: JSON.stringify(diff.changes) });
    }),
    diffs: protectedProcedure.query(({ ctx }) => listDiffs(ctx.user.id)),
    executeReplay: protectedProcedure.input(z.object({ replayId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const replay = await getReplay(ctx.user.id, input.replayId);
      if (!replay) throw new Error("Replay not found in this workspace");
      const source = await getExecution(ctx.user.id, replay.executionId);
      if (!source) throw new Error("Source execution not found in this workspace");
      await updateReplayStatus(ctx.user.id, replay.id, "running", "Safe replay is restoring the normalized event stream.");
      const resultExecution = await createExecution({ userId: ctx.user.id, agentId: source.agentId ?? undefined, externalId: `replay_${replay.id}_${Date.now()}`, framework: source.framework, eventCount: source.eventCount, rootCause: source.rootCause ?? undefined, normalizedEvents: source.normalizedEvents, metadata: JSON.stringify({ replayOf: source.id, replayId: replay.id, mode: replay.mode, overrides: JSON.parse(replay.overrides), safety: "recorded normalized replay; no external tools invoked" }) });
      const result = await createReplayResult({ userId: ctx.user.id, replayId: replay.id, resultExecutionId: resultExecution?.id, status: "completed", summary: `Created replay execution from source ${source.id} using ${replay.mode.replaceAll("_", " ")} mode.`, divergence: JSON.stringify({ eventCount: 0, note: "No external tool calls were invoked by the safe replay service." }) });
      await updateReplayStatus(ctx.user.id, replay.id, "completed", JSON.stringify(result));
      return { replay, resultExecution, result };
    }),
    evaluationRuns: protectedProcedure.input(z.object({ evaluationId: z.number().int().positive() })).query(({ ctx, input }) => listEvaluationRuns(ctx.user.id, input.evaluationId)),
    runEvaluation: protectedProcedure.input(z.object({ evaluationId: z.number().int().positive(), executionId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const execution = await getExecution(ctx.user.id, input.executionId);
      if (!execution) throw new Error("Execution not found in this workspace");
      const events = JSON.parse(execution.normalizedEvents) as Array<{ status?: string; type?: string }>;
      const errors = events.filter((event) => event.status === "error").length;
      const retries = events.filter((event) => event.type === "RETRY").length;
      const quality = Math.max(35, 100 - errors * 15);
      const groundedness = Math.max(35, 100 - errors * 12);
      const trajectory = Math.max(35, 100 - retries * 12 - errors * 8);
      const latency = Math.max(35, 100 - Math.min(60, execution.eventCount * 2));
      const cost = Math.max(35, 100 - Math.min(60, execution.eventCount));
      const score = Math.round((quality + groundedness + trajectory + latency + cost) / 5);
      const run = await createEvaluationRun({ userId: ctx.user.id, evaluationId: input.evaluationId, executionId: input.executionId, score, quality, groundedness, trajectory, latency, cost, notes: `Derived from ${execution.eventCount} normalized events, ${errors} error signal(s), and ${retries} retry signal(s).` });
      await updateEvaluationScore(ctx.user.id, input.evaluationId, score);
      return run;
    }),
    createEvaluationRun: protectedProcedure.input(z.object({ evaluationId: z.number().int().positive(), executionId: z.number().int().positive(), score: z.number().int().min(0).max(100), quality: z.number().int().min(0).max(100), groundedness: z.number().int().min(0).max(100), trajectory: z.number().int().min(0).max(100), latency: z.number().int().min(0).max(100), cost: z.number().int().min(0).max(100), notes: z.string().optional() })).mutation(({ ctx, input }) => createEvaluationRun({ userId: ctx.user.id, ...input })),
  }),
});

export type AppRouter = typeof appRouter;
