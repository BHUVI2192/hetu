import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createAgent, createEvaluation, createExecution, createExperiment, listAgents, listEvaluations, listExecutions, listExperiments } from "./db";
import { normalizeTrace } from "./trace-normalizer";

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
  }),
});

export type AppRouter = typeof appRouter;
