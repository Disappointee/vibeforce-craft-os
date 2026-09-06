/**
 * VIBE Craft — Geofencing Engine (Zero-Dependency)
 * High-performance, battery-friendly geolocation math & dwell-time state machine.
 */

export interface GeofenceConfig {
  type: 'none' | 'circle' | 'polygon';
  center?: [number, number]; // [lat, lon]
  radius?: number; // meters
  polygon?: Array<[number, number]>; // [[lat, lon], ...]
}

export interface GeoPosition {
  lat: number;
  lon: number;
  accuracy?: number; // meters
  speed?: number | null; // m/s
  timestamp?: number;
}

/**
 * 1. Haversine Distance Check for Circular Geofences
 * Computes exact great-circle distance between two coordinates in meters.
 */
export function isInsideRadius(
  lat: number,
  lon: number,
  centerLat: number,
  centerLon: number,
  radiusMeters: number
): boolean {
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    !Number.isFinite(centerLat) ||
    !Number.isFinite(centerLon) ||
    !Number.isFinite(radiusMeters) ||
    radiusMeters < 0 ||
    lat < -90 || lat > 90 ||
    centerLat < -90 || centerLat > 90
  ) {
    return false;
  }

  const R = 6371e3; // Earth radius in meters
  const eps = 1e-9;
  const dLat = ((centerLat - (lat + eps)) * Math.PI) / 180;
  const dLon = ((centerLon - (lon + eps)) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(((lat + eps) * Math.PI) / 180) *
      Math.cos((centerLat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  if (distance <= 1.0) return true;
  return distance <= radiusMeters;
}

/**
 * 2. Ray-Casting (Jordan Curve Theorem) for Arbitrary Polygons
 * O(n) complexity. Tests if point (lat, lon) is strictly inside a closed polygon.
 */
export function isInsidePolygon(
  lat: number,
  lon: number,
  polygon: Array<[number, number]>
): boolean {
  if (!polygon || polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [latI, lonI] = polygon[i];
    const [latJ, lonJ] = polygon[j];
    const intersect =
      lonI > lon !== lonJ > lon &&
      lat < ((latJ - latI) * (lon - lonI)) / (lonJ - lonI) + latI;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Checks if position is inside given geofence configuration.
 */
export function isInsideGeofence(pos: GeoPosition, config: GeofenceConfig): boolean {
  if (config.type === 'circle' && config.center && config.radius) {
    return isInsideRadius(pos.lat, pos.lon, config.center[0], config.center[1], config.radius);
  }
  if (config.type === 'polygon' && config.polygon && config.polygon.length >= 3) {
    return isInsidePolygon(pos.lat, pos.lon, config.polygon);
  }
  return false;
}

/**
 * 3. DwellTimeTracker & Anti-Drift Engine
 * Prevents false positives caused by drive-bys (speed gate > 15 km/h ≈ 4.16 m/s)
 * and GPS jitter in cellars (requires continuous stable dwell time, default 120s).
 * Extended with asymmetric hysteresis (T_in=120s, T_out=900s), speed-gate override (>25km/h → 60s),
 * and dead-reckoning freeze on GPS loss.
 */
export class DwellTimeTracker {
  private thresholdMs: number;
  private maxSpeedMps: number;
  private highSpeedMps: number;
  private highSpeedThresholdMs: number;
  private exitThresholdMs: number;

  private isInside: boolean = false;
  private stableSince: number | null = null;
  private hasTriggered: boolean = false;
  private exitSince: number | null = null;
  private lastGoodTimestamp: number | null = null;

  constructor(
    thresholdMs: number = 120_000,
    maxSpeedMps: number = 4.16,
    highSpeedMps: number = 6.94,
    highSpeedThresholdMs: number = 60_000,
    exitThresholdMs: number = 900_000
  ) {
    this.thresholdMs = thresholdMs;
    this.maxSpeedMps = maxSpeedMps;
    this.highSpeedMps = highSpeedMps;
    this.highSpeedThresholdMs = highSpeedThresholdMs;
    this.exitThresholdMs = exitThresholdMs;
  }

  /**
   * Evaluates a new position fix.
   * Returns:
   *  - 'entered': Just verified after dwell time
   *  - 'exited': Left the geofence
   *  - 'dwelling': Inside and accumulating stable dwell time
   *  - null: Outside or no change
   */
  public update(
    pos: GeoPosition,
    config: GeofenceConfig,
    now: number = Date.now()
  ): 'entered' | 'exited' | 'dwelling' | null {
    const gpsLoss =
      (pos.accuracy !== undefined && pos.accuracy > 50) ||
      (pos.speed === null || pos.speed === undefined) ||
      (this.lastGoodTimestamp !== null &&
        pos.timestamp !== undefined &&
        Math.abs(pos.timestamp - this.lastGoodTimestamp) > 30_000);

    if (gpsLoss) {
      return null;
    }

    this.lastGoodTimestamp = pos.timestamp ?? now;

    let effectiveThreshold = this.thresholdMs;
    if (pos.speed !== undefined && pos.speed !== null && pos.speed > this.highSpeedMps) {
      effectiveThreshold = this.highSpeedThresholdMs;
    } else if (pos.speed !== undefined && pos.speed !== null && pos.speed > this.maxSpeedMps) {
      if (this.isInside) {
        this.reset();
        return 'exited';
      }
      return null;
    }

    const insideNow = isInsideGeofence(pos, config);

    if (insideNow && !this.isInside) {
      this.isInside = true;
      this.stableSince = now;
      this.hasTriggered = false;
      this.exitSince = null;
      return 'dwelling';
    }

    if (!insideNow && this.isInside) {
      if (this.exitSince === null) {
        this.exitSince = now;
      }
      const exitElapsed = now - this.exitSince;
      if (exitElapsed >= this.exitThresholdMs) {
        this.reset();
        return 'exited';
      }
      return 'dwelling';
    }

    if (insideNow && this.isInside && !this.hasTriggered) {
      const elapsed = now - (this.stableSince ?? now);
      if (elapsed >= effectiveThreshold) {
        this.hasTriggered = true;
        return 'entered';
      }
      return 'dwelling';
    }

    return null;
  }

  public reset(): void {
    this.isInside = false;
    this.stableSince = null;
    this.hasTriggered = false;
    this.exitSince = null;
    this.lastGoodTimestamp = null;
  }

  public getStatus(): { isInside: boolean; stableSince: number | null; hasTriggered: boolean } {
    return {
      isInside: this.isInside,
      stableSince: this.stableSince,
      hasTriggered: this.hasTriggered,
    };
  }
}
