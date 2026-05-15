import type { Context, Next } from "hono";

interface CacheEntry {
  body: string;
  status: number;
  headers: Record<string, string>;
  expires_at: number;
}

const cache = new Map<string, CacheEntry>();
const DEFAULT_TTL_MS = 60_000;
const CLEANUP_INTERVAL = 60_000;

let lastCleanup = Date.now();
function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of cache) {
    if (entry.expires_at < now) cache.delete(key);
  }
}

function getCacheKey(c: Context): string {
  // Only cache GET requests to avoid body-stream issues
  if (c.req.method !== "GET") return "";
  const url = c.req.url;
  const user = c.get("user");
  const userId = user?.userId || "anon";
  return `${c.req.method}:${userId}:${url}`;
}

export async function responseCache(c: Context, next: Next) {
  if (c.req.method !== "GET") return await next();

  cleanup();
  const key = getCacheKey(c);
  if (!key) return await next();

  const cached = cache.get(key);
  if (cached && cached.expires_at > Date.now()) {
    for (const [h, v] of Object.entries(cached.headers)) c.header(h, v);
    c.header("X-Cache", "HIT");
    return new Response(cached.body, {
      status: cached.status,
      headers: { "Content-Type": "application/json", "X-Cache": "HIT" },
    });
  }

  await next();

  const response = c.res;
  if (response.status === 200) {
    try {
      const body = await response.text();
      const ttl = (c.get("cache_ttl") as number) || DEFAULT_TTL_MS;
      const headers: Record<string, string> = {};
      response.headers.forEach((v, k) => { headers[k] = v; });
      cache.set(key, {
        body,
        status: response.status,
        headers,
        expires_at: Date.now() + ttl,
      });
      c.header("X-Cache", "MISS");
    } catch { /* skip - response already consumed */ }
  }
}
