import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('screenshots/craft_audit_after');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function runAudit() {
  console.log('🚀 Starting Playwright Visual Audit on Localhost:3000...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });
  const page = await context.newPage();

  const snap = async (name, delay = 1000) => {
    if (delay) await page.waitForTimeout(delay);
    const filePath = path.join(OUT_DIR, name);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`📸 Captured: ${name}`);
  };

  try {
    // 1. Login
    console.log('Logging in...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'load' });
    await page.fill('#email', '***REMOVED***');
    await page.fill('#password', process.env.PB_ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // 2. /craft Hub Overview
    console.log('Navigating to /craft...');
    await page.goto('http://localhost:3000/craft', { waitUntil: 'load' });
    await snap('01_craft_hub_overview_after.png', 2500);

    // 3. Open Report Modal
    console.log('Opening QuickCreateReportModal...');
    const reportBtn = page.locator('#craft-create-report-btn');
    if (await reportBtn.count() > 0) {
      await reportBtn.first().click();
      await snap('02_craft_modal_report_empty_after.png', 1000);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // 4. Click header "+ Baustelle anlegen" button directly
    console.log('Opening NewBaustelleDialog from header...');
    const headerBaustelleBtn = page.locator('#craft-create-baustelle-btn');
    if (await headerBaustelleBtn.count() > 0) {
      await headerBaustelleBtn.click();
      await snap('03_craft_modal_new_baustelle_after.png', 1200);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // 5. Aufmaß Tab
    console.log('Switching to Aufmaß Tab...');
    const aufmassTab = page.locator('button:has-text("VOB-Aufmaß & Aufmaßblatt"), button:has-text("VOB-Aufmaß")');
    if (await aufmassTab.count() > 0) {
      await aufmassTab.first().click();
      await snap('04_craft_tab_aufmass_after.png', 1500);
    }

    // 6. Nachkalkulation Tab
    console.log('Switching to Nachkalkulation Tab...');
    const kalkTab = page.locator('#craft-tab-margin-btn');
    if (await kalkTab.count() > 0) {
      await kalkTab.first().click();
      await snap('05_craft_tab_nachkalkulation_after.png', 1500);
    }

    // 7. Projects Page
    console.log('Navigating to /projects...');
    await page.goto('http://localhost:3000/projects', { waitUntil: 'load' });
    await snap('06_projects_page_after.png', 2500);

    // 8. Clients Page
    console.log('Navigating to /clients...');
    await page.goto('http://localhost:3000/clients', { waitUntil: 'load' });
    await snap('07_clients_page_after.png', 2500);

  } catch (err) {
    console.error('❌ Audit encountered error:', err);
  } finally {
    await browser.close();
    console.log('🏁 Local visual audit completed.');
  }
}

runAudit();
