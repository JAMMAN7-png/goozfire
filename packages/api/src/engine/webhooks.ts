/**
 * Webhook System
 * Register webhooks and deliver events to subscriber URLs.
 */
import { getDb } from "../db";
import type { Webhook, WebhookDelivery } from "@goozfire/shared";
import { createHash, randomBytes } from "node:crypto";

/**
 * Register a new webhook.
 */
export function createWebhook(
  userId: number,
  url: string,
  events: string[],
  secret?: string
): Webhook {
  const db = getDb();
  const webhookSecret = secret || randomBytes(16).toString("hex");
  const eventsStr = events.join(",");
  const result = db
    .query(
      `INSERT INTO webhooks (user_id, url, secret, events) VALUES (?, ?, ?, ?)`
    )
    .run(userId, url, webhookSecret, eventsStr);

  return {
    id: Number(result.lastInsertRowid),
    user_id: userId,
    url,
    secret: webhookSecret,
    events: eventsStr,
    is_active: 1,
    created_at: new Date().toISOString(),
    last_triggered_at: null,
    last_triggered_status: null,
  };
}

/**
 * List webhooks for a user.
 */
export function listWebhooks(userId: number): Webhook[] {
  const db = getDb();
  const rows = db
    .query("SELECT * FROM webhooks WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as any[];
  return rows.map(rowToWebhook);
}

/**
 * Get a webhook by ID.
 */
export function getWebhook(webhookId: number, userId: number): Webhook | null {
  const db = getDb();
  const row = db
    .query("SELECT * FROM webhooks WHERE id = ? AND user_id = ?")
    .get(webhookId, userId) as any;
  return row ? rowToWebhook(row) : null;
}

/**
 * Update a webhook.
 */
export function updateWebhook(
  webhookId: number,
  userId: number,
  updates: { url?: string; events?: string[]; is_active?: boolean }
): Webhook | null {
  const db = getDb();
  const existing = getWebhook(webhookId, userId);
  if (!existing) return null;

  const sets: string[] = [];
  const values: any[] = [];

  if (updates.url) {
    sets.push("url = ?");
    values.push(updates.url);
  }
  if (updates.events) {
    sets.push("events = ?");
    values.push(updates.events.join(","));
  }
  if (updates.is_active !== undefined) {
    sets.push("is_active = ?");
    values.push(updates.is_active ? 1 : 0);
  }

  if (sets.length > 0) {
    values.push(webhookId);
    db.run(`UPDATE webhooks SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`, values);
  }

  return getWebhook(webhookId, userId);
}

/**
 * Delete a webhook.
 */
export function deleteWebhook(webhookId: number, userId: number): boolean {
  const db = getDb();
  const result = db
    .query("DELETE FROM webhooks WHERE id = ? AND user_id = ?")
    .run(webhookId, userId);
  return result.changes > 0;
}

/**
 * Deliver an event to all matching webhooks.
 */
export async function deliverWebhook(
  userId: number,
  event: string,
  payload: any
): Promise<void> {
  const db = getDb();
  const hooks = db
    .query(
      "SELECT * FROM webhooks WHERE user_id = ? AND is_active = 1 AND instr(events, ?) > 0"
    )
    .all(userId, event) as any[];

  for (const hook of hooks) {
    const payloadStr = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    // Compute HMAC signature
    const signature = createHash("sha256")
      .update(payloadStr + hook.secret)
      .digest("hex");

    try {
      const res = await fetch(hook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goozfire-Event": event,
          "X-Goozfire-Signature": signature,
          "User-Agent": "Goozfire-Webhook/1.0",
        },
        body: payloadStr,
        signal: AbortSignal.timeout(10000),
      });

      // Record delivery
      db.run(
        `INSERT INTO webhook_deliveries (webhook_id, event, payload, status_code, response, success)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [hook.id, event, payloadStr, res.status, await res.text().catch(() => ""), res.ok ? 1 : 0]
      );

      // Update last triggered
      db.run(
        "UPDATE webhooks SET last_triggered_at = datetime('now'), last_triggered_status = ? WHERE id = ?",
        [res.status, hook.id]
      );
    } catch (err: any) {
      // Record failed delivery
      db.run(
        `INSERT INTO webhook_deliveries (webhook_id, event, payload, status_code, response, success)
         VALUES (?, ?, ?, NULL, ?, 0)`,
        [hook.id, event, payloadStr, err.message]
      );
    }
  }
}

/**
 * Get webhook delivery log.
 */
export function getWebhookDeliveries(webhookId: number, limit = 20): WebhookDelivery[] {
  const db = getDb();
  const rows = db
    .query(
      "SELECT * FROM webhook_deliveries WHERE webhook_id = ? ORDER BY created_at DESC LIMIT ?"
    )
    .all(webhookId, limit) as any[];
  return rows.map((r) => ({
    id: r.id,
    webhook_id: r.webhook_id,
    event: r.event,
    payload: r.payload,
    status_code: r.status_code,
    response: r.response,
    success: r.success,
    created_at: r.created_at,
  }));
}

function rowToWebhook(row: any): Webhook {
  return {
    id: row.id,
    user_id: row.user_id,
    url: row.url,
    secret: row.secret,
    events: row.events,
    is_active: row.is_active,
    created_at: row.created_at,
    last_triggered_at: row.last_triggered_at,
    last_triggered_status: row.last_triggered_status,
  };
}
