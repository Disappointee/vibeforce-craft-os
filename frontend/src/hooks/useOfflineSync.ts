'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getPendingSyncCount,
  getPendingSyncItems,
  getQuarantinedItems,
  quarantineItem,
  retryQuarantinedItem,
  saveReportDraft,
  loadReportDraft,
  clearReportDraft,
  removePendingSyncItem,
  incrementRetryCount,
  type PendingSyncItem,
  type ReportDraft,
} from '@/lib/offline-sync';

export function useOfflineSync(onFlushItem?: (item: PendingSyncItem) => Promise<boolean>) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [quarantinedCount, setQuarantinedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const isSyncingRef = useRef(false);
  const onFlushItemRef = useRef(onFlushItem);
  onFlushItemRef.current = onFlushItem;

  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingSyncCount();
      setPendingCount(count);
    } catch {
      setPendingCount(0);
    }
  }, []);

  const refreshQuarantinedCount = useCallback(async () => {
    try {
      const items = await getQuarantinedItems();
      setQuarantinedCount(items.length);
    } catch {
      setQuarantinedCount(0);
    }
  }, []);

  const flushQueue = useCallback(async () => {
    if (!navigator.onLine || isSyncingRef.current || !onFlushItemRef.current) return;

    isSyncingRef.current = true;
    setIsSyncing(true);
    try {
      const items = await getPendingSyncItems();
      for (const item of items) {
        if (item.retryCount >= 5) {
          console.warn(`[useOfflineSync] Item ${item.id} quarantined after max retries (5).`);
          await quarantineItem(item.id, 'Max retries (5) überschritten');
          await refreshQuarantinedCount();
          continue;
        }

        const success = await onFlushItemRef.current(item);
        if (success) {
          await removePendingSyncItem(item.id);
        } else {
          await incrementRetryCount(item.id);
        }
      }
      await refreshPendingCount();
      await refreshQuarantinedCount();
    } catch (err) {
      console.error('[useOfflineSync] Error flushing sync queue:', err);
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [refreshPendingCount, refreshQuarantinedCount]);

  const getQuarantined = useCallback(async (): Promise<PendingSyncItem[]> => {
    return getQuarantinedItems();
  }, []);

  const retryQuarantinedItemFn = useCallback(async (id: string) => {
    await retryQuarantinedItem(id);
    await flushQueue();
    await refreshPendingCount();
    await refreshQuarantinedCount();
  }, [flushQueue, refreshPendingCount, refreshQuarantinedCount]);

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

    const initCounts = async () => {
      await refreshPendingCount();
      await refreshQuarantinedCount();
    };

    initCounts();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flushQueue, refreshPendingCount, refreshQuarantinedCount]);

  return {
    isOnline,
    pendingCount,
    quarantinedCount,
    isSyncing,
    flushQueue,
    refreshPendingCount,
    refreshQuarantinedCount,
    getQuarantined,
    retryQuarantinedItem: retryQuarantinedItemFn,
  };
}

export function useDraftAutosave(reportKey: string | null, enabled: boolean) {
  const [draft, setDraft] = useState<ReportDraft | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDataRef = useRef<Record<string, any> | null>(null);

  useEffect(() => {
    if (!reportKey || !enabled) return;

    const load = async () => {
      const d = await loadReportDraft(reportKey);
      setDraft(d);
    };

    load();
  }, [reportKey, enabled]);

  useEffect(() => {
    if (!reportKey || !enabled) return;

    const handleFlush = () => {
      if (timerRef.current && latestDataRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        saveReportDraft(reportKey, latestDataRef.current).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', handleFlush);
    window.addEventListener('pagehide', handleFlush);

    return () => {
      window.removeEventListener('beforeunload', handleFlush);
      window.removeEventListener('pagehide', handleFlush);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        if (latestDataRef.current) {
          saveReportDraft(reportKey, latestDataRef.current).catch(() => {});
        }
      }
    };
  }, [reportKey, enabled]);

  const saveDraft = useCallback(
    (data: Record<string, any>) => {
      if (!reportKey || !enabled) return;
      latestDataRef.current = data;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(async () => {
        timerRef.current = null;
        await saveReportDraft(reportKey, data);
        const d: ReportDraft = {
          reportKey,
          data,
          updatedAt: Date.now(),
        };
        setDraft(d);
      }, 300);
    },
    [reportKey, enabled]
  );

  const clearDraft = useCallback(async () => {
    if (!reportKey) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    latestDataRef.current = null;
    await clearReportDraft(reportKey);
    setDraft(null);
  }, [reportKey]);

  return {
    saveDraft,
    draft,
    clearDraft,
  };
}
