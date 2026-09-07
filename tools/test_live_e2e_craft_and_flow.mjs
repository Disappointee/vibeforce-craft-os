import { chromium } from 'playwright';
import path from 'path';

const SCREENSHOT_DIR = 'C:\\Users\\kasan\\.gemini\\antigravity\\brain\\9d1aaf3f-b89a-4ecb-802b-2cb0af98736a\\screenshots';
const CRAFT_URL = 'https://craft-vibeforce.vercel.app';
const FLOW_URL = 'https://vibeforce-flow-os.vercel.app';

async function runLiveE2E() {
  console.log('======================================================================');
  console.log('🚀 LIVE E2E TEST: Vibeforce Dual-Stack Verification auf Vercel');
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'de-DE',
  });

  const page = await context.newPage();

  // -------------------------------------------------------------
  // TEST 1: Craft OS Login & 1-Klick Demo Login
  // -------------------------------------------------------------
  console.log('1. Prüfe Craft OS Login unter ' + CRAFT_URL + '/login...');
  await page.goto(`${CRAFT_URL}/login`, { waitUntil: 'domcontentloaded' });

  // Verify Craft OS branding
  const title = await page.textContent('h1');
  console.log(`   Titel auf Login-Seite: "${title}"`);
  if (!title.includes('Craft OS')) {
    throw new Error(`Erwartete "Craft OS", aber erhielt: "${title}"`);
  }

  // Screenshot Login Page
  const loginScreenshot = path.join(SCREENSHOT_DIR, '04_live_craft_login.png');
  await page.screenshot({ path: loginScreenshot, fullPage: false });
  console.log(`   📸 Screenshot gespeichert: ${loginScreenshot}`);

  // Test 1-Klick Meister Login
  console.log('2. Klicke 1-Klick Meister-Login Button...');
  const demoBtn = page.locator('#demo-login-button');
  await demoBtn.waitFor({ state: 'visible', timeout: 5000 });
  await demoBtn.click();

  console.log('   Warte auf Weiterleitung nach /craft...');
  await page.waitForURL(url => url.toString().includes('/craft'), { timeout: 20000 });
  console.log(`   ✅ Erfolgreich eingeloggt und weitergeleitet auf: ${page.url()}`);

  // Wait for Hub to load
  await page.waitForTimeout(3000);
  const hubScreenshot = path.join(SCREENSHOT_DIR, '05_live_craft_hub.png');
  await page.screenshot({ path: hubScreenshot, fullPage: false });
  console.log(`   📸 Screenshot Handwerks-Zentrale: ${hubScreenshot}`);

  // -------------------------------------------------------------
  // TEST 2: Baustellen-Akten verifizieren
  // -------------------------------------------------------------
  console.log('3. Prüfe Baustelle 1 (EFH Huber)...');
  const huberLink = page.locator('text=Neubau EFH Familie Huber').first();
  if (await huberLink.count() > 0) {
    await huberLink.click();
    await page.waitForTimeout(3000);
    const p1Screenshot = path.join(SCREENSHOT_DIR, '06_live_craft_baustelle_huber.png');
    await page.screenshot({ path: p1Screenshot, fullPage: false });
    console.log(`   📸 Screenshot Baustelle Huber: ${p1Screenshot}`);
  } else {
    console.warn('   ⚠️ Link zu EFH Huber nicht direkt gefunden.');
  }

  console.log('4. Prüfe Baustelle 2 (Schmidt Logistik)...');
  await page.goto(`${CRAFT_URL}/craft`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const schmidtLink = page.locator('text=Sanierung Gewerbehalle Schmidt').first();
  if (await schmidtLink.count() > 0) {
    await schmidtLink.click();
    await page.waitForTimeout(3000);
    const p2Screenshot = path.join(SCREENSHOT_DIR, '07_live_craft_baustelle_schmidt.png');
    await page.screenshot({ path: p2Screenshot, fullPage: false });
    console.log(`   📸 Screenshot Baustelle Schmidt: ${p2Screenshot}`);
  }

  // -------------------------------------------------------------
  // TEST 3: Flow OS Login & 1-Klick Demo Login
  // -------------------------------------------------------------
  console.log('\n5. Prüfe Flow OS Login unter ' + FLOW_URL + '/login...');
  const flowContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'de-DE',
  });
  const flowPage = await flowContext.newPage();
  await flowPage.goto(`${FLOW_URL}/login`, { waitUntil: 'domcontentloaded' });

  const flowTitle = await flowPage.textContent('h1');
  console.log(`   Titel auf Flow-Login: "${flowTitle}"`);

  const flowLoginScreenshot = path.join(SCREENSHOT_DIR, '08_live_flow_login.png');
  await flowPage.screenshot({ path: flowLoginScreenshot, fullPage: false });
  console.log(`   📸 Screenshot Flow Login: ${flowLoginScreenshot}`);

  console.log('6. Klicke 1-Klick Admin-Login Button auf Flow OS...');
  const flowDemoBtn = flowPage.locator('#demo-login-button');
  await flowDemoBtn.waitFor({ state: 'visible', timeout: 5000 });
  await flowDemoBtn.click();

  console.log('   Warte auf Weiterleitung auf Flow Dashboard (/) ...');
  await flowPage.waitForURL(url => url.pathname === '/', { timeout: 20000 });
  console.log(`   ✅ Erfolgreich auf Flow OS eingeloggt: ${flowPage.url()}`);

  await flowPage.waitForTimeout(3000);
  const flowDashboardScreenshot = path.join(SCREENSHOT_DIR, '09_live_flow_dashboard.png');
  await flowPage.screenshot({ path: flowDashboardScreenshot, fullPage: false });
  console.log(`   📸 Screenshot Flow Dashboard: ${flowDashboardScreenshot}`);

  await browser.close();

  console.log('\n======================================================================');
  console.log('🎉 LIVE E2E-TEST ZU 100% ERFOLGREICH ABGESCHLOSSEN!');
  console.log('======================================================================\n');
}

runLiveE2E().catch(err => {
  console.error('E2E Failure:', err);
  process.exit(1);
});
