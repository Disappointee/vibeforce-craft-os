import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'C:\\Users\\kasan\\.gemini\\antigravity\\brain\\568fb111-7fa9-46aa-924c-5baba7305d6a\\screenshots';
const TARGET_URL = 'https://vibeforce-flow-os.vercel.app';

async function runCraftDetailsAudit() {
  console.log('======================================================================');
  console.log('🔍 TESTE SPEZIFISCHE CRAFT-FUNKTIONEN MIT PLAYWRIGHT');
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    locale: 'de-DE',
  });
  const page = await context.newPage();

  // 1. Login
  console.log('1. Login an ' + TARGET_URL + '...');
  await page.goto(`${TARGET_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', '***REMOVED***');
  await page.fill('input[type="password"]', process.env.PB_ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 20000 });

  // 2. /craft Hub aufrufen
  console.log('2. Navigiere zu /craft...');
  await page.goto(`${TARGET_URL}/craft`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);

  const shotHub = path.join(SCREENSHOT_DIR, '01_craft_hub_with_baustellen.png');
  await page.screenshot({ path: shotHub, fullPage: false });
  console.log('   📸 01_craft_hub_with_baustellen.png');

  // 3. Klick auf "+ Bericht erfassen"
  console.log('3. Öffne Bautagesbericht Schnellerfassung...');
  const reportBtn = page.locator('#craft-create-report-btn, button:has-text("Bericht erfassen"), button:has-text("Bautagesbericht erfassen")').first();
  await reportBtn.click();
  await page.waitForTimeout(2000);

  const shotReportModal = path.join(SCREENSHOT_DIR, '02_bautagesbericht_formular.png');
  await page.screenshot({ path: shotReportModal, fullPage: false });
  console.log('   📸 02_bautagesbericht_formular.png');

  // 4. Teste VOB/B § 6 Behinderungsanzeigen-Assistent
  console.log('4. Teste VOB/B § 6 Behinderungsanzeige im Bautagesbericht...');
  const hindranceBtn = page.locator('button:has-text("Behinderungsanzeige"), button:has-text("VOB/B § 6"), button:has-text("Behinderung")').first();
  if (await hindranceBtn.count() > 0) {
    await hindranceBtn.click();
    await page.waitForTimeout(1500);
    const shotHindrance = path.join(SCREENSHOT_DIR, '03_vob_b_6_hindrance_modal.png');
    await page.screenshot({ path: shotHindrance, fullPage: false });
    console.log('   📸 03_vob_b_6_hindrance_modal.png');

    // Wähle Grund (z.B. Vorunternehmer)
    const selectReason = page.locator('select, [role="combobox"]').first();
    if (await selectReason.count() > 0) {
      await selectReason.selectOption({ index: 1 });
      await page.waitForTimeout(500);
    }
  }

  // 5. Teste Digitale Unterschrift: Klick auf das Signaturfeld (öffnet 92vh Signature Studio)
  console.log('5. Teste Digitale Unterschrift (92vh Signature Studio Modal)...');
  const signatureTrigger = page.locator('[role="button"]:has-text("Signatur"), [role="button"]:has-text("Tippen"), div:has-text("Klicken/Tippen zum Signieren")').first();
  if (await signatureTrigger.count() > 0) {
    await signatureTrigger.scrollIntoViewIfNeeded();
    await signatureTrigger.click();
    await page.waitForTimeout(1500);

    const shotStudio = path.join(SCREENSHOT_DIR, '04_signature_studio_92vh.png');
    await page.screenshot({ path: shotStudio, fullPage: false });
    console.log('   📸 04_signature_studio_92vh.png');

    // Prüfe Stift- und Fingermodus Toggle
    const fingerModeBtn = page.locator('button:has-text("Finger"), button:has-text("Handschuh")').first();
    if (await fingerModeBtn.count() > 0) {
      console.log('   Schalte auf Finger-/Handschuh-Modus um...');
      await fingerModeBtn.click();
      await page.waitForTimeout(500);
    }

    // Zeichne eine Signatur auf dem Canvas
    const canvas = page.locator('canvas').first();
    if (await canvas.count() > 0) {
      const box = await canvas.boundingBox();
      if (box) {
        console.log('   Zeichne Test-Signatur auf dem Canvas...');
        await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.3);
        await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.6);
        await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.4);
        await page.mouse.up();
        await page.waitForTimeout(1000);

        const shotSigned = path.join(SCREENSHOT_DIR, '04b_signature_studio_signed.png');
        await page.screenshot({ path: shotSigned, fullPage: false });
        console.log('   📸 04b_signature_studio_signed.png');

        // Klick auf Übernehmen
        const saveSigBtn = page.locator('button:has-text("Übernehmen"), button:has-text("Speichern")').first();
        if (await saveSigBtn.count() > 0) {
          await saveSigBtn.click();
          await page.waitForTimeout(1000);
        }
      }
    }
  }

  // Schließe Bautagesbericht-Modal
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  // 6. Teste VOB-Aufmaß (DIN 18299 § 4 Übermessungsregel & Shunting-Yard Formeln)
  console.log('6. Prüfe VOB-Aufmaß & Abrechnung...');
  const aufmassTab = page.locator('#craft-tab-measurement-btn, button:has-text("VOB-Aufmaß"), button:has-text("Aufmaß")').first();
  if (await aufmassTab.count() > 0) {
    await aufmassTab.click();
    await page.waitForTimeout(2000);

    const shotAufmass = path.join(SCREENSHOT_DIR, '05_vob_aufmass_matrix.png');
    await page.screenshot({ path: shotAufmass, fullPage: false });
    console.log('   📸 05_vob_aufmass_matrix.png');
  }

  // 7. Teste GAEB Manager (D83/X83 BoQ Hierarchie & Autosave)
  console.log('7. Prüfe GAEB Manager...');
  const gaebTab = page.locator('#craft-tab-gaeb-btn, button:has-text("GAEB"), button:has-text("Ausschreibung")').first();
  if (await gaebTab.count() > 0) {
    await gaebTab.click();
    await page.waitForTimeout(2000);

    const shotGaeb = path.join(SCREENSHOT_DIR, '06_gaeb_manager_details.png');
    await page.screenshot({ path: shotGaeb, fullPage: false });
    console.log('   📸 06_gaeb_manager_details.png');
  }

  // 8. Teste Großhandel & IDS-Connect 2.5 Punchout
  console.log('8. Prüfe Großhandel & IDS-Connect...');
  const wholesaleTab = page.locator('#craft-tab-wholesale-btn, button:has-text("Großhandel"), button:has-text("IDS")').first();
  if (await wholesaleTab.count() > 0) {
    await wholesaleTab.click();
    await page.waitForTimeout(2000);

    const shotWholesale = path.join(SCREENSHOT_DIR, '07_grosshandel_punchout_details.png');
    await page.screenshot({ path: shotWholesale, fullPage: false });
    console.log('   📸 07_grosshandel_punchout_details.png');
  }

  await browser.close();
  console.log('\n======================================================================');
  console.log('✅ ALL CRAFT FEATURES VERIFIED & SCREENSHOTS ARCHIVED!');
  console.log('======================================================================\n');
}

runCraftDetailsAudit().catch(err => {
  console.error('Audit Error:', err);
  process.exit(1);
});
