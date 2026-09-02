'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getPendingSyncCount,
  getPendingSyncItems,
  removePendingSyncItem,
  type PendingSyncItem,
} from '@/lib/offline-sync';

export function useOfflineSync(onFlushItem?: (item: PendingSyncItem) => Promise<boolean>) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingSyncCount();
      setPendingCount(count);
    } catch {
      setPendingCount(0);
    }
  }, []);

  const flushQueue = useCallback(async () => {
    if (!navigator.onLine || isSyncing || !onFlushItem) return;

    setIsSyncing(true);
    try {
      const items = await getPendingSyncItems();
      for (const item of items) {
        const success = await onFlushItem(item);
        if (success) {
          await removePendingSyncItem(item.id);
        }
      }
      await refreshPendingCount();
    } catch (err) {
      console.error('[useOfflineSync] Error flushing sync queue:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, onFlushItem, refreshPendingCount]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    refreshPendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flushQueue, refreshPendingCount]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    flushQueue,
    refreshPendingCount,
  };
}
