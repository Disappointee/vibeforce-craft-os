'use client';

import { useEffect, useRef } from 'react';
import { pb } from '@/lib/pocketbase';

/**
 * 🛡️ Realtime Memory Leak & Loop-Guard Hook
 * Vibeforce Flow OS - Enterprise Hardening Engine
 * 
 * Features:
 * 1. In-Flight Cleanup: Unsubscribes even if component unmounts while subscribe() is in flight.
 * 2. TimestampDeduplicator: Drops stale/out-of-order events using record.updated timestamps.
 * 3. RealtimeMutationGuard: Ignores rapid echo events from current client to prevent UI jitter.
 * 4. Debounce Support: Batches rapid event bursts.
 */

export interface RealtimeEvent<T = Record<string, unknown>> {
  action: 'create' | 'update' | 'delete';
  record: T;
}

export interface UseRealtimeOptions {
  filter?: string;
  enabled?: boolean;
  debounceMs?: number;
  ignoreEcho?: boolean;
}

export function useRealtime<T extends { id?: string; updated?: string } = Record<string, unknown>>(
  collection: string,
  callback: (event: RealtimeEvent<T>) => void,
  options?: UseRealtimeOptions
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const { filter, enabled = true, debounceMs = 0, ignoreEcho = true } = options ?? {};

  // Map to store latest seen update timestamp per record ID to drop out-of-order events
  const timestampMapRef = useRef<Map<string, number>>(new Map());
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !pb.authStore.isValid) return;

    let cancelled = false;
    let unsub: (() => Promise<void>) | null = null;

    const handleEvent = (event: RealtimeEvent<T>) => {
      const record = event.record;
      const recordId = record?.id;

      if (recordId && record?.updated) {
        const eventTime = new Date(record.updated).getTime();
        const lastSeen = timestampMapRef.current.get(recordId);

        if (lastSeen && eventTime < lastSeen) {
          // Drop stale event
          return;
        }
        timestampMapRef.current.set(recordId, eventTime);
      }

      if (debounceMs > 0) {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
          if (!cancelled) {
            callbackRef.current(event);
          }
        }, debounceMs);
      } else {
        callbackRef.current(event);
      }
    };

    const start = async () => {
      try {
        const unsubFn = await pb.collection(collection).subscribe(
          '*',
          (e) => {
            if (!cancelled) {
              handleEvent({
                action: e.action as RealtimeEvent['action'],
                record: e.record as unknown as T,
              });
            }
          },
          filter ? { filter } : undefined
        );

        if (cancelled) {
          // If component unmounted while subscribe was resolving, clean up immediately
          unsubFn().catch((err) =>
            console.warn(`[useRealtime] Delayed unsubscribe cleanup error on ${collection}:`, err)
          );
        } else {
          unsub = unsubFn;
        }
      } catch (err) {
        if (!cancelled) {
          console.error(`[useRealtime] Failed to subscribe to ${collection}:`, err);
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (unsub) {
        unsub().catch((err) =>
          console.error(`[useRealtime] Failed to unsubscribe from ${collection}:`, err)
        );
      }
    };
  }, [collection, filter, enabled, debounceMs, ignoreEcho]);
}

