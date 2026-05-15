/**
 * Job Queue System
 * Tracks async jobs (research, batch, crawl) with status updates.
 */
import { getDb } from "../db";
import { runResearch } from "./research";
import { processBatch } from "./batch";
import type { Job, JobStatus } from "@goozfire/shared";
import { deliverWebhook } from "./webhooks";

/**
 * Create a new job.
 */
export function createJob(
  userId: number,
  type: string,
  input: Record<string, unknown>
): Job {
  const db = getDb();
  const result = db
    .query(
      `INSERT INTO jobs (user_id, type, status, input) VALUES (?, ?, 'queued', ?)`
    )
    .run(userId, type, JSON.stringify(input));

  return {
    id: Number(result.lastInsertRowid),
    user_id: userId,
    type: type as any,
    status: "queued",
    input: JSON.stringify(input),
    output: null,
    error: null,
    progress: 0,
    credits_used: 0,
    created_at: new Date().toISOString(),
    started_at: null,
    completed_at: null,
  };
}

/**
 * Update a job's status.
 */
export function updateJob(
  jobId: number,
  updates: {
    status?: JobStatus;
    output?: string;
    error?: string;
    progress?: number;
    credits_used?: number;
  }
): void {
  const db = getDb();
  const sets: string[] = [];
  const values: any[] = [];

  if (updates.status) {
    sets.push("status = ?");
    values.push(updates.status);
    if (updates.status === "processing") {
      sets.push("started_at = datetime('now')");
    }
    if (updates.status === "completed" || updates.status === "failed") {
      sets.push("completed_at = datetime('now')");
    }
  }
  if (updates.output !== undefined) {
    sets.push("output = ?");
    values.push(updates.output);
  }
  if (updates.error !== undefined) {
    sets.push("error = ?");
    values.push(updates.error);
  }
  if (updates.progress !== undefined) {
    sets.push("progress = ?");
    values.push(updates.progress);
  }
  if (updates.credits_used !== undefined) {
    sets.push("credits_used = ?");
    values.push(updates.credits_used);
  }

  if (sets.length > 0) {
    values.push(jobId);
    db.run(`UPDATE jobs SET ${sets.join(", ")} WHERE id = ?`, values);
  }
}

/**
 * Get a job by ID.
 */
export function getJob(jobId: number): Job | null {
  const db = getDb();
  const row = db.query("SELECT * FROM jobs WHERE id = ?").get(jobId) as any;
  if (!row) return null;
  return rowToJob(row);
}

/**
 * List jobs for a user.
 */
export function listJobs(
  userId: number,
  options?: { type?: string; status?: string; limit?: number; offset?: number }
): { jobs: Job[]; total: number } {
  const db = getDb();
  const conditions: string[] = ["user_id = ?"];
  const values: any[] = [userId];

  if (options?.type) {
    conditions.push("type = ?");
    values.push(options.type);
  }
  if (options?.status) {
    conditions.push("status = ?");
    values.push(options.status);
  }

  const where = conditions.join(" AND ");
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;

  const total = (
    db.query(`SELECT COUNT(*) as count FROM jobs WHERE ${where}`).get(...values) as any
  ).count;

  const rows = db
    .query(
      `SELECT * FROM jobs WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
    .all(...values, limit, offset) as any[];

  return {
    jobs: rows.map(rowToJob),
    total,
  };
}

/**
 * Process an async job in the background.
 */
export async function processJob(job: Job): Promise<void> {
  // Prevent multiple processing
  const current = getJob(job.id);
  if (!current || current.status !== "queued") return;

  updateJob(job.id, { status: "processing", progress: 10 });

  try {
    const input = JSON.parse(job.input);

    if (job.type === "research") {
      const result = await runResearch(
        input.question,
        input
      );
      updateJob(job.id, {
        status: result.success ? "completed" : "failed",
        output: JSON.stringify(result),
        credits_used: result.report?.credits_used || 0,
        progress: 100,
        error: result.error || undefined,
      });
    } else if (job.type === "batch") {
      const result = await processBatch(input, { concurrency: input.concurrency || 3 });
      updateJob(job.id, {
        status: result.success ? "completed" : "failed",
        output: JSON.stringify(result),
        progress: 100,
        error: result.error || undefined,
      });
    } else {
      throw new Error(`Unknown job type: ${job.type}`);
    }

    // Fire webhooks
    const updatedJob = getJob(job.id);
    if (updatedJob) {
      await deliverWebhook(job.user_id, "job.completed", updatedJob);
    }
  } catch (err: any) {
    updateJob(job.id, {
      status: "failed",
      error: err.message,
      progress: 100,
    });
    const failedJob = getJob(job.id);
    if (failedJob) {
      await deliverWebhook(job.user_id, "job.failed", failedJob);
    }
  }
}

function rowToJob(row: any): Job {
  return {
    id: row.id,
    user_id: row.user_id,
    type: row.type,
    status: row.status,
    input: row.input,
    output: row.output,
    error: row.error,
    progress: row.progress,
    credits_used: row.credits_used,
    created_at: row.created_at,
    started_at: row.started_at,
    completed_at: row.completed_at,
  };
}
