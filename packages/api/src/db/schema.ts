import { Database } from "bun:sqlite";

export function createUsersTable(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      is_admin INTEGER DEFAULT 0
    )
  `);
}

export function createApiKeysTable(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      key_prefix TEXT NOT NULL,
      key_hash TEXT NOT NULL UNIQUE,
      key_last_chars TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      last_used_at TEXT,
      is_active INTEGER DEFAULT 1
    )
  `);
}

export function createUsageTable(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      api_key_id INTEGER,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      status_code INTEGER,
      credits_used INTEGER DEFAULT 1,
      response_time_ms INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Indexes for fast queries
  const indexes = [
    "CREATE INDEX IF NOT EXISTS idx_usage_endpoint ON usage(endpoint)",
    "CREATE INDEX IF NOT EXISTS idx_usage_user_id ON usage(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_usage_created_at ON usage(created_at)",
    "CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash)",
  ];
  for (const idx of indexes) {
    db.run(idx);
  }
}

export function runMigrations(db: Database): void {
  createUsersTable(db);
  createApiKeysTable(db);
  createUsageTable(db);
}
