import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { seedDatabase } from "./seed";

const ASSET_DIRS = ["uploads", "exports"];

export function assetDir(kind: number): string {
  const sub = ASSET_DIRS[kind] ?? ASSET_DIRS[0];
  return path.join(process.cwd(), "public", sub);
}

let db: Database.Database | null = null;

const USERS_SCHEMA = `
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  mfa_enabled INTEGER NOT NULL DEFAULT 0,
  secret_question_1 TEXT NOT NULL,
  secret_answer_1 TEXT NOT NULL,
  secret_question_2 TEXT NOT NULL,
  secret_answer_2 TEXT NOT NULL,
  email TEXT,
  balance INTEGER NOT NULL DEFAULT 100000,
  display_name TEXT,
  profile_html TEXT,
  profile_image TEXT,
  date_of_birth TEXT,
  phone TEXT,
  address TEXT,
  profile_public INTEGER NOT NULL DEFAULT 0,
  profile_template TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
`;

const TRANSACTIONS_SCHEMA = `
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_user_id INTEGER NOT NULL,
  to_user_id INTEGER,
  to_account TEXT,
  amount INTEGER NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (from_user_id) REFERENCES users(id),
  FOREIGN KEY (to_user_id) REFERENCES users(id)
`;

const PENDING_TRANSFERS_SCHEMA = `
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  recipient TEXT NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
`;

export function getDb(): Database.Database {
  if (db) return db;

  const dbPath = path.join(process.cwd(), "nohackme.db");
  db = new Database(dbPath);

  db.pragma("journal_mode = WAL");

  db.exec(`CREATE TABLE IF NOT EXISTS users (${USERS_SCHEMA})`);
  db.exec(`CREATE TABLE IF NOT EXISTS transactions (${TRANSACTIONS_SCHEMA})`);
  db.exec(`CREATE TABLE IF NOT EXISTS pending_transfers (${PENDING_TRANSFERS_SCHEMA})`);

  const count = db.prepare("SELECT COUNT(*) as count FROM users").get() as {
    count: number;
  };
  if (count.count === 0) {
    seedDatabase(db);
  }

  return db;
}

export function resetDatabase(): void {
  const database = getDb();

  database.exec("DROP TABLE IF EXISTS pending_transfers");
  database.exec("DROP TABLE IF EXISTS transactions");
  database.exec("DROP TABLE IF EXISTS users");
  database.exec(`CREATE TABLE users (${USERS_SCHEMA})`);
  database.exec(`CREATE TABLE transactions (${TRANSACTIONS_SCHEMA})`);
  database.exec(`CREATE TABLE pending_transfers (${PENDING_TRANSFERS_SCHEMA})`);

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (fs.existsSync(uploadsDir)) {
    for (const file of fs.readdirSync(uploadsDir)) {
      if (file === ".gitkeep") continue;
      fs.unlinkSync(path.join(uploadsDir, file));
    }
  }

  const logFile = path.join(process.cwd(), "logs", "app.log");
  if (fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, "");
  }

  seedDatabase(database);
}
