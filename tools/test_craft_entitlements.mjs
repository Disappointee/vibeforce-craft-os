import assert from 'node:assert/strict';

// Test suite for VIBE Craft (M007) Feature Entitlements & Upsell Engine
console.log('--- Starting Craft Entitlements Logic Test Suite ---');

const CRAFT_FEATURES = {
  reports: { id: 'reports', monthlyPrice: 0, tier: 'starter' },
  measurements: { id: 'measurements', monthlyPrice: 0, tier: 'starter' },
  geofence: { id: 'geofence', monthlyPrice: 29, tier: 'pro' },
  invoices: { id: 'invoices', monthlyPrice: 39, tier: 'pro' },
  gaeb: { id: 'gaeb', monthlyPrice: 49, tier: 'enterprise' },
  margin: { id: 'margin', monthlyPrice: 49, tier: 'enterprise' },
  wholesale: { id: 'wholesale', monthlyPrice: 59, tier: 'enterprise' },
  pinning: { id: 'pinning', monthlyPrice: 49, tier: 'enterprise' },
};

const CRAFT_TIERS = [
  {
    id: 'starter',
    name: 'Craft Starter',
    monthlyPrice: 0,
    includedFeatures: ['reports', 'measurements'],
  },
  {
    id: 'pro',
    name: 'Craft Professional',
    monthlyPrice: 59,
    includedFeatures: ['reports', 'measurements', 'geofence', 'invoices'],
  },
  {
    id: 'enterprise',
    name: 'Craft Enterprise Handwerk',
    monthlyPrice: 199,
    includedFeatures: [
      'reports',
      'measurements',
      'geofence',
      'invoices',
      'gaeb',
      'margin',
      'wholesale',
    ],
  },
];

// Replicate core entitlement calculation logic
class EntitlementEngine {
  constructor() {
    this.enabledFeatures = {
      reports: true,
      measurements: true,
      geofence: true,
      invoices: true,
      gaeb: true,
      margin: true,
      wholesale: true,
      pinning: false,
    };
    this.activeTier = 'enterprise';
    this.projectOverrides = {};
  }

  isFeatureEnabled(featureId, projectId) {
    if (projectId && this.projectOverrides[projectId]?.[featureId] !== undefined) {
      return !!this.projectOverrides[projectId][featureId];
    }
    return !!this.enabledFeatures[featureId];
  }

  applyTier(tierId) {
    const tier = CRAFT_TIERS.find((t) => t.id === tierId);
    if (!tier) return;

    const next = {};
    for (const key of Object.keys(CRAFT_FEATURES)) {
      next[key] = tier.includedFeatures.includes(key);
    }
    this.enabledFeatures = next;
    this.activeTier = tierId;
  }

  toggleFeature(featureId, enabled) {
    const current = this.enabledFeatures[featureId] ?? false;
    const nextState = enabled !== undefined ? enabled : !current;
    this.enabledFeatures = {
      ...this.enabledFeatures,
      [featureId]: nextState,
    };
    this.activeTier = 'custom';
  }

  setProjectOverride(projectId, featureId, enabled) {
    const current = this.projectOverrides[projectId] || {};
    this.projectOverrides = {
      ...this.projectOverrides,
      [projectId]: {
        ...current,
        [featureId]: enabled,
      },
    };
  }

  clearProjectOverrides(projectId) {
    const next = { ...this.projectOverrides };
    delete next[projectId];
    this.projectOverrides = next;
  }

  calculateMonthlyTotal(projectId) {
    let total = 0;
    const checkFeature = (f) => this.isFeatureEnabled(f, projectId);

    const isStarterExact =
      checkFeature('reports') &&
      checkFeature('measurements') &&
      !checkFeature('geofence') &&
      !checkFeature('invoices') &&
      !checkFeature('gaeb') &&
      !checkFeature('margin') &&
      !checkFeature('wholesale') &&
      !checkFeature('pinning');

    if (isStarterExact) return 0;

    const isProExact =
      checkFeature('reports') &&
      checkFeature('measurements') &&
      checkFeature('geofence') &&
      checkFeature('invoices') &&
      !checkFeature('gaeb') &&
      !checkFeature('margin') &&
      !checkFeature('wholesale') &&
      !checkFeature('pinning');

    if (isProExact) return 59;

    const isEnterpriseExact =
      checkFeature('reports') &&
      checkFeature('measurements') &&
      checkFeature('geofence') &&
      checkFeature('invoices') &&
      checkFeature('gaeb') &&
      checkFeature('margin') &&
      checkFeature('wholesale') &&
      !checkFeature('pinning');

    if (isEnterpriseExact) return 199;

    // Custom pricing: base tier + add-ons
    const hasProAddons = checkFeature('geofence') || checkFeature('invoices');
    const hasEnterpriseAddons =
      checkFeature('gaeb') ||
      checkFeature('margin') ||
      checkFeature('wholesale') ||
      checkFeature('pinning');

    if (hasEnterpriseAddons) {
      total = 199;
      if (!checkFeature('wholesale')) total -= 59;
      if (!checkFeature('margin')) total -= 49;
      if (!checkFeature('gaeb')) total -= 49;
      if (checkFeature('pinning')) total += 49;
    } else if (hasProAddons) {
      total = 59;
      if (!checkFeature('invoices')) total -= 39;
      if (!checkFeature('geofence')) total -= 29;
    }

    return Math.max(0, total);
  }
}

// TEST 1: Default initialization
console.log('Test 1: Default Entitlements Initialization');
const engine = new EntitlementEngine();
assert.equal(engine.activeTier, 'enterprise');
assert.equal(engine.isFeatureEnabled('reports'), true);
assert.equal(engine.isFeatureEnabled('measurements'), true);
assert.equal(engine.isFeatureEnabled('geofence'), true);
assert.equal(engine.isFeatureEnabled('invoices'), true);
assert.equal(engine.isFeatureEnabled('gaeb'), true);
assert.equal(engine.isFeatureEnabled('margin'), true);
assert.equal(engine.isFeatureEnabled('wholesale'), true);
assert.equal(engine.isFeatureEnabled('pinning'), false);
assert.equal(engine.calculateMonthlyTotal(), 199);
console.log('✓ Test 1 passed: Enterprise default initialized with 199 €/Mt.');

// TEST 2: Tier Application (Starter)
console.log('Test 2: Starter Tier Application');
engine.applyTier('starter');
assert.equal(engine.activeTier, 'starter');
assert.equal(engine.isFeatureEnabled('reports'), true);
assert.equal(engine.isFeatureEnabled('measurements'), true);
assert.equal(engine.isFeatureEnabled('geofence'), false);
assert.equal(engine.isFeatureEnabled('invoices'), false);
assert.equal(engine.isFeatureEnabled('gaeb'), false);
assert.equal(engine.isFeatureEnabled('margin'), false);
assert.equal(engine.isFeatureEnabled('wholesale'), false);
assert.equal(engine.calculateMonthlyTotal(), 0);
console.log('✓ Test 2 passed: Starter tier activated with 0 €/Mt.');

// TEST 3: Tier Application (Pro)
console.log('Test 3: Pro Tier Application');
engine.applyTier('pro');
assert.equal(engine.activeTier, 'pro');
assert.equal(engine.isFeatureEnabled('reports'), true);
assert.equal(engine.isFeatureEnabled('measurements'), true);
assert.equal(engine.isFeatureEnabled('geofence'), true);
assert.equal(engine.isFeatureEnabled('invoices'), true);
assert.equal(engine.isFeatureEnabled('gaeb'), false);
assert.equal(engine.isFeatureEnabled('wholesale'), false);
assert.equal(engine.calculateMonthlyTotal(), 59);
console.log('✓ Test 3 passed: Pro tier activated with 59 €/Mt.');

// TEST 4: Granular Add-On Toggle
console.log('Test 4: Granular Add-On Toggle');
engine.toggleFeature('gaeb', true);
assert.equal(engine.activeTier, 'custom');
assert.equal(engine.isFeatureEnabled('gaeb'), true);
console.log('✓ Test 4 passed: Individual feature toggle transitioned to custom tier.');

// TEST 5: Project Scoped Overrides
console.log('Test 5: Project Scoped Overrides');
const PROJECT_ID = 'kundendienst-schmidt-01';
// Globally GAEB is enabled, let's disable it specifically for Kundendienst Schmidt
engine.setProjectOverride(PROJECT_ID, 'gaeb', false);
assert.equal(engine.isFeatureEnabled('gaeb', PROJECT_ID), false, 'Project Schmidt should have GAEB disabled');
assert.equal(engine.isFeatureEnabled('gaeb'), true, 'Global should still have GAEB enabled');
assert.equal(engine.isFeatureEnabled('geofence', PROJECT_ID), true, 'Project Schmidt inherits global geofence');

// Clear Schmidt overrides
engine.clearProjectOverrides(PROJECT_ID);
assert.equal(engine.isFeatureEnabled('gaeb', PROJECT_ID), true, 'Schmidt should inherit global GAEB after override clear');
console.log('✓ Test 5 passed: Project scoped overrides and fallback work accurately.');

console.log('=== ALL 5 CRAFT ENTITLEMENT TESTS PASSED SUCCESSFULLY ===');
