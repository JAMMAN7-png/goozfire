import { Hono } from "hono";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { createHash } from "node:crypto";
import { getDb } from "../db";
import { signToken } from "./jwt";
import { jwtAuth } from "./middleware";

export const authRoutes = new Hono();

// POST /register
authRoutes.post("/register", async (c) => {
  const { email, name, password } = await c.req.json();

  if (!email || !name || !password) {
    return c.json({ error: "Email, name, and password are required" }, 400);
  }

  if (password.length < 6) {
    return c.json({ error: "Password must be at least 6 characters" }, 400);
  }

  const db = getDb();

  // Check if email already exists
  const existing = db
    .query("SELECT id FROM users WHERE email = ?")
    .get(email);
  if (existing) {
    return c.json({ error: "Email already registered" }, 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = db
    .query(
      "INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)"
    )
    .run(email, name, passwordHash);

  const token = await signToken({
    userId: Number(result.lastInsertRowid),
    email,
    isAdmin: false,
  });

  return c.json(
    {
      access_token: token,
      token_type: "Bearer",
      expires_in: 604800,
      user: {
        id: Number(result.lastInsertRowid),
        email,
        name,
        is_admin: false,
        created_at: new Date().toISOString(),
      },
    },
    201
  );
});

// POST /login
authRoutes.post("/login", async (c) => {
  const { email, password } = await c.req.json();

  if (!email || !password) {
    return c.json({ error: "Email and password are required" }, 400);
  }

  const db = getDb();
  const user = db
    .query("SELECT * FROM users WHERE email = ?")
    .get(email) as {
    id: number;
    email: string;
    name: string;
    password_hash: string;
    is_admin: number;
    created_at: string;
  } | undefined;

  if (!user) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const token = await signToken({
    userId: user.id,
    email: user.email,
    isAdmin: user.is_admin === 1,
  });

  return c.json({
    access_token: token,
    token_type: "Bearer",
    expires_in: 604800,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      is_admin: user.is_admin === 1,
      created_at: user.created_at,
    },
  });
});

// GET /me
authRoutes.get("/me", jwtAuth, async (c) => {
  const user = c.get("user");
  const db = getDb();
  const row = db
    .query("SELECT id, email, name, is_admin, created_at FROM users WHERE id = ?")
    .get(user.userId) as {
    id: number;
    email: string;
    name: string;
    is_admin: number;
    created_at: string;
  } | undefined;

  if (!row) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({
    id: row.id,
    email: row.email,
    name: row.name,
    is_admin: row.is_admin === 1,
    created_at: row.created_at,
  });
});

// PUT /me
authRoutes.put("/me", jwtAuth, async (c) => {
  const user = c.get("user");
  const { name, email } = await c.req.json();
  const db = getDb();

  if (email) {
    const existing = db
      .query("SELECT id FROM users WHERE email = ? AND id != ?")
      .get(email, user.userId);
    if (existing) {
      return c.json({ error: "Email already in use" }, 409);
    }
  }

  db.run(
    "UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), updated_at = datetime('now') WHERE id = ?",
    [name || null, email || null, user.userId]
  );

  const row = db
    .query("SELECT id, email, name, is_admin, created_at FROM users WHERE id = ?")
    .get(user.userId) as {
    id: number;
    email: string;
    name: string;
    is_admin: number;
    created_at: string;
  };

  return c.json({
    id: row.id,
    email: row.email,
    name: row.name,
    is_admin: row.is_admin === 1,
    created_at: row.created_at,
  });
});

// POST /api-keys
authRoutes.post("/api-keys", jwtAuth, async (c) => {
  const user = c.get("user");
  const { name } = await c.req.json();

  if (!name) {
    return c.json({ error: "Name is required" }, 400);
  }

  const rawKey = `gz_${nanoid(32)}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.substring(0, 8);
  const keyLastChars = rawKey.slice(-4);

  const db = getDb();
  const result = db
    .query(
      "INSERT INTO api_keys (user_id, name, key_prefix, key_hash, key_last_chars) VALUES (?, ?, ?, ?, ?)"
    )
    .run(user.userId, name, keyPrefix, keyHash, keyLastChars);

  return c.json(
    {
      id: Number(result.lastInsertRowid),
      name,
      key: rawKey,
      key_prefix: keyPrefix,
      created_at: new Date().toISOString(),
    },
    201
  );
});

// GET /api-keys
authRoutes.get("/api-keys", jwtAuth, async (c) => {
  const user = c.get("user");
  const db = getDb();
  const keys = db
    .query(
      "SELECT id, name, key_prefix, key_last_chars, created_at, last_used_at, is_active FROM api_keys WHERE user_id = ? ORDER BY created_at DESC"
    )
    .all(user.userId) as Array<{
    id: number;
    name: string;
    key_prefix: string;
    key_last_chars: string;
    created_at: string;
    last_used_at: string | null;
    is_active: number;
  }>;

  return c.json({ keys });
});

// DELETE /api-keys/:id
authRoutes.delete("/api-keys/:id", jwtAuth, async (c) => {
  const user = c.get("user");
  const id = Number(c.req.param("id"));
  const db = getDb();

  const key = db
    .query("SELECT id FROM api_keys WHERE id = ? AND user_id = ?")
    .get(id, user.userId) as { id: number } | undefined;

  if (!key) {
    return c.json({ error: "API key not found" }, 404);
  }

  db.run("UPDATE api_keys SET is_active = 0 WHERE id = ?", [id]);
  return c.json({ success: true });
});
