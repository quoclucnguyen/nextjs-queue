import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { and, desc, eq, type SQL } from "drizzle-orm";

/**
 * Completion status enum
 */
export enum CompletionStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

/**
 * Completions table schema
 * Matches TypeORM entity structure
 */
export const completions = pgTable("completions", {
  id: uuid("id").primaryKey().defaultRandom(),
  completionId: text("completion_id").notNull().unique(),
  model: text("model").notNull(),
  userMessage: text("user_message").notNull(),
  systemMessage: text("system_message"),
  status: text("status").$type<CompletionStatus>().default(CompletionStatus.PENDING).notNull(),
  responseContent: text("response_content"),
  responseTokens: integer("response_tokens"),
  promptTokens: integer("prompt_tokens"),
  totalTokens: integer("total_tokens"),
  finishReason: text("finish_reason"),
  rawResponse: text("raw_response").$type<Record<string, unknown>>(),
  errorMessage: text("error_message"),
  attemptedAt: timestamp("attempted_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Database connection
 */
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export const db = drizzle(neon(DATABASE_URL));

/**
 * Get completion by ID
 */
export async function getCompletionById(id: string) {
  const result = await db
    .select()
    .from(completions)
    .where(eq(completions.id, id))
    .limit(1);

  return result[0] ?? null;
}

/**
 * Get completion by completionId
 */
export async function getCompletionByCompletionId(completionId: string) {
  const result = await db
    .select()
    .from(completions)
    .where(eq(completions.completionId, completionId))
    .limit(1);

  return result[0] ?? null;
}

/**
 * List completions with optional filters
 */
export async function listCompletions(options: {
  status?: CompletionStatus;
  limit?: number;
  offset?: number;
} = {}) {
  const { status, limit = 50, offset = 0 } = options;

  const filters: SQL[] = [];

  if (status) {
    filters.push(eq(completions.status, status));
  }

  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  return await db
    .select()
    .from(completions)
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(completions.createdAt));
}
