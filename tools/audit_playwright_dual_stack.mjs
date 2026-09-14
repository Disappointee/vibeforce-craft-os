import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'C:\\Users\\kasan\\.gemini\\antigravity\\brain\\568fb111-7fa9-46aa-924c-5baba7305d6a\\screenshots';
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const TARGET_URL = process.env.TARGET_URL || 'https://vibeforce-flow-os.vercel.app';

async function runDualStackPlaywrightAudit() {
  console.log('======================================================================');
  console.log('🚀 STARTE PLAYWRIGHT CRAFT-AUDIT & VERIFIKATION');
  console.log(`   Ziel: ${TARGET_URL}`);
  console.log(`   Screenshots: ${SCREENSHOT_DIR}`);
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: true });
  
  // --------------------------------------------------------------------------
  // 1. DESKTOP VIEWPORT (1440x960)
  // --------------------------------------------------------------------------
  const desktopCtx = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    locale: 'de-DE',
  });
  const page = await desktopCtx.newPage();
  page.setDefaultTimeout(45000);

  console.log('1. [Auth] Login an ' + TARGET_URL + '/login...');
  await page.goto(`${TARGET_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  
  // Fill credentials
  await page.fill('input[type="email"]', '***REMOVED***');
  await page.fill('input[type="password"]', '***REMOVED***');
  await page.click('button[type="submit"]');

  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 20000 });
  console.log('   ✅ Login erfolgreich! Zielseite:', page.url());

  // 2. Navigiere zu /craft (Handwerks-Zentrale)
  console.log('\n2. [Craft Hub] Navigiere zu /craft...');
  await page.goto(`${TARGET_URL}/craft`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const shotHub = path.join(SCREENSHOT_DIR, '01_craft_hub_desktop.png');
  await page.screenshot({ path: shotHub, fullPage: false });
  console.log('   📸 01_craft_hub_desktop.png');

  // 3. Bautagesbericht (Formular & VOB/B § 6 Behinderungsanzeige)
  console.log('\n3. [Bautagesbericht] Öffne Schnellerfassung / Bautagesbericht-Modal...');
  const reportBtn = page.locator('#craft-create-report-btn, button:has-text("Bericht erfassen"), button:has-text("Neuer Bautagesbericht")').first();
  if (await reportBtn.count() > 0) {
    await reportBtn.click();
    await page.waitForTimeout(1500);

    const shotReportModal = path.join(SCREENSHOT_DIR, '02_bautagesbericht_modal.png');
    await page.screenshot({ path: shotReportModal, fullPage: false });
    console.log('   📸 02_bautagesbericht_modal.png');

    // Prüfe VOB/B § 6 Behinderungsanzeigen-Assistent
    const hindranceBtn = page.locator('button:has-text("Behinderungsanzeige"), button:has-text("VOB/B § 6"), button:has-text("Behinderung erfassen")').first();
    if (await hindranceBtn.count() > 0) {
      console.log('   Klicke auf VOB/B § 6 Behinderungsanzeigen-Assistent...');
      await hindranceBtn.click();
      await page.waitForTimeout(1000);
      const shotHindrance = path.join(SCREENSHOT_DIR, '03_vob_b_6_behinderungsanzeige.png');
      await page.screenshot({ path: shotHindrance, fullPage: false });
      console.log('   📸 03_vob_b_6_behinderungsanzeige.png');
    }

    // Modal schließen
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
  } else {
    console.log('   ℹ️ Kein Bautagesbericht-Button unmittelbar gefunden.');
  }

  // 4. Digitale Unterschrift (SignaturePad 92vh Studio Modal)
  console.log('\n4. [Digitale Unterschrift] Teste Signature Studio...');
  // Check if signature trigger exists in any modal or card
  const sigTrigger = page.locator('canvas, button:has-text("Unterschrift"), button:has-text("Signieren"), div:has-text("Klicken/Tippen zum Signieren")').first();
  if (await sigTrigger.count() > 0) {
    await sigTrigger.click();
    await page.waitForTimeout(1500);
    const shotSig = path.join(SCREENSHOT_DIR, '04_digitale_unterschrift_studio.png');
    await page.screenshot({ path: shotSig, fullPage: false });
    console.log('   📸 04_digitale_unterschrift_studio.png');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
  } else {
    console.log('   ℹ️ Signatur-Trigger wird über spezifische Ansichten gesteuert.');
  }

  // 5. VOB-Aufmaß (DIN 18299 § 4 Übermessung & Shunting-Yard)
  console.log('\n5. [VOB-Aufmaß] Wechsle zu Tab "VOB-Aufmaß & Aufmaßblatt"...');
  const aufmassTab = page.locator('#craft-tab-measurement-btn, button:has-text("VOB-Aufmaß"), button:has-text("Aufmaß")').first();
  if (await aufmassTab.count() > 0) {
    await aufmassTab.click();
    await page.waitForTimeout(2000);

    const shotAufmass = path.join(SCREENSHOT_DIR, '05_vob_aufmass_grid_desktop.png');
    await page.screenshot({ path: shotAufmass, fullPage: false });
    console.log('   📸 05_vob_aufmass_grid_desktop.png');
  }

  // 6. GAEB Manager (D83/X83 BoQ Hierarchie & Autosave)
  console.log('\n6. [GAEB Manager] Wechsle zu Tab "GAEB / Leistungsverzeichnisse"...');
  const gaebTab = page.locator('#craft-tab-gaeb-btn, button:has-text("GAEB"), button:has-text("Ausschreibung")').first();
  if (await gaebTab.count() > 0) {
    await gaebTab.click();
    await page.waitForTimeout(2000);

    const shotGaeb = path.join(SCREENSHOT_DIR, '06_gaeb_manager_desktop.png');
    await page.screenshot({ path: shotGaeb, fullPage: false });
    console.log('   📸 06_gaeb_manager_desktop.png');
  }

  // 7. Großhandel & IDS-Connect 2.5 Punchout
  console.log('\n7. [Großhandel] Wechsle zu Tab "Großhandel & IDS-Connect"...');
  const wholesaleTab = page.locator('#craft-tab-wholesale-btn, button:has-text("Großhandel"), button:has-text("IDS")').first();
  if (await wholesaleTab.count() > 0) {
    await wholesaleTab.click();
    await page.waitForTimeout(2000);

    const shotWholesale = path.join(SCREENSHOT_DIR, '07_grosshandel_ids_connect.png');
    await page.screenshot({ path: shotWholesale, fullPage: false });
    console.log('   📸 07_grosshandel_ids_connect.png');
  }

  // 8. 2D-Plan-Pinning & VOB/B § 13 Mängelmanagement
  console.log('\n8. [Plan-Pinning] Wechsle zu Tab "Plan-Pinning & Mängel"...');
  const pinningTab = page.locator('#craft-tab-pinning-btn, button:has-text("Plan-Pinning"), button:has-text("Mängel")').first();
  if (await pinningTab.count() > 0) {
    await pinningTab.click();
    await page.waitForTimeout(2000);

    const shotPinning = path.join(SCREENSHOT_DIR, '08_plan_pinning_defects.png');
    await page.screenshot({ path: shotPinning, fullPage: false });
    console.log('   📸 08_plan_pinning_defects.png');
  }

  // 9. Cost Cockpit (Nachkalkulation)
  console.log('\n9. [Cost Cockpit] Wechsle zu Tab "Nachkalkulation & Marge"...');
  const costTab = page.locator('#craft-tab-margin-btn, button:has-text("Nachkalkulation"), button:has-text("Marge")').first();
  if (await costTab.count() > 0) {
    await costTab.click();
    await page.waitForTimeout(2000);

    const shotCost = path.join(SCREENSHOT_DIR, '09_cost_cockpit_margin.png');
    await page.screenshot({ path: shotCost, fullPage: false });
    console.log('   📸 09_cost_cockpit_margin.png');
  }

  // Speichere Desktop Session-State für Mobile
  const storageState = await desktopCtx.storageState();
  await desktopCtx.close();

  // --------------------------------------------------------------------------
  // 2. MOBILE VIEWPORT (390x844 iPhone 12) & ZERO-HORIZONTAL-SCROLL
  // --------------------------------------------------------------------------
  console.log('\n>>> TEIL 2: MOBILE VIEWPORT (390x844) & ZERO-HORIZONTAL-SCROLL <<<');
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    locale: 'de-DE',
    storageState: storageState,
  });
  const mPage = await mobileCtx.newPage();
  mPage.setDefaultTimeout(45000);

  console.log('10. [Mobile Hub] Navigiere zu /craft auf Mobile...');
  await mPage.goto(`${TARGET_URL}/craft`, { waitUntil: 'domcontentloaded' });
  await mPage.waitForTimeout(3000);

  // Scroll Check
  const scrollMetrics = await mPage.evaluate(() => {
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    };
  });
  console.log(`    Messung: scrollWidth=${scrollMetrics.scrollWidth}px, clientWidth=${scrollMetrics.clientWidth}px`);
  if (scrollMetrics.scrollWidth <= scrollMetrics.clientWidth) {
    console.log('    ✅ ZERO-HORIZONTAL-SCROLL BESTÄTIGT (0px Überhang)!');
  } else {
    console.warn(`    ⚠️ Overflow festgestellt: ${scrollMetrics.scrollWidth - scrollMetrics.clientWidth}px!`);
  }

  const shotMobileHub = path.join(SCREENSHOT_DIR, '10_mobile_craft_hub.png');
  await mPage.screenshot({ path: shotMobileHub, fullPage: false });
  console.log('    📸 10_mobile_craft_hub.png');

  // Mobile Aufmaß (Touch-Karten)
  console.log('11. [Mobile Aufmaß] Prüfe Touch-Karten...');
  const mAufmassTab = mPage.locator('#craft-tab-measurement-btn, button:has-text("Aufmaß")').first();
  if (await mAufmassTab.count() > 0) {
    await mAufmassTab.click();
    await mPage.waitForTimeout(2000);
    const shotMobileAufmass = path.join(SCREENSHOT_DIR, '11_mobile_aufmass_touch_cards.png');
    await mPage.screenshot({ path: shotMobileAufmass, fullPage: false });
    console.log('    📸 11_mobile_aufmass_touch_cards.png');
  }

  await mobileCtx.close();
  await browser.close();

  console.log('\n======================================================================');
  console.log('🎉 PLAYWRIGHT CRAFT-AUDIT VOLLSTÄNDIG ABGESCHLOSSEN!');
  console.log('======================================================================\n');
}

runDualStackPlaywrightAudit().catch(err => {
  console.error('Audit Error:', err);
  process.exit(1);
});
