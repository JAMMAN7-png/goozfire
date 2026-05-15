import { Hono } from "hono";
import { apiKeyAuth } from "../auth/middleware";
import { createJob, getJob, processJob } from "../engine/jobs";
import { trackUsage } from "./middleware";

export const batchRoutes = new Hono();

// POST /batch - Start a batch extraction job
batchRoutes.post("/batch", apiKeyAuth, async (c) => {
  const user = c.get("user");
  const apiKeyId = c.get("api_key_id") || null;
  const startTime = Date.now();

  try {
    const body = await c.req.json();
    const { items, prompt, schema, input_field, concurrency } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return c.json({ error: "Items array is required" }, 400);
    }
    if (!prompt || typeof prompt !== "string") {
      return c.json({ error: "Extraction prompt is required" }, 400);
    }
    if (items.length > 100) {
      return c.json({ error: "Maximum 100 items per batch" }, 400);
    }

    // Create async job
    const job = createJob(user.userId, "batch", {
      items,
      prompt,
      schema,
      input_field,
      concurrency: concurrency || 3,
    });

    // Process in background
    processJob(job).catch(() => {});

    await trackUsage(user.userId, apiKeyId, "/batch", "POST", 201, items.length, Date.now() - startTime);

    return c.json({
      success: true,
      job_id: job.id,
      status: job.status,
      total_items: items.length,
      message: "Batch job created. Check status with GET /batch/:id",
    }, 201);
  } catch (error: any) {
    await trackUsage(user.userId, apiKeyId, "/batch", "POST", 500, 1, Date.now() - startTime);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET /batch/:id - Check batch job status
batchRoutes.get("/batch/:id", apiKeyAuth, async (c) => {
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
    results: result?.results || null,
    error: job.error,
    created_at: job.created_at,
    completed_at: job.completed_at,
  });
});
