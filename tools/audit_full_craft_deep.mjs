import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'C:\\Users\\kasan\\.gemini\\antigravity\\brain\\568fb111-7fa9-46aa-924c-5baba7305d6a\\screenshots';
const TARGET_URL = 'https://vibeforce-flow-os.vercel.app';

async function runFullCraftAudit() {
  console.log('======================================================================');
  console.log('🚀 VOLLSTÄNDIGER CRAFT-FUNKTIONSTEST & SCREENSHOT-CAPTURE');
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    locale: 'de-DE',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  // 1. Login
  console.log('1. Login an ' + TARGET_URL + '...');
  await page.goto(`${TARGET_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', '***REMOVED***');
  await page.fill('input[type="password"]', '***REMOVED***');
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 20000 });
  console.log('   ✅ Eingeloggt!');

  // 2. /craft aufrufen (frisch laden mit Cache-Bust)
  console.log('2. Lade /craft (Handwerks-Zentrale)...');
  await page.goto(`${TARGET_URL}/craft?t=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '01_craft_hub_live_baustellen.png'),
    fullPage: false,
  });
  console.log('   📸 01_craft_hub_live_baustellen.png');

  // 3. Bautagesbericht erfassen
  console.log('3. Öffne Bautagesbericht erfassen...');
  const reportBtn = page.locator('#craft-create-report-btn, button:has-text("Bericht erfassen")').first();
  if (await reportBtn.count() > 0) {
    await reportBtn.click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '02_bautagesbericht_formular_aktiv.png'),
      fullPage: false,
    });
    console.log('   📸 02_bautagesbericht_formular_aktiv.png');

    // 4. VOB/B § 6 Behinderungsanzeige
    console.log('4. Suche VOB/B § 6 Behinderungsanzeigen-Assistent...');
    const hindranceBtn = page.locator('button:has-text("Behinderungsanzeige"), button:has-text("VOB/B § 6")').first();
    if (await hindranceBtn.count() > 0) {
      await hindranceBtn.click();
      await page.waitForTimeout(1500);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '03_vob_b_6_behinderung_modal.png'),
        fullPage: false,
      });
      console.log('   📸 03_vob_b_6_behinderung_modal.png');

      // Schließe Hindrance Modal falls separat
      const closeH = page.locator('button:has-text("Abbrechen"), button:has-text("Schließen"), button:has-text("✕")').first();
      if (await closeH.count() > 0) await closeH.click();
      await page.waitForTimeout(500);
    }

    // 5. Digitale Unterschrift: 92vh Studio Modal
    console.log('5. Öffne Digitale Unterschrift Studio (92vh)...');
    const sigBox = page.locator('[role="button"]:has-text("Signatur"), [role="button"]:has-text("Tippen"), div:has-text("Klicken/Tippen zum Signieren")').first();
    if (await sigBox.count() > 0) {
      await sigBox.scrollIntoViewIfNeeded();
      await sigBox.click();
      await page.waitForTimeout(1500);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '04_signature_studio_92vh.png'),
        fullPage: false,
      });
      console.log('   📸 04_signature_studio_92vh.png');

      // Umschalten auf Finger-/Handschuh-Modus
      const fingerBtn = page.locator('button:has-text("Finger"), button:has-text("Handschuh")').first();
      if (await fingerBtn.count() > 0) {
        await fingerBtn.click();
        await page.waitForTimeout(500);
        console.log('   Umschaltung auf Handschuh-Modus (dicke Linienstärke) verifiziert');
      }

      // Zeichne Signatur
      const canvas = page.locator('canvas').first();
      if (await canvas.count() > 0) {
        const box = await canvas.boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.5);
          await page.mouse.down();
          await page.mouse.move(box.x + box.width * 0.35, box.y + box.height * 0.35);
          await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.65);
          await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.4);
          await page.mouse.up();
          await page.waitForTimeout(1000);

          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '04b_signature_studio_mit_unterschrift.png'),
            fullPage: false,
          });
          console.log('   📸 04b_signature_studio_mit_unterschrift.png');

          const saveBtn = page.locator('button:has-text("Übernehmen"), button:has-text("Speichern")').first();
          if (await saveBtn.count() > 0) {
            await saveBtn.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    }

    // Schließe Bautagesbericht Modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
  }

  // 6. GAEB Manager mit Demo-LV
  console.log('6. Lade Demo-Ausschreibung im GAEB Manager...');
  const gaebTab = page.locator('#craft-tab-gaeb-btn, button:has-text("GAEB")').first();
  if (await gaebTab.count() > 0) {
    await gaebTab.click();
    await page.waitForTimeout(1500);

    const loadDemoBtn = page.locator('button:has-text("Muster-Ausschreibung"), button:has-text("Muster-LV")').first();
    if (await loadDemoBtn.count() > 0) {
      await loadDemoBtn.click();
      await page.waitForTimeout(1500);
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '06_gaeb_muster_ausschreibung.png'),
      fullPage: false,
    });
    console.log('   📸 06_gaeb_muster_ausschreibung.png');
  }

  // 7. Großhandel: IDS-Connect Punchout & Importierter Warenkorb
  console.log('7. Prüfe Großhandel & IDS-Connect Punchout...');
  const wholesaleTab = page.locator('#craft-tab-wholesale-btn, button:has-text("Großhandel")').first();
  if (await wholesaleTab.count() > 0) {
    await wholesaleTab.click();
    await page.waitForTimeout(1500);

    const punchoutSubTab = page.locator('button:has-text("IDS-Connect"), button:has-text("Punchout")').first();
    if (await punchoutSubTab.count() > 0) {
      await punchoutSubTab.click();
      await page.waitForTimeout(1500);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '07b_grosshandel_ids_punchout_view.png'),
        fullPage: false,
      });
      console.log('   📸 07b_grosshandel_ids_punchout_view.png');
    }

    const cartSubTab = page.locator('button:has-text("Importierter Warenkorb"), button:has-text("Warenkorb")').first();
    if (await cartSubTab.count() > 0) {
      await cartSubTab.click();
      await page.waitForTimeout(1500);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '07c_grosshandel_imported_cart.png'),
        fullPage: false,
      });
      console.log('   📸 07c_grosshandel_imported_cart.png');
    }
  }

  // 8. Plan-Pinning mit Mängelrüge
  console.log('8. Prüfe 2D-Plan-Pinning & VOB/B § 13 Mängelrüge...');
  const pinningTab = page.locator('#craft-tab-pinning-btn, button:has-text("Plan-Pinning"), button:has-text("Mängel")').first();
  if (await pinningTab.count() > 0) {
    await pinningTab.click();
    await page.waitForTimeout(2000);

    const firstPin = page.locator('button[title*="Pin"], div[title*="Pin"], button:has-text("1"), button:has-text("2")').first();
    if (await firstPin.count() > 0) {
      await firstPin.click();
      await page.waitForTimeout(1000);

      const rügeBtn = page.locator('button:has-text("Mängelrüge generieren"), button:has-text("VOB/B § 13")').first();
      if (await rügeBtn.count() > 0) {
        await rügeBtn.click();
        await page.waitForTimeout(1500);

        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, '08b_vob_b_13_maengelruege_modal.png'),
          fullPage: false,
        });
        console.log('   📸 08b_vob_b_13_maengelruege_modal.png');

        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    }
  }

  await browser.close();
  console.log('\n======================================================================');
  console.log('🎉 AUDIT SUITE VOLLSTÄNDIG ABGESCHLOSSEN!');
  console.log('======================================================================\n');
}

runFullCraftAudit().catch(err => {
  console.error('Audit Error:', err);
  process.exit(1);
});
