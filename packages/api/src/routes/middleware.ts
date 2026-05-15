import { getDb } from "../db";

/**
 * Track API usage for billing/analytics.
 */
export async function trackUsage(
  userId: number,
  apiKeyId: number | null,
  endpoint: string,
  method: string,
  statusCode: number,
  creditsUsed: number,
  responseTimeMs: number
): Promise<void> {
  try {
    const db = getDb();
    db.run(
      `INSERT INTO usage (user_id, api_key_id, endpoint, method, status_code, credits_used, response_time_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, apiKeyId, endpoint, method, statusCode, creditsUsed, responseTimeMs]
    );
  } catch (error) {
    // Don't let usage tracking failures break the API
    console.error("Usage tracking error:", error);
  }
}
