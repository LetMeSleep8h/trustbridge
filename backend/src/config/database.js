import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "..", "trustbridge.db");

let db;

export function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      walletAddress TEXT,
      avatar TEXT,
      gender TEXT,
      country TEXT,
      bio TEXT,
      facebook TEXT,
      instagram TEXT,
      youtube TEXT,
      emailNotifications INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      organization TEXT NOT NULL,
      category TEXT NOT NULL,
      goal REAL NOT NULL,
      raised REAL DEFAULT 0,
      donors INTEGER DEFAULT 0,
      image TEXT,
      creator_id INTEGER REFERENCES users(id),
      status TEXT DEFAULT 'active' CHECK(status IN ('active','funded','expired')),
      end_date TEXT NOT NULL,
      urgent INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT NOT NULL,
      from_address TEXT NOT NULL,
      to_address TEXT NOT NULL,
      amount REAL NOT NULL,
      asset TEXT DEFAULT 'XLM',
      type TEXT NOT NULL CHECK(type IN ('donation','send','receive')),
      status TEXT DEFAULT 'confirmed' CHECK(status IN ('confirmed','pending','failed')),
      memo TEXT,
      campaign_id INTEGER REFERENCES campaigns(id),
      user_id INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_campaign ON transactions(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_campaigns_creator ON campaigns(creator_id);

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      text TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_comments_campaign ON comments(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
  `);

  // Add columns if they don't exist (safe for re-running)
  const existing = db.prepare("PRAGMA table_info(users)").all().map(r => r.name);
  const cols = ['avatar', 'gender', 'country', 'facebook', 'instagram', 'youtube'];
  for (const col of cols) {
    if (!existing.includes(col)) {
      db.exec(`ALTER TABLE users ADD COLUMN ${col} TEXT`);
    }
  }
  if (!existing.includes('emailNotifications')) {
    db.exec(`ALTER TABLE users ADD COLUMN emailNotifications INTEGER DEFAULT 1`);
  }
  if (!existing.includes('github_id')) {
    db.exec(`ALTER TABLE users ADD COLUMN github_id TEXT`);
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id) WHERE github_id IS NOT NULL`);
  }
  if (!existing.includes('auth_provider')) {
    db.exec(`ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'local'`);
  }
  if (!existing.includes('role')) {
    db.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`);
  }

  // Campaigns: destination wallet that receives donations
  const campaignCols = db.prepare("PRAGMA table_info(campaigns)").all().map(r => r.name);
  if (!campaignCols.includes('wallet_address')) {
    db.exec(`ALTER TABLE campaigns ADD COLUMN wallet_address TEXT`);
  }
  db.exec(`CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status)`);
}

export default getDB;