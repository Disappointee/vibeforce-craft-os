import { NextRequest, NextResponse } from 'next/server';
import { verifyUserSession } from '@/lib/pocketbase-server';

const TILE_CACHE_MAX = 500;
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

type CacheEntry = { buf: ArrayBuffer; ts: number };
type TileCache = Map<string, CacheEntry>;

const globalTileCacheKey = Symbol.for('__vibeforce_tile_cache__');
type GlobalWithCache = typeof globalThis & { [globalTileCacheKey]?: TileCache };

const globalWithCache = globalThis as GlobalWithCache;
if (!globalWithCache[globalTileCacheKey]) {
  globalWithCache[globalTileCacheKey] = new Map<string, CacheEntry>();
}

const tileCache = globalWithCache[globalTileCacheKey]!;

function cacheKey(z: number, x: number, y: number): string {
  return `${z}/${x}/${y}`;
}

function evictIfNeeded(): void {
  while (tileCache.size > TILE_CACHE_MAX) {
    const oldestKey = tileCache.keys().next().value;
    if (oldestKey === undefined) break;
    tileCache.delete(oldestKey);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const user = await verifyUserSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolved = await params;
  const { z, x, y } = resolved;

  if (!/^\d+$/.test(z) || !/^\d+$/.test(x) || !/^\d+$/.test(y)) {
    return NextResponse.json({ error: 'Invalid tile coordinates' }, { status: 400 });
  }

  const zoom = parseInt(z, 10);
  const tileX = parseInt(x, 10);
  const tileY = parseInt(y, 10);

  if (zoom < 0 || zoom > 19) {
    return NextResponse.json({ error: 'Zoom level out of range' }, { status: 400 });
  }

  const maxCoord = 1 << zoom;
  if (tileX < 0 || tileX >= maxCoord || tileY < 0 || tileY >= maxCoord) {
    return NextResponse.json({ error: 'Tile coordinate out of range' }, { status: 400 });
  }

  const key = cacheKey(zoom, tileX, tileY);
  const cached = tileCache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return new NextResponse(cached.buf, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=2592000, s-maxage=2592000, immutable',
      },
    });
  }

  const url = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'VibeforceFlowOS/1.0 (self-hosted tile proxy)',
        'Accept': 'image/png',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Upstream tile service error' },
        { status: 502 }
      );
    }

    const buf = await response.arrayBuffer();
    evictIfNeeded();
    tileCache.set(key, { buf, ts: Date.now() });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=2592000, s-maxage=2592000, immutable',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Tile fetch failed' },
      { status: 502 }
    );
  }
}
