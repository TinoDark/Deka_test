import { SQLiteDatabase, enableLegacyCompatibilityMode, openDatabaseSync } from 'expo-sqlite';

enableLegacyCompatibilityMode();

let db: SQLiteDatabase | null = null;

export async function initDatabase() {
  if (db) return db;
  
  db = openDatabaseSync('dekora_delivery.db');
  
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

export async function saveDeliveryTask(task: {
  id: string;
  packageCode: string;
  status: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  pickups: Array<{ storeName: string; address: string; lat: number; lng: number }>;
  totalAmount: number;
  amountDue: number;
  cod: boolean;
}) {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');

  db.runSync(
    `INSERT OR REPLACE INTO delivery_tasks (id, package_code, status, order_data, collected_at, lat, lng, customer_name, customer_phone, delivery_notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      task.id,
      task.packageCode,
      task.status,
      JSON.stringify(task),
      null,
      task.deliveryLat,
      task.deliveryLng,
      task.customerName,
      task.customerPhone,
      null,
    ]
  );
}

export async function getDeliveryTasks() {
  const db = getDatabase();
  if (!db) return [];

  const rows = db.getAllSync('SELECT * FROM delivery_tasks ORDER BY customer_name ASC');
  return rows.map((row: any) => {
    const orderData = row.order_data ? JSON.parse(row.order_data) : {};
    return {
      id: row.id,
      packageCode: row.package_code,
      status: row.status,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      deliveryAddress: row.deliveryAddress || orderData.deliveryAddress || '',
      deliveryLat: row.lat,
      deliveryLng: row.lng,
      pickups: orderData.pickups || [],
      totalAmount: orderData.totalAmount || 0,
      amountDue: orderData.amountDue || 0,
      cod: orderData.cod || false,
    };
  });
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
