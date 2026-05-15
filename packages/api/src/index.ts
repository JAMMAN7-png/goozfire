import { app } from "./app";
import { getDb } from "./db";
import { runMigrations } from "./db/schema";
import bcrypt from "bcryptjs";

// Initialize database
const db = getDb();
runMigrations(db);

// Create default admin user if not exists
const adminEmail = process.env.ADMIN_EMAIL || "admin@goozfire.local";
const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
const adminName = process.env.ADMIN_NAME || "Admin";

const existing = db
  .query("SELECT id FROM users WHERE email = ?")
  .get(adminEmail) as { id: number } | undefined;

if (!existing) {
  const hash = bcrypt.hashSync(adminPassword, 10);
  db.run(
    "INSERT INTO users (email, name, password_hash, is_admin) VALUES (?, ?, ?, 1)",
    [adminEmail, adminName, hash]
  );
  console.log("Created default admin user:", adminEmail);
}

const port = parseInt(process.env.PORT || "3003");
const host = process.env.HOST || "0.0.0.0";

console.log(`Goozfire API running on http://${host}:${port}`);

export default {
  port,
  host,
  fetch: app.fetch,
};
