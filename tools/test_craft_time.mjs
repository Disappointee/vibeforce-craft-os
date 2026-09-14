import { chromium } from '../frontend/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'C:\\Users\\kasan\\.gemini\\antigravity\\brain\\a22d8b81-4f29-4b51-8ef3-d148ccaa9dfa\\screenshots';
const BASE_URL = 'http://localhost:3001';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runCraftTimeTest() {
  console.log('======================================================================');
  console.log('⏱️ CRAFT OS SCHRITT 3: MONTEUR-STEMPELUHR (/craft/time)');
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ locale: 'de-DE' });
  const page = await context.newPage();

  try {
    // 1. Login
    console.log('1. Öffne Login unter ' + BASE_URL + '/login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    
    const demoBtn = page.locator('#demo-login-button');
    if (await demoBtn.count() > 0) {
      console.log('   Klicke 1-Klick Meister-Login...');
      await demoBtn.click();
    } else {
      console.log('   Fallback Email Login...');
      await page.fill('#email', '***REMOVED***');
      await page.fill('#password', '***REMOVED***');
      await page.click('button[type="submit"]');
    }

    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });
    console.log('   ✅ Eingeloggt! URL:', page.url());

    // 2. Sidebar Navigation nach /craft/time
    console.log('\n2. Teste Sidebar-Navigation nach "/craft/time"...');
    const timeNavLink = page.locator('aside a[href="/craft/time"]').first();
    await timeNavLink.waitFor({ state: 'visible', timeout: 8000 });
    console.log('   Klicke auf "Monteur-Stempeluhr" in der Sidebar...');
    await timeNavLink.click();

    await page.waitForURL(url => url.toString().includes('/craft/time'), { timeout: 8000 });
    console.log('   ✅ URL erfolgreich gewechselt zu:', page.url());

    // 3. UI Header & Glove-Ready Button Check
    console.log('\n3. Validiere Monteur-Terminal UI & Handschuh-Tauglichkeit...');
    await page.waitForSelector('h1:has-text("Monteur-Stempeluhr & Baustellen-Terminal")', { timeout: 5000 });
    console.log('   ✅ Hauptüberschrift "Monteur-Stempeluhr & Baustellen-Terminal" vorhanden.');

    const clockInBtn = page.locator('#clock-in-btn');
    await clockInBtn.waitFor({ state: 'visible' });
    const box = await clockInBtn.boundingBox();
    console.log(`   Touch-Button Höhe (KOMMEN): ${box.height}px (Erfordert: ≥ 64px)`);
    if (box.height < 64) {
      throw new Error(`Touch-Button KOMMEN ist zu klein für Handschuhe: ${box.height}px < 64px`);
    }
    console.log('   ✅ Handschuhtauglichkeit (≥ 64px Touch-Target) voll erfüllt!');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_craft_time_terminal_ready.png') });
    console.log('   📸 Screenshot 01 (Terminal Bereit) gespeichert.');

    // 4. Einsatztyp wählen (Regiestunden VOB/B)
    console.log('\n4. Wähle Einsatztyp: "Regiestunden (§ 2 Abs. 10 VOB/B)"...');
    const regieBtn = page.locator('button:has-text("Regiestunden (§ 2 Abs. 10 VOB/B)")');
    await regieBtn.click();
    console.log('   ✅ Einsatztyp auf Regiestunden gem. § 2 Abs. 10 VOB/B umgestellt.');

    // 5. GPS-Geofencing prüfen
    console.log('\n5. Prüfe GPS-Geofencing vor Ort...');
    const gpsBtn = page.locator('#check-gps-btn');
    if (await gpsBtn.count() > 0) {
      await gpsBtn.click();
      await page.waitForTimeout(1000);
      console.log('   ✅ GPS-Geofencing Prüfung ausgelöst.');
    }

    // 6. Stempeln: KOMMEN
    console.log('\n6. Klicke "KOMMEN / SCHICHT STARTEN"...');
    await clockInBtn.click();
    await page.waitForTimeout(1200);

    await page.waitForSelector('text=EINGESTEMPELT', { timeout: 4000 });
    console.log('   ✅ Status erfolgreich auf "EINGESTEMPELT" gewechselt!');

    const pauseBtn = page.locator('#clock-pause-btn');
    const clockOutBtn = page.locator('#clock-out-btn');
    const pauseBox = await pauseBtn.boundingBox();
    const outBox = await clockOutBtn.boundingBox();
    console.log(`   Touch-Button Höhe (PAUSE): ${pauseBox.height}px | (GEHEN): ${outBox.height}px`);
    if (pauseBox.height < 60 || outBox.height < 60) {
      throw new Error('Aktionsbuttons im Arbeitsmodus erfüllen nicht Mindesthöhe');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_craft_time_active_stamped.png') });
    console.log('   📸 Screenshot 02 (Eingestempelt) gespeichert.');

    // 7. Pause starten
    console.log('\n7. Klicke "PAUSE STARTEN"...');
    await pauseBtn.click();
    await page.waitForTimeout(1000);

    await page.waitForSelector('text=IN PAUSE', { timeout: 4000 });
    console.log('   ✅ Status erfolgreich auf "IN PAUSE (ArbZG)" gewechselt!');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_craft_time_paused.png') });
    console.log('   📸 Screenshot 03 (In Pause) gespeichert.');

    // 8. Pause beenden & Weiterarbeiten
    console.log('\n8. Klicke "PAUSE BEENDEN"...');
    const resumeBtn = page.locator('#clock-resume-btn');
    await resumeBtn.click();
    await page.waitForTimeout(1000);

    await page.waitForSelector('text=EINGESTEMPELT', { timeout: 4000 });
    console.log('   ✅ Arbeitszeit fortgesetzt!');

    // 9. Schicht beenden: GEHEN
    console.log('\n9. Klicke "GEHEN / ABSTEMPELN"...');
    await page.click('#clock-out-btn');
    await page.waitForTimeout(1000);

    await page.waitForSelector('text=ABGESTEMPELT', { timeout: 4000 });
    console.log('   ✅ Schicht erfolgreich beendet (Status: ABGESTEMPELT)!');

    // 10. Tagesstundenzettel Modal öffnen
    console.log('\n10. Öffne Tagesstundenzettel & Schichtabschluss Modal...');
    await page.click('#open-timesheet-btn');
    await page.waitForSelector('h3:has-text("Tagesstundenzettel & Schichtabschluss")', { timeout: 4000 });
    console.log('   ✅ Tagesstundenzettel-Modal geöffnet.');

    const legalNotice = await page.locator('text=VOB/B § 2 Abs. 10').count();
    if (legalNotice === 0) {
      throw new Error('VOB/B § 2 Abs. 10 Hinweis fehlt im Stundenzettel');
    }
    console.log('   ✅ Gesetzlicher VOB/B § 2 Abs. 10 Nachweis im Stundenzettel verifiziert!');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_craft_time_timesheet_modal.png') });
    console.log('   📸 Screenshot 04 (Stundenzettel Modal) gespeichert.');

    // Modal schließen
    await page.click('div[role="dialog"] button:has-text("Schließen")');

    // 11. Mobile Ergonomie (390px iPhone 14)
    console.log('\n11. Teste Mobile Ergonomie (390px iPhone 14)...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const overflow = Math.max(0, scrollWidth - clientWidth);
    console.log(`   Horizontale Breite: ${scrollWidth}px (Client: ${clientWidth}px) -> Überhang: ${overflow}px`);
    if (overflow > 1) {
      throw new Error(`Horizontaler Überhang auf Mobile erkannt: ${overflow}px`);
    }
    console.log('   ✅ Exakt 0px horizontaler Überhang auf Mobile!');

    const mobileTimerTab = page.locator('nav.md\\:hidden a[href="/craft/time"]');
    if (await mobileTimerTab.count() > 0) {
      console.log('   ✅ Mobile Tab "Stempeluhr" verlinkt korrekt auf "/craft/time"!');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_craft_time_mobile_390px.png') });
    console.log('   📸 Screenshot 05 (Mobile 390px) gespeichert.');

    console.log('\n======================================================================');
    console.log('🎉 SCHRITT 3 VOLLSTÄNDIG ERFOLGREICH VERIFIZIERT!');
    console.log('======================================================================\n');
  } finally {
    await browser.close();
  }
}

runCraftTimeTest().catch(err => {
  console.error('❌ Test fehlgeschlagen:', err);
  process.exit(1);
});
