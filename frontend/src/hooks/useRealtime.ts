'use client';

import { useEffect, useRef } from 'react';
import { pb } from '@/lib/pocketbase';

export interface RealtimeEvent<T = Record<string, unknown>> {
  action: 'create' | 'update' | 'delete';
  record: T;
}

export function useRealtime<T = Record<string, unknown>>(
  collection: string,
  callback: (event: RealtimeEvent<T>) => void,
  options?: { filter?: string; enabled?: boolean }
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const { filter, enabled = true } = options ?? {};

  useEffect(() => {
    if (!enabled || !pb.authStore.isValid) return;

    let cancelled = false;
    let unsub: (() => Promise<void>) | null = null;

    const start = async () => {
      try {
        unsub = await pb.collection(collection).subscribe(
          '*',
          (e) => {
            if (!cancelled) {
              callbackRef.current({
                action: e.action as RealtimeEvent['action'],
                record: e.record as T,
              });
            }
          },
          filter ? { filter } : undefined
        );
      } catch (err) {
        console.error(`[useRealtime] Failed to subscribe to ${collection}:`, err);
      }
    };

    start();

    return () => {
      cancelled = true;
      if (unsub) {
        unsub().catch((err) =>
          console.error(`[useRealtime] Failed to unsubscribe from ${collection}:`, err)
        );
      }
    };
  }, [collection, filter, enabled]);
}
