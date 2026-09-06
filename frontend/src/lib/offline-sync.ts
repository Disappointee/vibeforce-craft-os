import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface PendingSyncItem {
  id: string;
  collection: 'time_entries' | 'site_reports' | 'measurements';
  action: 'create' | 'update' | 'delete';
  data: Record<string, any>;
  createdAt: number;
  retryCount: number;
  quarantined?: boolean;
  quarantinedAt?: number;
  lastError?: string;
}

export interface ReportDraft {
  reportKey: string;
  data: Record<string, any>;
  updatedAt: number;
}

export interface MediaBlobEntry {
  id: string;
  reportKey: string;
  mime: string;
  blob: Blob;
  createdAt: number;
}

interface VibeCraftOfflineDB extends DBSchema {
  sync_queue: {
    key: string;
    value: PendingSyncItem;
    indexes: { 'by-created': number };
  };
  report_drafts: {
    key: string;
    value: ReportDraft;
  };
  media_blobs: {
    key: string;
    value: MediaBlobEntry;
    indexes: { 'by-report': string };
  };
}

const DB_NAME = 'vibeforce_craft_offline';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<VibeCraftOfflineDB>> | null = null;

function getDB() {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB<VibeCraftOfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        if (oldVersion < 2) {
          let queueStore: any;
          if (!db.objectStoreNames.contains('sync_queue')) {
            queueStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
          } else {
            queueStore = transaction.objectStore('sync_queue');
          }

          if (queueStore && !queueStore.indexNames.contains('by-created')) {
            queueStore.createIndex('by-created', 'createdAt');
          }

          if (!db.objectStoreNames.contains('report_drafts')) {
            db.createObjectStore('report_drafts', { keyPath: 'reportKey' });
          }

          if (!db.objectStoreNames.contains('media_blobs')) {
            const mediaStore = db.createObjectStore('media_blobs', { keyPath: 'id' });
            mediaStore.createIndex('by-report', 'reportKey');
          }
        }
      },
    });
  }
  return dbPromise;
}

function safeUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export async function queueOfflineAction(
  collection: PendingSyncItem['collection'],
  action: PendingSyncItem['action'],
  data: Record<string, any>
): Promise<string> {
  const db = await getDB();
  if (!db) return '';

  const id = 'offline_' + safeUuid();
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
  const all = await db.getAll('sync_queue');
  return all.filter((item) => !item.quarantined).length;
}

export async function getPendingSyncItems(): Promise<PendingSyncItem[]> {
  const db = await getDB();
  if (!db) return [];
  const all = await db.getAllFromIndex('sync_queue', 'by-created');
  return all.filter((item) => !item.quarantined);
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

export async function saveReportDraft(reportKey: string, data: Record<string, any>): Promise<void> {
  const db = await getDB();
  if (!db) return;
  const draft: ReportDraft = {
    reportKey,
    data,
    updatedAt: Date.now(),
  };
  await db.put('report_drafts', draft);
}

export async function loadReportDraft(reportKey: string): Promise<ReportDraft | null> {
  const db = await getDB();
  if (!db) return null;
  return (await db.get('report_drafts', reportKey)) ?? null;
}

export async function clearReportDraft(reportKey: string): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.delete('report_drafts', reportKey);
}

export async function saveMediaBlob(reportKey: string, blob: Blob, mime: string): Promise<string> {
  const db = await getDB();
  if (!db) return '';
  const id = 'media_' + safeUuid();
  const entry: MediaBlobEntry = {
    id,
    reportKey,
    mime,
    blob,
    createdAt: Date.now(),
  };
  await db.put('media_blobs', entry);
  return id;
}

export async function getMediaBlobsForReport(reportKey: string): Promise<MediaBlobEntry[]> {
  const db = await getDB();
  if (!db) return [];
  return db.getAllFromIndex('media_blobs', 'by-report', reportKey);
}

export async function deleteMediaBlob(id: string): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.delete('media_blobs', id);
}

export async function quarantineItem(id: string, error?: string): Promise<void> {
  const db = await getDB();
  if (!db) return;
  const item = await db.get('sync_queue', id);
  if (item) {
    item.quarantined = true;
    item.quarantinedAt = Date.now();
    item.lastError = error;
    await db.put('sync_queue', item);
  }
}

export async function getQuarantinedItems(): Promise<PendingSyncItem[]> {
  const db = await getDB();
  if (!db) return [];
  const all = await db.getAllFromIndex('sync_queue', 'by-created');
  return all.filter((item) => item.quarantined === true);
}

export async function retryQuarantinedItem(id: string): Promise<void> {
  const db = await getDB();
  if (!db) return;
  const item = await db.get('sync_queue', id);
  if (item && item.quarantined) {
    item.quarantined = false;
    delete item.quarantinedAt;
    delete item.lastError;
    item.retryCount = 0;
    await db.put('sync_queue', item);
  }
}
