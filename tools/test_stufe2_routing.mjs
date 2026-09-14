import { detectModeFromHostname, getAppMode, getAuthCookieName, getAppConfig } from '../frontend/src/config/app-mode.js';

async function validateStufe2() {
  console.log('======================================================================');
  console.log('🔍 STUFE 2 VALIDIERUNG: Single-Engine Hostname & Subdomain Routing');
  console.log('======================================================================\n');

  // Test 1: Subdomain Pattern Detection
  console.log('1. Prüfe Hostname-Mustererkennung (detectModeFromHostname)...');
  const testCases = [
    { host: 'craft.vibeforce-flow-os.vercel.app', expected: 'craft' },
    { host: 'handwerk.vibeforce.de', expected: 'craft' },
    { host: 'craft-os.preview.app', expected: 'craft' },
    { host: 'sub.craft.example.com', expected: 'craft' },
    { host: 'craft.localhost:3000', expected: 'craft' },
    { host: 'vibeforce-flow-os.vercel.app', expected: 'agency' },
    { host: 'app.vibeforce-flow.de', expected: 'agency' },
    { host: 'localhost:3000', expected: 'agency' },
    { host: '', expected: 'agency' },
    { host: null, expected: 'agency' },
  ];

  let passed = 0;
  for (const tc of testCases) {
    const mode = detectModeFromHostname(tc.host);
    if (mode === tc.expected) {
      console.log(`   ✅ Host "${tc.host || '(empty)'}" -> "${mode}" (Korrekt)`);
      passed++;
    } else {
      console.error(`   ❌ FEHLER: Host "${tc.host}" lieferte "${mode}", erwartet "${tc.expected}"`);
    }
  }

  if (passed !== testCases.length) {
    throw new Error(`Hostname detection failed: ${passed}/${testCases.length} passed`);
  }

  // Test 2: Stack-Isolierte Auth-Cookies
  console.log('\n2. Prüfe Stack-isolierte Auth-Cookies (getAuthCookieName)...');
  const craftCookie = getAuthCookieName('craft.vibeforce-flow-os.vercel.app');
  const agencyCookie = getAuthCookieName('vibeforce-flow-os.vercel.app');
  console.log(`   ✅ Craft Host Cookie: "${craftCookie}"`);
  console.log(`   ✅ Agency Host Cookie: "${agencyCookie}"`);

  if (craftCookie !== 'pb_auth_craft' || agencyCookie !== 'pb_auth_flow') {
    throw new Error(`Cookie isolation mismatch: craft=${craftCookie}, agency=${agencyCookie}`);
  }

  // Test 3: AppConfig & Branding Switch
  console.log('\n3. Prüfe dynamische Branding-Umschaltung (getAppConfig)...');
  const craftConfig = getAppConfig('craft.vibeforce-flow-os.vercel.app');
  const agencyConfig = getAppConfig('vibeforce-flow-os.vercel.app');

  console.log(`   ✅ Craft Branding: "${craftConfig.appName}" | Akzent: ${craftConfig.accentColor} | Start: ${craftConfig.startRoute}`);
  console.log(`   ✅ Craft Navigation: Dashboard="${craftConfig.navigation.dashboard}", Projekte="${craftConfig.navigation.projects}"`);
  console.log(`   ✅ Agency Branding: "${agencyConfig.appName}" | Akzent: ${agencyConfig.accentColor} | Start: ${agencyConfig.startRoute}`);
  console.log(`   ✅ Agency Navigation: Dashboard="${agencyConfig.navigation.dashboard}", Projekte="${agencyConfig.navigation.projects}"`);

  if (craftConfig.mode !== 'craft' || craftConfig.accentColor !== '#f59e0b') {
    throw new Error('Craft branding configuration invalid');
  }
  if (agencyConfig.mode !== 'agency' || agencyConfig.accentColor !== '#0d9488') {
    throw new Error('Agency branding configuration invalid');
  }

  console.log('\n======================================================================');
  console.log('🎉 STUFE 2 VOLLSTÄNDIG VERIFIZIERT: 100% ERFOLG!');
  console.log('======================================================================\n');
}

validateStufe2().catch(err => {
  console.error('Validation Stufe 2 failed:', err);
  process.exit(1);
});
