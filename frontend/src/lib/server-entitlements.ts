import 'server-only';

import { withAdminPB } from './pocketbase-server';
import type { CraftFeatureId, CraftTierId } from './craft-entitlements';
import type { CraftLicenseRecord } from './pocketbase-types';

export interface ServerCraftLicenseResult {
  scope: string;
  tier: CraftTierId;
  enabledFeatures: Record<CraftFeatureId, boolean>;
  isFeatureEnabled: (featureId: CraftFeatureId) => boolean;
}

const DEFAULT_GLOBAL_FEATURES: Record<CraftFeatureId, boolean> = {
  reports: true,
  measurements: true,
  geofence: true,
  invoices: true,
  gaeb: true,
  margin: true,
  wholesale: true,
  pinning: false,
};

/**
 * Authoritatively resolves the active license from PocketBase.
 * Checks project-level override first; falls back to global default.
 */
export async function getServerCraftLicense(
  projectId?: string
): Promise<ServerCraftLicenseResult> {
  return withAdminPB(async (pb) => {
    let licenseRecord: CraftLicenseRecord | null = null;

    // 1. Check for project-specific override
    if (projectId) {
      try {
        const projectLicenses = await pb
          .collection('craft_licenses')
          .getFullList<CraftLicenseRecord>({
            filter: pb.filter('scope = {:scope}', { scope: `project:${projectId}` }),
            sort: '-created',
            requestKey: null,
          });
        if (projectLicenses.length > 0) {
          licenseRecord = projectLicenses[0];
        }
      } catch (err) {
        console.warn(`[getServerCraftLicense] Failed to query project license for ${projectId}:`, err);
      }
    }

    // 2. Fall back to global configuration
    if (!licenseRecord) {
      try {
        const globalLicenses = await pb
          .collection('craft_licenses')
          .getFullList<CraftLicenseRecord>({
            filter: 'scope = "global"',
            sort: '-created',
            requestKey: null,
          });
        if (globalLicenses.length > 0) {
          licenseRecord = globalLicenses[0];
        }
      } catch (err) {
        console.warn('[getServerCraftLicense] Failed to query global license:', err);
      }
    }

    const tier = (licenseRecord?.tier as CraftTierId) || 'enterprise';
    const enabledFeatures: Record<CraftFeatureId, boolean> = {
      ...DEFAULT_GLOBAL_FEATURES,
      ...(licenseRecord?.enabled_features as Record<CraftFeatureId, boolean> | undefined),
    };

    return {
      scope: licenseRecord?.scope || 'global_fallback',
      tier,
      enabledFeatures,
      isFeatureEnabled: (featureId: CraftFeatureId) => {
        return !!enabledFeatures[featureId];
      },
    };
  });
}

/**
 * Hard server-side entitlement assertion.
 * Throws a 403 Forbidden error if the requested module is not licensed.
 */
export async function assertCraftFeatureEntitlement(
  featureId: CraftFeatureId,
  projectId?: string
): Promise<void> {
  const license = await getServerCraftLicense(projectId);
  if (!license.isFeatureEnabled(featureId)) {
    const err = new Error(
      `[Craft Entitlement 403]: Das Handwerker-Modul "${featureId}" ist für diesen Mandanten/dieses Projekt nicht lizenziert.`
    );
    (err as any).statusCode = 403;
    throw err;
  }
}

/**
 * Persists an updated license to PocketBase (Admin only).
 */
export async function setServerCraftLicense(
  scope: string,
  tier: CraftTierId,
  enabledFeatures: Record<CraftFeatureId, boolean>,
  notes?: string
): Promise<CraftLicenseRecord> {
  return withAdminPB(async (pb) => {
    const cleanScope = scope.trim();
    const existing = await pb
      .collection('craft_licenses')
      .getFullList<CraftLicenseRecord>({
        filter: pb.filter('scope = {:scope}', { scope: cleanScope }),
        sort: '-created',
        requestKey: null,
      });

    if (existing.length > 0) {
      const recordId = existing[0].id;
      return await pb.collection('craft_licenses').update<CraftLicenseRecord>(recordId, {
        tier,
        enabled_features: enabledFeatures,
        notes: notes || `Updated on ${new Date().toISOString()}`,
      });
    } else {
      return await pb.collection('craft_licenses').create<CraftLicenseRecord>({
        scope: cleanScope,
        tier,
        enabled_features: enabledFeatures,
        notes: notes || `Created on ${new Date().toISOString()}`,
      });
    }
  });
}
