import { Hono } from "hono";
import { jwtAuth } from "../auth/middleware";
import { getDb } from "../db";

export const usageRoutes = new Hono();

// GET /usage/stats
usageRoutes.get("/usage/stats", jwtAuth, async (c) => {
  const user = c.get("user");
  const db = getDb();
  const days = parseInt(c.req.query("days") || "7");

  // Total requests and credits
  const totals = db
    .query(
      `SELECT 
        COUNT(*) as total_requests,
        COALESCE(SUM(credits_used), 0) as total_credits,
        COALESCE(CAST(AVG(response_time_ms) AS INTEGER), 0) as avg_response_time_ms
       FROM usage 
       WHERE user_id = ? AND created_at >= datetime('now', ? || ' days')`
    )
    .get(user.userId, `-${days}`) as {
    total_requests: number;
    total_credits: number;
    avg_response_time_ms: number;
  };

  // By endpoint
  const byEndpoint = db
    .query(
      `SELECT 
        endpoint,
        COUNT(*) as count,
        COALESCE(SUM(credits_used), 0) as credits
       FROM usage
       WHERE user_id = ? AND created_at >= datetime('now', ? || ' days')
       GROUP BY endpoint
       ORDER BY count DESC`
    )
    .all(user.userId, `-${days}`) as Array<{
    endpoint: string;
    count: number;
    credits: number;
  }>;

  // By day
  const byDay = db
    .query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        COALESCE(SUM(credits_used), 0) as credits
       FROM usage
       WHERE user_id = ? AND created_at >= datetime('now', ? || ' days')
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    )
    .all(user.userId, `-${days}`) as Array<{
    date: string;
    count: number;
    credits: number;
  }>;

  return c.json({
    total_requests: totals.total_requests,
    total_credits: totals.total_credits,
    avg_response_time_ms: totals.avg_response_time_ms,
    by_endpoint: byEndpoint,
    by_day: byDay,
  });
});
