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

  db.run("CREATE INDEX IF NOT EXISTS idx_usage_endpoint ON usage(endpoint)");
  db.run("CREATE INDEX IF NOT EXISTS idx_usage_user_id ON usage(user_id)");
  db.run("CREATE INDEX IF NOT EXISTS idx_usage_created_at ON usage(created_at)");
  db.run("CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id)");
  db.run("CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash)");
}

export function createJobsTable(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      input TEXT NOT NULL,
      output TEXT,
      error TEXT,
      progress INTEGER DEFAULT 0,
      credits_used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      started_at TEXT,
      completed_at TEXT
    )
  `);
  db.run("CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id)");
  db.run("CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)");
  db.run("CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(type)");
}

export function createWebhooksTable(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS webhooks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      secret TEXT NOT NULL,
      events TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      last_triggered_at TEXT,
      last_triggered_status INTEGER
    )
  `);
  db.run("CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id)");

  db.run(`
    CREATE TABLE IF NOT EXISTS webhook_deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      webhook_id INTEGER NOT NULL,
      event TEXT NOT NULL,
      payload TEXT NOT NULL,
      status_code INTEGER,
      response TEXT,
      success INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  db.run("CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id)");
}

export function runMigrations(db: Database): void {
  createUsersTable(db);
  createApiKeysTable(db);
  createUsageTable(db);
  createJobsTable(db);
  createWebhooksTable(db);
}
