import { NextRequest, NextResponse } from 'next/server';
import { assertCraftFeatureEntitlement } from '@/lib/server-entitlements';
import { verifyUserSession } from '@/lib/pocketbase-server';

export async function GET(request: NextRequest) {
  const user = await verifyUserSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const projectId = searchParams.get('projectId') || undefined;

  try {
    await assertCraftFeatureEntitlement('geofence', projectId);
  } catch (err: any) {
    return NextResponse.json(
      { error: 'GPS-Geofencing & Baustellenkarte ist für diesen Mandanten nicht lizenziert (403 Forbidden)' },
      { status: 403 }
    );
  }

  if (!q || !q.trim()) {
    return NextResponse.json([]);
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      q.trim()
    )}&limit=5`;

    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'de',
        'User-Agent': 'VibeforceFlowOS/1.0 (contact@vibeforce.internal)',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json([], { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Geocoding service unavailable' }, { status: 502 });
  }
}
