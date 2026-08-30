import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  framework: varchar("framework", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["active", "archived"]).default("active").notNull(),
  version: varchar("version", { length: 32 }).default("v1").notNull(),
  config: text("config").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

export const executions = mysqlTable("executions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  agentId: int("agentId"),
  externalId: varchar("externalId", { length: 120 }).notNull(),
  framework: varchar("framework", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["queued", "running", "completed", "failed"]).default("completed").notNull(),
  eventCount: int("eventCount").default(0).notNull(),
  rootCause: varchar("rootCause", { length: 160 }),
  normalizedEvents: text("normalizedEvents").notNull(),
  metadata: text("metadata").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Execution = typeof executions.$inferSelect;
export type InsertExecution = typeof executions.$inferInsert;

export const experiments = mysqlTable("experiments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  agentId: int("agentId"),
  name: varchar("name", { length: 160 }).notNull(),
  status: mysqlEnum("status", ["draft", "running", "completed"]).default("draft").notNull(),
  hypothesis: text("hypothesis").notNull(),
  config: text("config").notNull(),
  result: text("result"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Experiment = typeof experiments.$inferSelect;
export type InsertExperiment = typeof experiments.$inferInsert;

export const evaluations = mysqlTable("evaluations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  agentId: int("agentId"),
  executionId: int("executionId"),
  name: varchar("name", { length: 160 }).notNull(),
  status: mysqlEnum("status", ["draft", "running", "completed"]).default("draft").notNull(),
  score: int("score"),
  rubric: text("rubric").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Evaluation = typeof evaluations.$inferSelect;
export type InsertEvaluation = typeof evaluations.$inferInsert;

export const snapshots = mysqlTable("snapshots", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  executionId: int("executionId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  stepId: varchar("stepId", { length: 120 }).notNull(),
  state: text("state").notNull(),
  metadata: text("metadata").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Snapshot = typeof snapshots.$inferSelect;
export type InsertSnapshot = typeof snapshots.$inferInsert;

export const replays = mysqlTable("replays", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  executionId: int("executionId").notNull(),
  snapshotId: int("snapshotId"),
  mode: mysqlEnum("mode", ["sandbox", "mock_tools", "recorded_tools", "read_only"]).default("sandbox").notNull(),
  status: mysqlEnum("status", ["queued", "running", "completed", "failed"]).default("queued").notNull(),
  overrides: text("overrides").notNull(),
  result: text("result"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Replay = typeof replays.$inferSelect;
export type InsertReplay = typeof replays.$inferInsert;

export const forks = mysqlTable("forks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  executionId: int("executionId").notNull(),
  snapshotId: int("snapshotId"),
  name: varchar("name", { length: 160 }).notNull(),
  changes: text("changes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Fork = typeof forks.$inferSelect;
export type InsertFork = typeof forks.$inferInsert;

export const evaluationRuns = mysqlTable("evaluationRuns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  evaluationId: int("evaluationId").notNull(),
  executionId: int("executionId").notNull(),
  score: int("score").notNull(),
  quality: int("quality").notNull(),
  groundedness: int("groundedness").notNull(),
  trajectory: int("trajectory").notNull(),
  latency: int("latency").notNull(),
  cost: int("cost").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EvaluationRun = typeof evaluationRuns.$inferSelect;
export type InsertEvaluationRun = typeof evaluationRuns.$inferInsert;
