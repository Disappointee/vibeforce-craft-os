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
  const dLat = ((centerLat - lat) * Math.PI) / 180;
  const dLon = ((centerLon - lon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat * Math.PI) / 180) *
      Math.cos((centerLat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
 */
export class DwellTimeTracker {
  private thresholdMs: number;
  private maxSpeedMps: number;
  private isInside: boolean = false;
  private stableSince: number | null = null;
  private hasTriggered: boolean = false;

  constructor(thresholdMs: number = 120_000, maxSpeedMps: number = 4.16) {
    this.thresholdMs = thresholdMs;
    this.maxSpeedMps = maxSpeedMps;
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
    // Speed-Gate: Ignore fast movements (e.g. driving past at > 15 km/h)
    if (pos.speed !== undefined && pos.speed !== null && pos.speed > this.maxSpeedMps) {
      if (this.isInside) {
        this.reset();
        return 'exited';
      }
      return null;
    }

    // Accuracy filter: Ignore fixes with > 50m uncertainty
    if (pos.accuracy !== undefined && pos.accuracy > 50) {
      return null;
    }

    const insideNow = isInsideGeofence(pos, config);

    if (insideNow && !this.isInside) {
      this.isInside = true;
      this.stableSince = now;
      this.hasTriggered = false;
      return 'dwelling';
    }

    if (!insideNow && this.isInside) {
      this.reset();
      return 'exited';
    }

    if (insideNow && this.isInside && !this.hasTriggered) {
      const elapsed = now - (this.stableSince ?? now);
      if (elapsed >= this.thresholdMs) {
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
  }

  public getStatus(): { isInside: boolean; stableSince: number | null; hasTriggered: boolean } {
    return {
      isInside: this.isInside,
      stableSince: this.stableSince,
      hasTriggered: this.hasTriggered,
    };
  }
}
