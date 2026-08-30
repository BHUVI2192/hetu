import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { Agent, agents, Evaluation, evaluations, Execution, executions, Experiment, experiments, InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function listAgents(userId: number) {
  const db = await getDb();
  return db ? db.select().from(agents).where(eq(agents.userId, userId)) : [] as Agent[];
}

export async function createAgent(input: { userId: number; name: string; framework: string; config: string }) {
  const db = await getDb();
  if (!db) return { id: 0, ...input, version: "v1", status: "active" as const };
  await db.insert(agents).values(input);
  const rows = await db.select().from(agents).where(eq(agents.userId, input.userId));
  return rows.at(-1);
}

export async function listExecutions(userId: number) {
  const db = await getDb();
  return db ? db.select().from(executions).where(eq(executions.userId, userId)) : [] as Execution[];
}

export async function createExecution(input: { userId: number; agentId?: number; externalId: string; framework: string; eventCount: number; rootCause?: string; normalizedEvents: string; metadata: string }) {
  const db = await getDb();
  if (!db) return { id: 0, ...input, status: "completed" as const };
  await db.insert(executions).values(input);
  const rows = await db.select().from(executions).where(eq(executions.userId, input.userId));
  return rows.at(-1);
}

export async function listExperiments(userId: number) {
  const db = await getDb();
  return db ? db.select().from(experiments).where(eq(experiments.userId, userId)) : [] as Experiment[];
}

export async function createExperiment(input: { userId: number; agentId?: number; name: string; hypothesis: string; config: string }) {
  const db = await getDb();
  if (!db) return { id: 0, ...input, status: "draft" as const };
  await db.insert(experiments).values(input);
  const rows = await db.select().from(experiments).where(eq(experiments.userId, input.userId));
  return rows.at(-1);
}

export async function listEvaluations(userId: number) {
  const db = await getDb();
  return db ? db.select().from(evaluations).where(eq(evaluations.userId, userId)) : [] as Evaluation[];
}

export async function createEvaluation(input: { userId: number; agentId?: number; executionId?: number; name: string; rubric: string; score?: number }) {
  const db = await getDb();
  if (!db) return { id: 0, ...input, status: "completed" as const };
  await db.insert(evaluations).values(input);
  const rows = await db.select().from(evaluations).where(eq(evaluations.userId, input.userId));
  return rows.at(-1);
}
