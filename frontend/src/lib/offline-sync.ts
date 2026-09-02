import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface PendingSyncItem {
  id: string; // UUID
  collection: 'time_entries' | 'site_reports' | 'measurements';
  action: 'create' | 'update' | 'delete';
  data: Record<string, any>;
  createdAt: number;
  retryCount: number;
}

interface VibeCraftOfflineDB extends DBSchema {
  sync_queue: {
    key: string;
    value: PendingSyncItem;
    indexes: { 'by-created': number };
  };
}

const DB_NAME = 'vibeforce_craft_offline';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<VibeCraftOfflineDB>> | null = null;

function getDB() {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB<VibeCraftOfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('sync_queue')) {
          const store = db.createObjectStore('sync_queue', { keyPath: 'id' });
          store.createIndex('by-created', 'createdAt');
        }
      },
    });
  }
  return dbPromise;
}

export async function queueOfflineAction(
  collection: PendingSyncItem['collection'],
  action: PendingSyncItem['action'],
  data: Record<string, any>
): Promise<string> {
  const db = await getDB();
  if (!db) return '';

  const safeUuid = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

  const id = 'offline_' + safeUuid;
  const item: PendingSyncItem = {
    id,
    collection,
    action,
    data,
    createdAt: Date.now(),
    retryCount: 0,
  };

  await db.put('sync_queue', item);
  return id;
}

export async function getPendingSyncCount(): Promise<number> {
  const db = await getDB();
  if (!db) return 0;
  return db.count('sync_queue');
}

export async function getPendingSyncItems(): Promise<PendingSyncItem[]> {
  const db = await getDB();
  if (!db) return [];
  return db.getAllFromIndex('sync_queue', 'by-created');
}

export async function removePendingSyncItem(id: string): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.delete('sync_queue', id);
}

export async function incrementRetryCount(id: string): Promise<void> {
  const db = await getDB();
  if (!db) return;
  const item = await db.get('sync_queue', id);
  if (item) {
    item.retryCount = (item.retryCount || 0) + 1;
    await db.put('sync_queue', item);
  }
}
