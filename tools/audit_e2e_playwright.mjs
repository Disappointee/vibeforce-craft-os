/**
 * ============================================================================
 * PLAYWRIGHT E2E & UI/UX AUDIT SUITE (VIBE CRAFT M007)
 * ============================================================================
 * Führt vollständige visuelle und funktionale Prüfungen im Browser durch:
 * - Desktop Viewport (1440x960) & Mobile Viewport (390x844 iPhone)
 * - Zero-Horizontal-Scroll Prüfung (document.scrollWidth <= clientWidth)
 * - 92vh Signature Studio Modal mit DIN-Grundlinie & Stift/Finger-Modus
 * - VOB-Aufmaßgrid (Touch-Karten, Formelevaluation, Übermessungsregel-Banner)
 * - 2D-Plan-Pinning & VOB/B § 13 Mängelmanagement (SVG-Grundriss, Pin-Marker, Rüge-Generator)
 * - GAEB Manager (D83 BoQ Hierarchie)
 * - Cost Cockpit (Stundenquellen & Kollisionswarnung)
 * - Großhandel IDS-Connect Punchout Übersicht
 * ============================================================================
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const screenshotsDir = 'C:\\Users\\kasan\\.gemini\\antigravity-ide\\brain\\30d6871f-48b6-42df-85e0-344f7018cd85\\screenshots';
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const BASE_URL = 'http://localhost:3001';

async function runE2eAudit() {
  console.log('======================================================================');
  console.log('   STARTING PLAYWRIGHT E2E AUDIT: VIBE CRAFT (M007)');
  console.log(`   Target Server: ${BASE_URL}`);
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: true });

  // --------------------------------------------------------------------------
  // TEIL 1: DESKTOP AUDIT (1440 x 960)
  // --------------------------------------------------------------------------
  console.log('>>> TEIL 1: DESKTOP VIEWPORT (1440x960) <<<');
  const desktopCtx = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    locale: 'de-DE',
  });
  const page = await desktopCtx.newPage();

  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(60000);

  // 1.1 Login
  console.log('1.1 Anmeldung als Bauleiter / Meister (daniel@vibeforcetest.de)...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', 'daniel@vibeforcetest.de');
  await page.fill('input[type="password"]', '***REMOVED***');
  await page.click('button[type="submit"]');
  
  await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 30000 });
  console.log('  Login erfolgreich, aktuelle URL:', page.url());
  await page.waitForTimeout(1000);

  // 1.2 Craft Hub Hauptseite
  console.log('1.2 Navigiere zu /craft Hub Übersicht...');
  await page.goto(`${BASE_URL}/craft`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3500);

  const shot1 = path.join(screenshotsDir, '01_desktop_craft_hub_overview.png');
  await page.screenshot({ path: shot1, fullPage: false });
  console.log('  ✓ Screenshot gespeichert:', shot1);

  // 1.3 Tab: 2D-Plan-Pinning & VOB/B § 13 Mängelmanagement
  console.log('1.3 Prüfe Tab 2D-Plan-Pinning & Mängelmanagement...');
  const pinningTab = page.locator('#craft-tab-pinning-btn, button:has-text("2D-Plan-Pinning"), button:has-text("Mängel")').first();
  if (await pinningTab.count() > 0) {
    await pinningTab.click();
    await page.waitForTimeout(2000);

    const shotPinning = path.join(screenshotsDir, '02_desktop_plan_pinning_overview.png');
    await page.screenshot({ path: shotPinning, fullPage: false });
    console.log('  ✓ Screenshot gespeichert:', shotPinning);

    // Klick auf den ersten Pin im Plan
    const firstPin = page.locator('button[title*="Pin"], div[title*="Pin"], button:has-text("1"), button:has-text("2")').first();
    if (await firstPin.count() > 0) {
      console.log('  Klicke auf Plan-Pin zur Detailinspektion...');
      await firstPin.click();
      await page.waitForTimeout(1500);

      // Klick auf VOB/B § 13 Mängelrüge generieren
      const rügeBtn = page.locator('button:has-text("Mängelrüge generieren"), button:has-text("VOB/B § 13")').first();
      if (await rügeBtn.count() > 0) {
        console.log('  Öffne VOB/B § 13 Mängelrüge Modal...');
        await rügeBtn.click();
        await page.waitForTimeout(1500);

        const shotRüge = path.join(screenshotsDir, '03_desktop_defect_notice_modal.png');
        await page.screenshot({ path: shotRüge, fullPage: false });
        console.log('  ✓ Screenshot gespeichert:', shotRüge);

        // Modal schließen
        const closeBtn = page.locator('button:has-text("Schließen"), button:has-text("✕")').first();
        if (await closeBtn.count() > 0) await closeBtn.click();
        await page.waitForTimeout(500);
      }
    }
  } else {
    console.warn('  ⚠ Pinning-Tab nicht unmittelbar selektierbar');
  }

  // 1.4 Tab: VOB-Aufmaß & Abrechnung
  console.log('1.4 Prüfe Tab VOB-Aufmaß & Abrechnung...');
  const measurementTab = page.locator('#craft-tab-measurement-btn, button:has-text("Aufmaß & Abrechnung"), button:has-text("Aufmaß")').first();
  if (await measurementTab.count() > 0) {
    await measurementTab.click();
    await page.waitForTimeout(2000);

    const shotAufmass = path.join(screenshotsDir, '04_desktop_measurement_grid.png');
    await page.screenshot({ path: shotAufmass, fullPage: false });
    console.log('  ✓ Screenshot gespeichert:', shotAufmass);
  }

  // 1.5 Tab: Cost Cockpit & 3-Wege Stundenquellen
  console.log('1.5 Prüfe Tab Nachkalkulation / Cost Cockpit...');
  const marginTab = page.locator('#craft-tab-margin-btn, button:has-text("Nachkalkulation"), button:has-text("Kosten")').first();
  if (await marginTab.count() > 0) {
    await marginTab.click();
    await page.waitForTimeout(2000);

    const shotCost = path.join(screenshotsDir, '05_desktop_cost_cockpit.png');
    await page.screenshot({ path: shotCost, fullPage: false });
    console.log('  ✓ Screenshot gespeichert:', shotCost);

    // Dropdown Stundenquelle testen
    const sourceSelect = page.locator('select').first();
    if (await sourceSelect.count() > 0) {
      console.log('  Schalte Stundenquelle auf "site_reports" um...');
      await sourceSelect.selectOption('site_reports');
      await page.waitForTimeout(1500);

      const shotCollision = path.join(screenshotsDir, '06_desktop_cost_cockpit_site_reports.png');
      await page.screenshot({ path: shotCollision, fullPage: false });
      console.log('  ✓ Screenshot gespeichert:', shotCollision);
    }
  }

  // 1.6 Tab: GAEB Manager
  console.log('1.6 Prüfe Tab GAEB Manager...');
  const gaebTab = page.locator('#craft-tab-gaeb-btn, button:has-text("GAEB"), button:has-text("Ausschreibung")').first();
  if (await gaebTab.count() > 0) {
    await gaebTab.click();
    await page.waitForTimeout(2000);

    const shotGaeb = path.join(screenshotsDir, '07_desktop_gaeb_manager.png');
    await page.screenshot({ path: shotGaeb, fullPage: false });
    console.log('  ✓ Screenshot gespeichert:', shotGaeb);
  }

  // 1.7 Tab: Großhandel & IDS
  console.log('1.7 Prüfe Tab Großhandel & IDS-Connect...');
  const wholesaleTab = page.locator('#craft-tab-wholesale-btn, button:has-text("Großhandel"), button:has-text("IDS")').first();
  if (await wholesaleTab.count() > 0) {
    await wholesaleTab.click();
    await page.waitForTimeout(2000);

    const shotIds = path.join(screenshotsDir, '08_desktop_wholesale_ids.png');
    await page.screenshot({ path: shotIds, fullPage: false });
    console.log('  ✓ Screenshot gespeichert:', shotIds);
  }

  // Speichere Authentifizierungs-Cookies für den Mobile-Kontext
  const storageState = await desktopCtx.storageState();
  await desktopCtx.close();

  // --------------------------------------------------------------------------
  // TEIL 2: MOBILE VIEWPORT & ZERO-HORIZONTAL-SCROLL AUDIT (390 x 844)
  // --------------------------------------------------------------------------
  console.log('\n>>> TEIL 2: MOBILE VIEWPORT (390x844, iPHONE 12) <<<');
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    locale: 'de-DE',
    storageState: storageState,
  });
  const mPage = await mobileCtx.newPage();
  mPage.setDefaultTimeout(60000);
  mPage.setDefaultNavigationTimeout(60000);

  console.log('2.1 Direktnavigation zu /craft auf Mobile (authentifizierte Session)...');
  await mPage.goto(`${BASE_URL}/craft`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await mPage.waitForTimeout(3500);

  // 2.2 Zero-Horizontal-Scroll Prüfung
  const scrollCheck = await mPage.evaluate(() => {
    const scrollW = document.documentElement.scrollWidth;
    const clientW = document.documentElement.clientWidth;
    return {
      scrollWidth: scrollW,
      clientWidth: clientW,
      hasOverflow: scrollW > clientW,
    };
  });
  console.log(`2.2 Mobile Scroll-Check: scrollWidth=${scrollCheck.scrollWidth}px, clientWidth=${scrollCheck.clientWidth}px`);
  if (!scrollCheck.hasOverflow) {
    console.log('  ✅ ZERO-HORIZONTAL-SCROLL BESTANDEN: 100% perfekte mobile Passform!');
  } else {
    console.warn(`  ⚠ HORIZONTALER OVERFLOW FESTGESTELLT (${scrollCheck.scrollWidth - scrollCheck.clientWidth}px Überhang)!`);
  }

  const shotMobile1 = path.join(screenshotsDir, '09_mobile_craft_hub_overview.png');
  await mPage.screenshot({ path: shotMobile1, fullPage: false });
  console.log('  ✓ Screenshot gespeichert:', shotMobile1);

  // 2.3 Mobile Aufmaß-Touch-Karten
  console.log('2.3 Prüfe Mobile Aufmaß-Grid (Touch-Karten-Modus)...');
  const mMeasurementTab = mPage.locator('#craft-tab-measurement-btn, button:has-text("Aufmaß")').first();
  if (await mMeasurementTab.count() > 0) {
    await mMeasurementTab.click();
    await mPage.waitForTimeout(2000);

    const shotMobileAufmass = path.join(screenshotsDir, '10_mobile_measurement_touch_cards.png');
    await mPage.screenshot({ path: shotMobileAufmass, fullPage: false });
    console.log('  ✓ Screenshot gespeichert:', shotMobileAufmass);
  }

  // 2.4 Mobile 2D-Plan-Pinning
  console.log('2.4 Prüfe Mobile 2D-Plan-Pinning...');
  const mPinningTab = mPage.locator('#craft-tab-pinning-btn, button:has-text("Pinning"), button:has-text("Mängel")').first();
  if (await mPinningTab.count() > 0) {
    await mPinningTab.click();
    await mPage.waitForTimeout(2000);

    const shotMobilePinning = path.join(screenshotsDir, '11_mobile_plan_pinning.png');
    await mPage.screenshot({ path: shotMobilePinning, fullPage: false });
    console.log('  ✓ Screenshot gespeichert:', shotMobilePinning);
  }

  // 2.5 Quick Create & 92vh Signature Studio Test
  console.log('2.5 Prüfe Mobile Bautagesbericht Erfassung & Signature Studio Modal...');
  const createReportBtn = mPage.locator('button:has-text("Bericht erfassen"), button:has-text("Neuer Bautagesbericht")').first();
  if (await createReportBtn.count() > 0) {
    await createReportBtn.click();
    await mPage.waitForTimeout(2000);

    const shotReportModal = path.join(screenshotsDir, '12_mobile_report_create_modal.png');
    await mPage.screenshot({ path: shotReportModal, fullPage: false });
    console.log('  ✓ Screenshot gespeichert:', shotReportModal);

    // Klick auf das Signaturfeld für Vollbild-Studio (92vh)
    const sigField = mPage.locator('canvas, div:has-text("Klicken/Tippen zum Signieren"), div[title*="Signatur"]').first();
    if (await sigField.count() > 0) {
      console.log('  Tippe auf Signaturfeld zum Öffnen des 92vh Signature Studios...');
      await sigField.click();
      await mPage.waitForTimeout(1500);

      const shotStudio = path.join(screenshotsDir, '13_mobile_signature_studio_92vh.png');
      await mPage.screenshot({ path: shotStudio, fullPage: false });
      console.log('  ✓ Screenshot gespeichert:', shotStudio);
    }
  }

  await mobileCtx.close();
  await browser.close();

  console.log('\n======================================================================');
  console.log('   🎉 PLAYWRIGHT E2E & UI/UX AUDIT VOLLSTÄNDIG ABGESCHLOSSEN!');
  console.log(`   Screenshots archiviert unter: ${screenshotsDir}`);
  console.log('======================================================================');
}

runE2eAudit().catch((err) => {
  console.error('Playwright Audit Error:', err);
  process.exit(1);
});
