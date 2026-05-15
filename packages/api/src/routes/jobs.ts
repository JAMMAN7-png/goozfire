import { Hono } from "hono";
import { apiKeyAuth } from "../auth/middleware";
import { createJob, getJob, listJobs, processJob, updateJob } from "../engine/jobs";
import { trackUsage } from "./middleware";

export const jobsRoutes = new Hono();

// GET /jobs - List jobs for current user
jobsRoutes.get("/jobs", apiKeyAuth, async (c) => {
  const user = c.get("user");
  const type = c.req.query("type") || undefined;
  const status = c.req.query("status") || undefined;
  const limit = parseInt(c.req.query("limit") || "20");
  const offset = parseInt(c.req.query("offset") || "0");

  const result = listJobs(user.userId, { type, status, limit, offset });

  return c.json({
    success: true,
    jobs: result.jobs.map((j) => ({
      id: j.id,
      type: j.type,
      status: j.status,
      progress: j.progress,
      credits_used: j.credits_used,
      created_at: j.created_at,
      started_at: j.started_at,
      completed_at: j.completed_at,
      error: j.error,
    })),
    total: result.total,
  });
});

// POST /jobs - Create a job (manually specify type and input)
jobsRoutes.post("/jobs", apiKeyAuth, async (c) => {
  const user = c.get("user");
  const startTime = Date.now();

  try {
    const body = await c.req.json();
    const { type, input, auto_process } = body;

    const validTypes = ["research", "batch", "crawl", "extract"];
    if (!type || !validTypes.includes(type)) {
      return c.json({ error: `Type must be one of: ${validTypes.join(", ")}` }, 400);
    }
    if (!input || typeof input !== "object") {
      return c.json({ error: "Input object is required" }, 400);
    }

    const job = createJob(user.userId, type, input);

    if (auto_process !== false) {
      processJob(job).catch(() => {});
    }

    await trackUsage(user.userId, null, "/jobs", "POST", 201, 1, Date.now() - startTime);

    return c.json({
      success: true,
      job: {
        id: job.id,
        type: job.type,
        status: job.status,
        created_at: job.created_at,
      },
    }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET /jobs/:id - Get a specific job
jobsRoutes.get("/jobs/:id", apiKeyAuth, async (c) => {
  const user = c.get("user");
  const jobId = parseInt(c.req.param("id") || "0");

  if (isNaN(jobId)) return c.json({ error: "Invalid job ID" }, 400);

  const job = getJob(jobId);
  if (!job || job.user_id !== user.userId) {
    return c.json({ error: "Job not found" }, 404);
  }

  return c.json({
    success: true,
    job: {
      id: job.id,
      type: job.type,
      status: job.status,
      input: JSON.parse(job.input),
      output: job.output ? JSON.parse(job.output) : null,
      error: job.error,
      progress: job.progress,
      credits_used: job.credits_used,
      created_at: job.created_at,
      started_at: job.started_at,
      completed_at: job.completed_at,
    },
  });
});

// DELETE /jobs/:id - Cancel a queued job
jobsRoutes.delete("/jobs/:id", apiKeyAuth, async (c) => {
  const user = c.get("user");
  const jobId = parseInt(c.req.param("id") || "0");

  if (isNaN(jobId)) return c.json({ error: "Invalid job ID" }, 400);

  const job = getJob(jobId);
  if (!job || job.user_id !== user.userId) {
    return c.json({ error: "Job not found" }, 404);
  }

  if (job.status !== "queued") {
    return c.json({ error: "Can only cancel queued jobs" }, 400);
  }

  updateJob(jobId, { status: "failed", error: "Cancelled by user" });

  return c.json({ success: true, message: "Job cancelled" });
});
