import { Hono } from "hono";
import { apiKeyAuth } from "../auth/middleware";
import { createJob, getJob, processJob } from "../engine/jobs";
import { trackUsage } from "./middleware";

export const researchRoutes = new Hono();

// POST /research - Start a deep research task
researchRoutes.post("/research", apiKeyAuth, async (c) => {
  const user = c.get("user");
  const apiKeyId = c.get("api_key_id") || null;
  const startTime = Date.now();

  try {
    const body = await c.req.json();
    const { question, max_sources, depth } = body;

    if (!question || typeof question !== "string" || question.trim().length < 5) {
      return c.json({ error: "A research question of at least 5 characters is required" }, 400);
    }

    // Create async job
    const job = createJob(user.userId, "research", {
      question: question.trim(),
      max_sources: max_sources || 10,
      depth: depth || "basic",
    });

    // Process in background (fire-and-forget)
    processJob(job).catch(() => {});

    await trackUsage(user.userId, apiKeyId, "/research", "POST", 201, 5, Date.now() - startTime);

    return c.json({
      success: true,
      job_id: job.id,
      status: job.status,
      message: "Research job created. Check status with GET /research/:id",
    }, 201);
  } catch (error: any) {
    await trackUsage(user.userId, apiKeyId, "/research", "POST", 500, 5, Date.now() - startTime);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET /research/:id - Check research job status
researchRoutes.get("/research/:id", apiKeyAuth, async (c) => {
  const user = c.get("user");
  const jobId = parseInt(c.req.param("id") || "0");

  if (isNaN(jobId)) {
    return c.json({ error: "Invalid job ID" }, 400);
  }

  const job = getJob(jobId);
  if (!job || job.user_id !== user.userId) {
    return c.json({ error: "Job not found" }, 404);
  }

  const result = job.output ? JSON.parse(job.output) : null;

  return c.json({
    success: job.status === "completed",
    job_id: job.id,
    status: job.status,
    progress: job.progress,
    report: result?.report || null,
    error: job.error,
    created_at: job.created_at,
    completed_at: job.completed_at,
  });
});
