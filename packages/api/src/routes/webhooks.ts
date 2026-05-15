import { Hono } from "hono";
import { jwtAuth } from "../auth/middleware";
import {
  createWebhook,
  listWebhooks,
  getWebhook,
  updateWebhook,
  deleteWebhook,
  getWebhookDeliveries,
} from "../engine/webhooks";

export const webhooksRoutes = new Hono();

// GET /webhooks - List webhooks
webhooksRoutes.get("/webhooks", jwtAuth, async (c) => {
  const user = c.get("user");
  const hooks = listWebhooks(user.userId);
  return c.json({
    success: true,
    webhooks: hooks.map((h) => ({
      id: h.id,
      url: h.url,
      events: h.events.split(",").filter(Boolean),
      is_active: h.is_active === 1,
      created_at: h.created_at,
      last_triggered_at: h.last_triggered_at,
      last_triggered_status: h.last_triggered_status,
    })),
  });
});

// POST /webhooks - Create webhook
webhooksRoutes.post("/webhooks", jwtAuth, async (c) => {
  const user = c.get("user");
  try {
    const body = await c.req.json();
    const { url, events, secret } = body;

    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      return c.json({ error: "A valid webhook URL starting with http(s):// is required" }, 400);
    }
    if (!events || !Array.isArray(events) || events.length === 0) {
      return c.json({ error: "Events array is required (e.g., ['job.completed', 'job.failed'])" }, 400);
    }

    const validEvents = ["job.completed", "job.failed", "job.progress", "crawl.completed"];
    for (const e of events) {
      if (!validEvents.includes(e)) {
        return c.json({ error: `Invalid event: ${e}. Valid: ${validEvents.join(", ")}` }, 400);
      }
    }

    const hook = createWebhook(user.userId, url, events, secret);

    return c.json({
      success: true,
      webhook: {
        id: hook.id,
        url: hook.url,
        events: hook.events.split(",").filter(Boolean),
        secret: hook.secret,
        is_active: hook.is_active === 1,
        created_at: hook.created_at,
      },
    }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET /webhooks/:id - Get webhook details
webhooksRoutes.get("/webhooks/:id", jwtAuth, async (c) => {
  const user = c.get("user");
  const id = parseInt(c.req.param("id") || "0");
  if (isNaN(id)) return c.json({ error: "Invalid ID" }, 400);

  const hook = getWebhook(id, user.userId);
  if (!hook) return c.json({ error: "Webhook not found" }, 404);

  const deliveries = getWebhookDeliveries(id, 5);

  return c.json({
    success: true,
    webhook: {
      id: hook.id,
      url: hook.url,
      events: hook.events.split(",").filter(Boolean),
      is_active: hook.is_active === 1,
      created_at: hook.created_at,
      last_triggered_at: hook.last_triggered_at,
      last_triggered_status: hook.last_triggered_status,
    },
    recent_deliveries: deliveries.map((d) => ({
      id: d.id,
      event: d.event,
      status_code: d.status_code,
      success: d.success === 1,
      created_at: d.created_at,
    })),
  });
});

// PUT /webhooks/:id - Update webhook
webhooksRoutes.put("/webhooks/:id", jwtAuth, async (c) => {
  const user = c.get("user");
  const id = parseInt(c.req.param("id") || "0");
  if (isNaN(id)) return c.json({ error: "Invalid ID" }, 400);

  try {
    const body = await c.req.json();
    const updates: { url?: string; events?: string[]; is_active?: boolean } = {};
    if (body.url) updates.url = body.url;
    if (body.events) updates.events = body.events;
    if (body.is_active !== undefined) updates.is_active = body.is_active;

    const hook = updateWebhook(id, user.userId, updates);
    if (!hook) return c.json({ error: "Webhook not found" }, 404);

    return c.json({
      success: true,
      webhook: {
        id: hook.id,
        url: hook.url,
        events: hook.events.split(",").filter(Boolean),
        is_active: hook.is_active === 1,
        created_at: hook.created_at,
      },
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// DELETE /webhooks/:id - Delete webhook
webhooksRoutes.delete("/webhooks/:id", jwtAuth, async (c) => {
  const user = c.get("user");
  const id = parseInt(c.req.param("id") || "0");
  if (isNaN(id)) return c.json({ error: "Invalid ID" }, 400);

  const deleted = deleteWebhook(id, user.userId);
  if (!deleted) return c.json({ error: "Webhook not found" }, 404);

  return c.json({ success: true, message: "Webhook deleted" });
});

// GET /webhooks/:id/deliveries - List webhook delivery attempts
webhooksRoutes.get("/webhooks/:id/deliveries", jwtAuth, async (c) => {
  const user = c.get("user");
  const id = parseInt(c.req.param("id") || "0");
  if (isNaN(id)) return c.json({ error: "Invalid ID" }, 400);

  const hook = getWebhook(id, user.userId);
  if (!hook) return c.json({ error: "Webhook not found" }, 404);

  const limit = parseInt(c.req.query("limit") || "20");
  const deliveries = getWebhookDeliveries(id, limit);

  return c.json({
    success: true,
    deliveries: deliveries.map((d) => ({
      id: d.id,
      event: d.event,
      status_code: d.status_code,
      response: d.response ? d.response.substring(0, 500) : null,
      success: d.success === 1,
      created_at: d.created_at,
    })),
  });
});
