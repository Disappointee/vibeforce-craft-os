import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import {
  getServerCraftLicense,
  setServerCraftLicense,
} from '@/lib/server-entitlements';
import { verifyUserSession, POCKETBASE_URL, withAdminPB } from '@/lib/pocketbase-server';
import type { CraftFeatureId, CraftTierId } from '@/lib/craft-entitlements';
import type { CraftLicenseRecord } from '@/lib/pocketbase-types';

export const dynamic = 'force-dynamic';

async function getAuthUser(req: NextRequest) {
  const session = await verifyUserSession();
  if (session && session.role) return session;

  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    try {
      const pb = new PocketBase(POCKETBASE_URL);
      pb.authStore.save(token, null);
      const refreshed = await pb.collection('users').authRefresh();
      if (refreshed?.record) return refreshed.record;
    } catch {
      // ignore
    }
  }
  return null;
}

/**
 * GET /api/craft/entitlements
 * Returns authoritative licensing state from PocketBase.
 * Optional query parameter: ?projectId=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert (401 Unauthorized)' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId') || undefined;

    // Load active license for this project / global fallback
    const license = await getServerCraftLicense(projectId);

    // If user is admin, also return all project-specific override licenses
    let allLicenses: CraftLicenseRecord[] = [];
    if (user.role === 'admin') {
      allLicenses = await withAdminPB(async (pb) => {
        return await pb.collection('craft_licenses').getFullList<CraftLicenseRecord>({
          sort: '-created',
          requestKey: null,
        });
      });
    }

    return NextResponse.json({
      success: true,
      scope: license.scope,
      tier: license.tier,
      enabledFeatures: license.enabledFeatures,
      allLicenses: user.role === 'admin' ? allLicenses : undefined,
    });
  } catch (error: any) {
    console.error('[Craft Entitlements GET Error]:', error);
    return NextResponse.json(
      { error: error?.message || 'Interner Serverfehler beim Laden der Lizenzen' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/craft/entitlements
 * Saves authoritative license to PocketBase.
 * Hard security: ONLY accessible by Admins!
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert (401 Unauthorized)' },
        { status: 401 }
      );
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        {
          error:
            'Zugriff verweigert: Nur Administratoren dürfen Handwerker-Lizenzen bearbeiten (403 Forbidden).',
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { scope, tier, enabledFeatures, notes } = body;

    if (!scope || !tier || !enabledFeatures) {
      return NextResponse.json(
        { error: 'Fehlende Pflichtfelder: scope, tier und enabledFeatures sind erforderlich.' },
        { status: 400 }
      );
    }

    const savedRecord = await setServerCraftLicense(
      scope,
      tier as CraftTierId,
      enabledFeatures as Record<CraftFeatureId, boolean>,
      notes
    );

    return NextResponse.json({
      success: true,
      message: `Lizenz für "${scope}" erfolgreich in PocketBase gespeichert.`,
      record: savedRecord,
    });
  } catch (error: any) {
    console.error('[Craft Entitlements POST Error]:', error);
    return NextResponse.json(
      { error: error?.message || 'Fehler beim Speichern der Lizenz in PocketBase' },
      { status: 500 }
    );
  }
}
