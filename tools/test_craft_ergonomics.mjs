import { chromium } from '../frontend/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'C:\\Users\\kasan\\.gemini\\antigravity\\brain\\84da1e3d-0fcd-45a6-8ab4-c3b46adfdbe9\\screenshots';
const BASE_URL = 'http://localhost:3001';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: '01_mobile_390px', width: 390, height: 844, label: 'Mobile (iPhone 14)' },
  { name: '02_tablet_768px', width: 768, height: 1024, label: 'Tablet (iPad Portrait)' },
  { name: '03_small_laptop_1024px', width: 1024, height: 768, label: 'Small Laptop (1024x768)' },
  { name: '04_desktop_1280px', width: 1280, height: 800, label: 'Standard Desktop (1280x800)' },
  { name: '05_fullhd_1920px', width: 1920, height: 1080, label: 'Full HD (1920x1080)' },
];

async function runErgonomicsTest() {
  console.log('======================================================================');
  console.log('📐 CRAFT HUB ERGONOMIE & ZERO-SCROLL MULTI-VIEWPORT VERIFIKATION');
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ locale: 'de-DE' });
  const page = await context.newPage();

  // 1. Login
  console.log('1. Öffne Login unter ' + BASE_URL + '/login...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  
  const demoBtn = page.locator('#demo-login-button');
  if (await demoBtn.count() > 0) {
    console.log('   Klicke 1-Klick Meister-Login...');
    await demoBtn.click();
  } else {
    console.log('   Fallback Email Login...');
    await page.fill('input[type="email"]', '***REMOVED***');
    await page.fill('input[type="password"]', '***REMOVED***');
    await page.click('button[type="submit"]');
  }

  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });
  console.log('   ✅ Eingeloggt! URL:', page.url());

  // 2. Zu /craft navigieren (falls nicht bereits dort)
  console.log('2. Lade /craft (Handwerks-Zentrale)...');
  if (!page.url().includes('/craft')) {
    await page.goto(`${BASE_URL}/craft`, { waitUntil: 'domcontentloaded' });
  }
  await page.waitForTimeout(2500);

  const results = [];

  // 3. Teste alle 5 Viewports
  for (const vp of VIEWPORTS) {
    console.log(`\n--- Teste Viewport: ${vp.label} (${vp.width}x${vp.height}) ---`);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(1000);

    // Prüfe Horizontalen Scrollbalken / Überhang
    const metrics = await page.evaluate(() => {
      const docW = document.documentElement.scrollWidth;
      const winW = window.innerWidth;
      const bodyW = document.body.scrollWidth;
      const mainEl = document.querySelector('main');
      const mainScrollW = mainEl ? mainEl.scrollWidth : 0;
      const mainClientW = mainEl ? mainEl.clientWidth : 0;
      return {
        docScrollWidth: docW,
        windowInnerWidth: winW,
        bodyScrollWidth: bodyW,
        mainScrollWidth: mainScrollW,
        mainClientWidth: mainClientW,
        overhangDoc: Math.max(0, docW - winW),
        overhangBody: Math.max(0, bodyW - winW),
      };
    });

    console.log(`   ScrollWidth: ${metrics.docScrollWidth}px vs InnerWidth: ${metrics.windowInnerWidth}px -> Überhang: ${metrics.overhangDoc}px`);

    // Prüfe Header Button "+ Baustelle anlegen"
    const baustelleBtn = page.locator('#craft-create-baustelle-btn');
    const isBaustelleVisible = await baustelleBtn.isVisible();
    const btnBox = await baustelleBtn.boundingBox();
    const btnText = await baustelleBtn.innerText();
    
    console.log(`   Button "Baustelle anlegen": Sichtbar=${isBaustelleVisible}, Text="${btnText.replace(/\n/g, ' ')}"`);
    if (btnBox) {
      console.log(`   Button Position: x=${Math.round(btnBox.x)}, width=${Math.round(btnBox.width)}, rightEdge=${Math.round(btnBox.x + btnBox.width)} (Fensterbreite: ${vp.width})`);
    }

    // Prüfe Cluster-Buttons
    const siteClusterBtn = page.locator('#craft-cluster-site-btn');
    const commClusterBtn = page.locator('#craft-cluster-commercial-btn');
    const hasSiteCluster = await siteClusterBtn.isVisible();
    const hasCommCluster = await commClusterBtn.isVisible();
    console.log(`   Cluster-Buttons sichtbar: Site=${hasSiteCluster}, Commercial=${hasCommCluster}`);

    // Screenshot aufnehmen
    const screenshotFile = path.join(SCREENSHOT_DIR, `${vp.name}.png`);
    await page.screenshot({ path: screenshotFile, fullPage: false });
    console.log(`   📸 Screenshot: ${screenshotFile}`);

    results.push({
      viewport: vp.label,
      width: vp.width,
      overhang: metrics.overhangDoc,
      baustelleBtnVisible: isBaustelleVisible,
      isClipped: btnBox ? (btnBox.x + btnBox.width > vp.width) : true,
      screenshot: screenshotFile,
    });
  }

  // 4. Cluster-Wechsel Interaktionstest
  console.log('\n--- 4. Teste Cluster-Wechsel Interaktion ---');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(500);

  console.log('   Klicke "Kaufmännisch & Abrechnung" Cluster...');
  const commClusterBtn = page.locator('#craft-cluster-commercial-btn');
  await commClusterBtn.click();
  await page.waitForTimeout(1000);

  const invoicesTab = page.locator('#craft-tab-invoices-btn');
  const gaebTab = page.locator('#craft-tab-gaeb-btn');
  const wholesaleTab = page.locator('#craft-tab-wholesale-btn');
  const marginTab = page.locator('#craft-tab-margin-btn');

  console.log('   Kaufmännische Tabs sichtbar:');
  console.log('   - Rechnungen & DATEV:', await invoicesTab.isVisible());
  console.log('   - GAEB / LV:', await gaebTab.isVisible());
  console.log('   - Großhandel:', await wholesaleTab.isVisible());
  console.log('   - Nachkalkulation:', await marginTab.isVisible());

  const commScreenshot = path.join(SCREENSHOT_DIR, '06_commercial_cluster_active.png');
  await page.screenshot({ path: commScreenshot, fullPage: false });
  console.log(`   📸 Screenshot Commercial Cluster: ${commScreenshot}`);

  console.log('\n   Wechsle zurück zu "Baustelle & Doku" Cluster...');
  const siteClusterBtn = page.locator('#craft-cluster-site-btn');
  await siteClusterBtn.click();
  await page.waitForTimeout(1000);

  const reportsTab = page.locator('#craft-tab-reports-btn');
  const measurementsTab = page.locator('#craft-tab-measurements-btn');
  const geofenceTab = page.locator('#craft-tab-geofence-btn');
  const pinningTab = page.locator('#craft-tab-pinning-btn');

  console.log('   Baustellen Tabs sichtbar:');
  console.log('   - Bautagesberichte:', await reportsTab.isVisible());
  console.log('   - VOB-Aufmaß:', await measurementsTab.isVisible());
  console.log('   - GPS-Geofencing:', await geofenceTab.isVisible());
  console.log('   - Plan-Pinning:', await pinningTab.isVisible());

  await browser.close();

  console.log('\n======================================================================');
  console.log('📊 TEST-ERGEBNISSE ZUSAMMENFASSUNG:');
  console.log('======================================================================');
  let allPassed = true;
  for (const r of results) {
    const passed = r.overhang === 0 && r.baustelleBtnVisible && !r.isClipped;
    if (!passed) allPassed = false;
    console.log(`${passed ? '✅' : '❌'} ${r.viewport}: Überhang=${r.overhang}px, Button sichtbar=${r.baustelleBtnVisible}, Abgeschnitten=${r.isClipped}`);
  }

  if (allPassed) {
    console.log('\n🎉 ALLE ERGONOMIE- UND ZERO-SCROLL-KRITERIEN ZU 100% ERFÜLLT!');
  } else {
    console.error('\n⚠️ Mindestens ein Kriterium ist fehlgeschlagen.');
    process.exit(1);
  }
}

runErgonomicsTest().catch(err => {
  console.error('Test-Ausführung fehlgeschlagen:', err);
  process.exit(1);
});
