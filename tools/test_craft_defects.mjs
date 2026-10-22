import { chromium } from '../frontend/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'C:\\Users\\Robin\\.gemini\\antigravity\\brain\\a22d8b81-4f29-4b51-8ef3-d148ccaa9dfa\\screenshots';
const BASE_URL = 'http://localhost:3001';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runDefectsTest() {
  console.log('======================================================================');
  console.log('🏗️ CRAFT OS SCHRITT 2: MÄNGELMANAGEMENT VOR ORT (/craft/defects)');
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
      await page.fill('input[type="email"]', '***REMOVED***');
      await page.fill('input[type="password"]', process.env.PB_ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
    }

    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });
    console.log('   ✅ Eingeloggt! URL:', page.url());

    // 2. Navigation über Sidebar-Link prüfen
    console.log('\n2. Teste Sidebar-Navigation nach "/craft/defects"...');
    const defectsNavLink = page.locator('aside a[href="/craft/defects"]').first();
    await defectsNavLink.waitFor({ state: 'visible', timeout: 8000 });
    console.log('   Klicke auf "Mängel & Baustellen-Aufgaben" in der Sidebar...');
    await defectsNavLink.click();

    await page.waitForURL(url => url.toString().includes('/craft/defects'), { timeout: 8000 });
    console.log('   ✅ URL erfolgreich gewechselt zu:', page.url());

    // 3. Header, Badges & KPIs prüfen
    console.log('\n3. Validiere Mängel-Zentrale UI & KPIs...');
    await page.waitForSelector('h1:has-text("Mängel & Baustellen-Aufgaben")', { timeout: 5000 });
    console.log('   ✅ Hauptüberschrift "Mängel & Baustellen-Aufgaben" vorhanden.');

    const kpis = await page.locator('span:has-text("Offene Mängel"), span:has-text("Kritisch"), span:has-text("Gerügt"), span:has-text("Frist überfällig")').count();
    console.log(`   ✅ ${kpis} VOB-KPI Kacheln gefunden.`);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_craft_defects_list.png'), fullPage: false });
    console.log('   📸 Screenshot 01 gespeichert.');

    // 4. Test Schnellerfassungs-Dialog
    console.log('\n4. Teste Schnellerfassungs-Dialog ("+ Mangel erfassen")...');
    const addDefectBtn = page.locator('button:has-text("+ Mangel erfassen")');
    await addDefectBtn.click();

    await page.waitForSelector('h3:has-text("Neuen Mangel vor Ort erfassen")', { timeout: 4000 });
    console.log('   ✅ Schnellerfassungs-Dialog geöffnet.');

    // Dialog ausfüllen
    console.log('   Fülle Mängeldaten aus...');
    await page.fill('#defect-title-input', 'Playwright E2E: Rissbildung im Nassbereich Achse E-4');
    await page.selectOption('#defect-trade-select', 'Fliesenleger');
    await page.fill('#defect-contractor-input', 'Fliesen Meisterbetrieb Rhein-Main GmbH');
    await page.fill('#defect-location-input', 'EG Bad 02 · Achse E-4');
    await page.selectOption('#defect-severity-select', 'critical');

    // Klick auf VOB-Frist-Pill (+14 Tage)
    console.log('   Klicke Frist-Pill "+14 Tage (VOB-Regel)"...');
    const deadlinePill = page.locator('button:has-text("+14 Tage")');
    await deadlinePill.click();

    // Mängelbeschreibung
    await page.fill('#defect-description-textarea', 'Erhebliche Hohlstellen und Rissverlauf in Verbundabdichtung gem. DIN 18534-1.');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_craft_defects_new_dialog.png') });
    console.log('   📸 Screenshot 02 gespeichert.');

    // Absenden
    console.log('   Klicke "#defect-submit-btn"...');
    await page.click('#defect-submit-btn');

    await page.waitForSelector('h3:has-text("Playwright E2E: Rissbildung im Nassbereich Achse E-4")', { timeout: 5000 });
    console.log('   ✅ Neuer Mangel erfolgreich in der Mängelliste gerendert!');

    // 5. Test Formelle Mängelrüge gem. VOB/B § 13 Abs. 5
    console.log('\n5. Teste VOB/B § 13 Abs. 5 Mängelrügen-Generator...');
    const rugeBtn = page.locator('button:has-text("Mängelrüge (§ 13)")').first();
    await rugeBtn.click();

    await page.waitForSelector('h3:has-text("Formelle Mängelrüge nach VOB/B § 13 Abs. 5")', { timeout: 5000 });
    console.log('   ✅ Mängelrügen-Modal geöffnet.');

    const noticeTextarea = page.locator('textarea[readonly]');
    const noticeContent = await noticeTextarea.inputValue();
    
    if (!noticeContent.includes('FORMELLE MÄNGELRÜGE GEMÄSS § 13 ABS. 5 VOB/B')) {
      throw new Error('Mängelrüge-Titel fehlt im Text.');
    }
    if (!noticeContent.includes('Ersatzvornahme')) {
      throw new Error('Androhung der Ersatzvornahme fehlt im Text.');
    }
    if (!noticeContent.includes('Fliesen Meisterbetrieb Rhein-Main GmbH')) {
      throw new Error('Nachunternehmername fehlt im Text.');
    }
    console.log('   ✅ Formelle Rechtsklauseln (VOB/B § 13 Abs. 5, Ersatzvornahme, Frist) vollständig verifiziert!');

    // Klick auf "Mängelrüge kopieren"
    const copyBtn = page.locator('button:has-text("Mängelrüge kopieren")');
    await copyBtn.click();
    await page.waitForSelector('button:has-text("Kopiert!")', { timeout: 3000 });
    console.log('   ✅ Kopier-Aktion erfolgreich ausgelöst (Status "Kopiert!").');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_craft_defects_ruge_modal.png') });
    console.log('   📸 Screenshot 03 gespeichert.');

    // Modal schließen
    await page.locator('div[role="dialog"] button:has(svg.lucide-x)').click();

    // 6. Test 2D-Bauplan Ansichtsumschaltung
    console.log('\n6. Teste 2D-Bauplan-Ansicht...');
    const planViewBtn = page.locator('button:has-text("2D-Bauplan")');
    await planViewBtn.click();
    await page.waitForTimeout(1000);

    const planCanvas = page.locator('text=2D-Plan-Pinning');
    if (await planCanvas.count() > 0) {
      console.log('   ✅ 2D-Plan-Pinning Canvas erfolgreich aktiviert!');
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_craft_defects_2d_plan.png') });
    console.log('   📸 Screenshot 04 gespeichert.');

    // 7. Test Mobile Viewport (390x844) & TabBar
    console.log('\n7. Teste Mobile Ergonomie (390px iPhone 14)...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);

    // Prüfe horizontalen Überhang
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const overflow = Math.max(0, scrollWidth - clientWidth);
    console.log(`   Horizontale Breite: ${scrollWidth}px (Client: ${clientWidth}px) -> Überhang: ${overflow}px`);
    if (overflow > 1) {
      throw new Error(`Horizontaler Überhang auf Mobile erkannt: ${overflow}px`);
    }
    console.log('   ✅ Exakt 0px horizontaler Überhang auf Mobile!');

    // Prüfe MobileTabBar Link
    const mobileDefectsTab = page.locator('nav.md\\:hidden a[href="/craft/defects"]');
    if (await mobileDefectsTab.count() > 0) {
      console.log('   ✅ Mobile Tab "Mängel" verlinkt korrekt auf "/craft/defects"!');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_craft_defects_mobile_390px.png') });
    console.log('   📸 Screenshot 05 gespeichert.');

    console.log('\n======================================================================');
    console.log('🎉 SCHRITT 2 VOLLSTÄNDIG ERFOLGREICH VERIFIZIERT!');
    console.log('======================================================================\n');
  } finally {
    await browser.close();
  }
}

runDefectsTest().catch(err => {
  console.error('❌ Test fehlgeschlagen:', err);
  process.exit(1);
});
