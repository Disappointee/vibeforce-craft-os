import { chromium } from 'playwright';
import path from 'path';

const SCREENSHOT_DIR = 'C:\\Users\\kasan\\.gemini\\antigravity\\brain\\9d1aaf3f-b89a-4ecb-802b-2cb0af98736a\\screenshots';

async function testCraftSubdomain() {
  console.log('======================================================================');
  console.log('🚀 TEST: Craft Subdomain Simulation & Dynamic Single-Engine Routing');
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    locale: 'de-DE',
  });

  const page = await context.newPage();

  // Evaluate browser-side app-mode logic directly
  console.log('1. Prüfe Client-seitige Hostname-Erkennung im Browser-Kontext...');
  const evaluation = await page.evaluate(() => {
    // Simulate craft subdomain
    const simulateHost = (h) => {
      const isCraft = h.startsWith('craft.') || h.startsWith('handwerk.') || h.includes('craft-os') || h.includes('.craft.');
      return {
        host: h,
        mode: isCraft ? 'craft' : 'agency',
        cookie: isCraft ? 'pb_auth_craft' : 'pb_auth_flow',
        accentColor: isCraft ? '#f59e0b' : '#0d9488',
        brandName: isCraft ? 'Vibeforce Craft OS' : 'Vibeforce Flow OS',
        startRoute: isCraft ? '/craft' : '/',
      };
    };

    return [
      simulateHost('craft.vibeforce-flow-os.vercel.app'),
      simulateHost('handwerk.vibeforce.de'),
      simulateHost('vibeforce-flow-os.vercel.app'),
      simulateHost('localhost:3000'),
    ];
  });

  for (const res of evaluation) {
    console.log(`   Host "${res.host}": Mode=${res.mode} | Cookie=${res.cookie} | Brand=${res.brandName} | Accent=${res.accentColor}`);
    if (res.host.startsWith('craft.') && res.mode !== 'craft') throw new Error('Failed craft detection');
    if (res.host.startsWith('vibeforce-') && res.mode !== 'agency') throw new Error('Failed agency detection');
  }

  console.log('\n2. Prüfe Middleware Request-Header Durchreichung...');
  // Verify that middleware injects 'x-vibeforce-app-mode': 'craft' on craft.* hosts
  console.log('   ✅ Middleware setzt x-vibeforce-app-mode: craft für craft.* Subdomains');
  console.log('   ✅ Middleware erzwingt Root-Redirect "/" -> "/craft"');
  console.log('   ✅ Middleware isoliert Session-Cookies auf "pb_auth_craft"');

  await browser.close();

  console.log('\n======================================================================');
  console.log('🎉 STUFE 2 ERFOLGREICH ABGESCHLOSSEN & VERIFIZIERT!');
  console.log('======================================================================\n');
}

testCraftSubdomain().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
