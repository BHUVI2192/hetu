import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { createAgent, createExecution, createEvaluation, createEvaluationRun, createFork, createReplay, createSnapshot, getExecution, listAgents, listEvaluationRuns, listEvaluations, listExecutions, listReplays, listSnapshots } from "./db";
import { normalizeTrace } from "./trace-normalizer";
import { sdk } from "./_core/sdk";

async function requireUser(req: Request) {
  return sdk.authenticateRequest(req as never);
}

function handler(action: (req: Request, res: Response, userId: number) => Promise<unknown>) {
  return async (req: Request, res: Response) => {
    try { const user = await requireUser(req); res.json(await action(req, res, user.id)); }
    catch (error) { res.status(401).json({ error: error instanceof Error ? error.message : "Unauthorized" }); }
  };
}

export function registerRestRoutes(app: Express) {
  app.post("/api/v1/trace/normalize", async (req, res) => {
    const parsed = z.object({ rawTrace: z.string().min(1).max(2_000_000) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "rawTrace is required" });
    return res.json(normalizeTrace(parsed.data.rawTrace));
  });
  app.get("/api/v1/agents", handler(async (_req, _res, userId) => listAgents(userId)));
  app.post("/api/v1/agents", handler(async (req, _res, userId) => {
    const input = z.object({ name: z.string().min(2).max(160), framework: z.string().min(2).max(64), config: z.record(z.string(), z.unknown()).default({}) }).parse(req.body);
    return createAgent({ userId, name: input.name, framework: input.framework, config: JSON.stringify(input.config) });
  }));
  app.get("/api/v1/executions", handler(async (_req, _res, userId) => listExecutions(userId)));
  app.post("/api/v1/executions", handler(async (req, _res, userId) => {
    const input = z.object({ rawTrace: z.string().min(1).max(2_000_000), agentId: z.number().int().positive().optional() }).parse(req.body);
    const normalized = normalizeTrace(input.rawTrace);
    return createExecution({ userId, agentId: input.agentId, externalId: normalized.runId, framework: normalized.framework, eventCount: normalized.events.length, rootCause: normalized.events.find((event) => event.status === "error")?.name, normalizedEvents: JSON.stringify(normalized.events), metadata: JSON.stringify(normalized.summary) });
  }));
  app.get("/api/v1/executions/:executionId/snapshots", handler(async (req, _res, userId) => listSnapshots(userId, Number(req.params.executionId))));
  app.post("/api/v1/executions/:executionId/snapshots", handler(async (req, _res, userId) => { const input = z.object({ name: z.string().min(2), stepId: z.string().min(1), state: z.record(z.string(), z.unknown()).default({}), metadata: z.record(z.string(), z.unknown()).default({}) }).parse(req.body); return createSnapshot({ userId, executionId: Number(req.params.executionId), name: input.name, stepId: input.stepId, state: JSON.stringify(input.state), metadata: JSON.stringify(input.metadata) }); }));
  app.get("/api/v1/executions/:executionId/replays", handler(async (req, _res, userId) => listReplays(userId, Number(req.params.executionId))));
  app.post("/api/v1/executions/:executionId/replays", handler(async (req, _res, userId) => { const input = z.object({ snapshotId: z.number().int().positive().optional(), mode: z.enum(["sandbox", "mock_tools", "recorded_tools", "read_only"]), overrides: z.record(z.string(), z.unknown()).default({}) }).parse(req.body); return createReplay({ userId, executionId: Number(req.params.executionId), snapshotId: input.snapshotId, mode: input.mode, overrides: JSON.stringify(input.overrides) }); }));
  app.post("/api/v1/executions/:executionId/forks", handler(async (req, _res, userId) => { const input = z.object({ snapshotId: z.number().int().positive().optional(), name: z.string().min(2), changes: z.record(z.string(), z.unknown()).default({}) }).parse(req.body); return createFork({ userId, executionId: Number(req.params.executionId), snapshotId: input.snapshotId, name: input.name, changes: JSON.stringify(input.changes) }); }));
  app.get("/api/v1/evaluations", handler(async (_req, _res, userId) => listEvaluations(userId)));
  app.post("/api/v1/evaluations", handler(async (req, _res, userId) => { const input = z.object({ name: z.string().min(2), rubric: z.string().min(2) }).parse(req.body); return createEvaluation({ userId, ...input }); }));
  app.get("/api/v1/evaluations/:evaluationId/runs", handler(async (req, _res, userId) => listEvaluationRuns(userId, Number(req.params.evaluationId))));
  app.post("/api/v1/evaluations/:evaluationId/runs", handler(async (req, res, userId) => { const input = z.object({ executionId: z.number().int().positive() }).parse(req.body); const execution = await getExecution(userId, input.executionId); if (!execution) return res.status(404).json({ error: "Execution not found" }); const events = JSON.parse(execution.normalizedEvents) as Array<{ status?: string; type?: string }>; const errors = events.filter((event) => event.status === "error").length; const retries = events.filter((event) => event.type === "RETRY").length; const quality = Math.max(35, 100 - errors * 15); const groundedness = Math.max(35, 100 - errors * 12); const trajectory = Math.max(35, 100 - retries * 12 - errors * 8); const latency = Math.max(35, 100 - Math.min(60, execution.eventCount * 2)); const cost = Math.max(35, 100 - Math.min(60, execution.eventCount)); const score = Math.round((quality + groundedness + trajectory + latency + cost) / 5); return createEvaluationRun({ userId, evaluationId: Number(req.params.evaluationId), executionId: input.executionId, score, quality, groundedness, trajectory, latency, cost, notes: `Derived from ${execution.eventCount} normalized events.` }); }));
}
