import { SQLiteDatabase, enableLegacyCompatibilityMode, openDatabaseSync } from 'expo-sqlite';

enableLegacyCompatibilityMode();

let db: SQLiteDatabase | null = null;

export async function initDatabase() {
  if (db) return db;
  
  db = openDatabaseSync('deka_delivery.db');
  
  // Create tables for offline sync
  db.execSync(`
    CREATE TABLE IF NOT EXISTS offline_updates (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      payload TEXT NOT NULL,
      synced BOOLEAN DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS delivery_tasks (
      id TEXT PRIMARY KEY,
      package_code TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL,
      order_data TEXT,
      collected_at INTEGER,
      lat REAL,
      lng REAL,
      customer_name TEXT,
      customer_phone TEXT,
      delivery_notes TEXT
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      body TEXT,
      retries INT DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  return db;
}

export function getDatabase() {
  return db;
}

export async function addToSyncQueue(
  endpoint: string,
  method: string,
  body: any
) {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');

  const id = `${Date.now()}-${Math.random()}`;
  db.runSync(
    'INSERT INTO sync_queue (id, endpoint, method, body) VALUES (?, ?, ?, ?)',
    [id, endpoint, method, JSON.stringify(body)]
  );
}

export async function getSyncQueue() {
  const db = getDatabase();
  if (!db) return [];

  return db.getAllSync(
    'SELECT * FROM sync_queue WHERE retries < 3 ORDER BY created_at ASC'
  );
}

export async function updateDeliveryTask(packageCode: string, status: string) {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');

  db.runSync(
    'UPDATE delivery_tasks SET status = ? WHERE package_code = ?',
    [status, packageCode]
  );
}
