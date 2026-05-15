import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";

const DB_PATH = process.env.DATABASE_URL || "./data/goozfire.db";

let db: Database | null = null;

export function getDb(): Database {
  if (!db) {
    const dir = DB_PATH.substring(0, DB_PATH.lastIndexOf("/"));
    if (dir) {
      try {
        mkdirSync(dir, { recursive: true });
      } catch {
        // directory already exists
      }
    }
    db = new Database(DB_PATH);
    db.run("PRAGMA journal_mode=WAL");
    db.run("PRAGMA foreign_keys=ON");
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
