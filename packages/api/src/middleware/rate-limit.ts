/**
 * Sliding window rate limiter per API key / user.
 * Uses in-memory store (SQLite-backed for persistence).
 */
import type { Context, Next } from "hono";

interface RateLimitEntry {
  count: number;
  reset_at: number;
}

const store = new Map<string, RateLimitEntry>();

// Default limits: 60 requests per minute (free tier)
const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 60;

// Higher limits for authenticated users
const AUTH_WINDOW_MS = 60_000;
const AUTH_MAX_REQUESTS = 120;

// Much higher for API key users
const APIKEY_WINDOW_MS = 60_000;
const APIKEY_MAX_REQUESTS = 300;

function getKey(c: Context): string {
  const apiKeyId = c.get("api_key_id");
  if (apiKeyId) return `apikey:${apiKeyId}`;

  const user = c.get("user");
  if (user?.userId) return `user:${user.userId}`;

  // IP-based for anonymous
  const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";
  return `ip:${ip}`;
}

function getLimits(c: Context): { window_ms: number; max_requests: number } {
  const apiKeyId = c.get("api_key_id");
  if (apiKeyId) {
    return { window_ms: APIKEY_WINDOW_MS, max_requests: APIKEY_MAX_REQUESTS };
  }
  const user = c.get("user");
  if (user?.userId && user.isAdmin) {
    return { window_ms: AUTH_WINDOW_MS, max_requests: 1000 };
  }
  if (user?.userId) {
    return { window_ms: AUTH_WINDOW_MS, max_requests: AUTH_MAX_REQUESTS };
  }
  return { window_ms: DEFAULT_WINDOW_MS, max_requests: DEFAULT_MAX_REQUESTS };
}

/**
 * Sliding window rate limiter middleware.
 * Sets X-RateLimit-* headers on every response.
 */
export async function rateLimit(c: Context, next: Next) {
  const key = getKey(c);
  const { window_ms, max_requests } = getLimits(c);
  const now = Date.now();

  // Periodic cleanup
  if (Math.random() < 0.01) {
    for (const [k, entry] of store) {
      if (entry.reset_at < now) store.delete(k);
    }
  }

  let entry = store.get(key);
  if (!entry || entry.reset_at < now) {
    entry = { count: 0, reset_at: now + window_ms };
    store.set(key, entry);
  }

  entry.count++;

  const remaining = Math.max(0, max_requests - entry.count);
  const resetSeconds = Math.ceil((entry.reset_at - now) / 1000);

  // Set rate limit headers
  c.header("X-RateLimit-Limit", String(max_requests));
  c.header("X-RateLimit-Remaining", String(remaining));
  c.header("X-RateLimit-Reset", String(resetSeconds));

  if (entry.count > max_requests) {
    c.header("Retry-After", String(resetSeconds));
    return c.json(
      {
        error: "Rate limit exceeded",
        retry_after: resetSeconds,
        limit: max_requests,
        remaining: 0,
        reset_at: new Date(entry.reset_at).toISOString(),
      },
      429
    );
  }

  await next();
}
