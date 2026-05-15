import type { Context, Next } from "hono";
import { createHash } from "node:crypto";
import { verifyToken, type TokenPayload } from "./jwt";
import { getDb } from "../db";

// Extend Hono's ContextVariableMap
declare module "hono" {
  interface ContextVariableMap {
    user: TokenPayload;
    api_key_id: number;
  }
}

export async function jwtAuth(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid authorization header" }, 401);
  }

  const token = authHeader.slice(7);
  const payload = await verifyToken(token);

  if (!payload) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  c.set("user", payload);
  await next();
}

export async function apiKeyAuth(c: Context, next: Next) {
  let apiKey =
    c.req.header("X-API-Key") || c.req.header("x-api-key") || "";

  if (!apiKey) {
    const auth = c.req.header("Authorization") || "";
    if (auth.startsWith("Bearer ")) {
      // Could be JWT or API key, try JWT first
      const token = auth.slice(7);
      const payload = await verifyToken(token);
      if (payload) {
        c.set("user", payload);
        return await next();
      }
      // Not a valid JWT, try as API key
      apiKey = token;
    }
  }

  if (!apiKey) {
    return c.json({ error: "Missing API key" }, 401);
  }

  const keyHash = createHash("sha256").update(apiKey).digest("hex");
  const db = getDb();

  const keyRow = db
    .query(
      "SELECT id, user_id, is_active FROM api_keys WHERE key_hash = ?"
    )
    .get(keyHash) as { id: number; user_id: number; is_active: number } | undefined;

  if (!keyRow || !keyRow.is_active) {
    return c.json({ error: "Invalid or inactive API key" }, 401);
  }

  // Update last_used_at
  db.run("UPDATE api_keys SET last_used_at = datetime('now') WHERE id = ?", [
    keyRow.id,
  ]);

  // Load user
  const user = db
    .query("SELECT id, email, is_admin FROM users WHERE id = ?")
    .get(keyRow.user_id) as { id: number; email: string; is_admin: number } | undefined;

  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }

  c.set("user", {
    userId: user.id,
    email: user.email,
    isAdmin: user.is_admin === 1,
  });

  // Store api_key_id for usage tracking
  c.set("api_key_id", keyRow.id);

  await next();
}

export async function optionalAuth(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  const apiKeyHeader = c.req.header("X-API-Key");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = await verifyToken(token);
    if (payload) {
      c.set("user", payload);
      return await next();
    }
  }

  if (apiKeyHeader || authHeader) {
    return apiKeyAuth(c, next);
  }

  await next();
}

export async function requireAdmin(c: Context, next: Next) {
  const user = c.get("user");
  if (!user?.isAdmin) {
    return c.json({ error: "Admin access required" }, 403);
  }
  await next();
}
