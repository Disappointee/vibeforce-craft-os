'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  DwellTimeTracker,
  type GeofenceConfig,
  type GeoPosition,
} from '@/lib/geofencing';

export type GeofenceWatchStatus = 'idle' | 'outside' | 'dwelling' | 'entered' | 'error';

export interface UseGeofenceWatchOptions {
  thresholdMs?: number;
  maxSpeedMps?: number;
  enabled?: boolean;
}

export function useGeofenceWatch(
  config: GeofenceConfig | null | undefined,
  onTrigger?: () => void,
  options?: UseGeofenceWatchOptions
) {
  const [status, setStatus] = useState<GeofenceWatchStatus>('idle');
  const [currentPos, setCurrentPos] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trackerRef = useRef<DwellTimeTracker>(
    new DwellTimeTracker(options?.thresholdMs ?? 120_000, options?.maxSpeedMps ?? 4.16)
  );
  const onTriggerRef = useRef(onTrigger);
  onTriggerRef.current = onTrigger;

  const reset = useCallback(() => {
    setStatus('idle');
    setCurrentPos(null);
    setError(null);
    trackerRef.current.reset();
  }, []);

  useEffect(() => {
    if (!options?.enabled && options?.enabled !== undefined) {
      setStatus('idle');
      return;
    }

    if (!config || config.type === 'none') {
      setStatus('idle');
      return;
    }

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Geolocation wird von diesem Browser nicht unterstützt.');
      setStatus('error');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const geoPos: GeoPosition = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        };

        setCurrentPos(geoPos);
        setError(null);

        const result = trackerRef.current.update(geoPos, config);

        if (result === 'entered') {
          setStatus('entered');
          if (onTriggerRef.current) {
            onTriggerRef.current();
          }
        } else if (result === 'dwelling') {
          setStatus('dwelling');
        } else if (result === 'exited') {
          setStatus('outside');
        } else if (!result && trackerRef.current.getStatus().isInside) {
          setStatus('dwelling');
        } else {
          setStatus('outside');
        }
      },
      (geoError) => {
        setError(geoError.message);
        setStatus('error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [config, options?.enabled]);

  return {
    status,
    currentPos,
    error,
    reset,
  };
}
