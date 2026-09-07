import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('screenshots/craft_audit');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function runAudit() {
  console.log('🚀 Starting Playwright Visual Audit for Vibeforce Craft...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });
  const page = await context.newPage();

  // Helper for screenshot
  const snap = async (name, delay = 1000) => {
    if (delay) await page.waitForTimeout(delay);
    const filePath = path.join(OUT_DIR, name);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`📸 Captured: ${name}`);
  };

  try {
    // 1. Login
    console.log('Logging in...');
    await page.goto('https://vibeforce-flow-os.vercel.app/login', { waitUntil: 'load' });
    await page.fill('#email', '***REMOVED***');
    await page.fill('#password', '***REMOVED***');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3500);

    // 2. /craft Hub Overview
    console.log('Navigating to /craft...');
    await page.goto('https://vibeforce-flow-os.vercel.app/craft', { waitUntil: 'load' });
    await snap('01_craft_hub_overview.png', 3000);

    // 3. Open Report Modal
    console.log('Opening QuickCreateReportModal...');
    const reportBtn = page.locator('#craft-create-report-btn');
    if (await reportBtn.count() > 0) {
      await reportBtn.first().click();
      await snap('02_craft_modal_report_empty.png', 1200);
      
      // Click "Erste Baustelle anlegen" inside report modal
      const createSiteBtn = page.locator('button:has-text("Erste Baustelle anlegen")');
      if (await createSiteBtn.count() > 0) {
        await createSiteBtn.click();
        await snap('03_craft_modal_new_baustelle_from_report.png', 1200);
        
        // Close modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(600);
      }
      await page.keyboard.press('Escape');
      await page.waitForTimeout(600);
    }

    // 4. Click header "+ Baustelle anlegen" button directly
    console.log('Opening NewBaustelleDialog from header...');
    const headerBaustelleBtn = page.locator('#craft-create-baustelle-btn');
    if (await headerBaustelleBtn.count() > 0) {
      await headerBaustelleBtn.click();
      await snap('04_craft_modal_new_baustelle_direct.png', 1200);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(600);
    }

    // 5. Aufmaß Tab
    console.log('Switching to Aufmaß Tab...');
    const aufmassTab = page.locator('button:has-text("VOB-Aufmaß & Aufmaßblatt"), button:has-text("Aufmaß")');
    if (await aufmassTab.count() > 0) {
      await aufmassTab.first().click();
      await snap('05_craft_tab_aufmass.png', 1500);
    }

    // 6. Geofence Tab
    console.log('Switching to Geofence Tab...');
    const geofenceTab = page.locator('button:has-text("Live-Baustellentracking"), button:has-text("Geofencing")');
    if (await geofenceTab.count() > 0) {
      await geofenceTab.first().click();
      await snap('06_craft_tab_geofence.png', 1500);
    }

    // 7. DATEV Tab
    console.log('Switching to DATEV Tab...');
    const datevTab = page.locator('button:has-text("DATEV / § 13b Export"), button:has-text("DATEV")');
    if (await datevTab.count() > 0) {
      await datevTab.first().click();
      await snap('07_craft_tab_datev.png', 1500);
    }

    // 8. Nachkalkulation Tab
    console.log('Switching to Nachkalkulation Tab...');
    const kalkTab = page.locator('button:has-text("Nachkalkulation & Marge"), button:has-text("Nachkalkulation")');
    if (await kalkTab.count() > 0) {
      await kalkTab.first().click();
      await snap('08_craft_tab_nachkalkulation.png', 1500);
    }

    // 9. Projects Page
    console.log('Navigating to /projects...');
    await page.goto('https://vibeforce-flow-os.vercel.app/projects', { waitUntil: 'load' });
    await snap('09_projects_page.png', 3000);

    // 10. Clients Page
    console.log('Navigating to /clients...');
    await page.goto('https://vibeforce-flow-os.vercel.app/clients', { waitUntil: 'load' });
    await snap('10_clients_page.png', 3000);

  } catch (err) {
    console.error('❌ Audit encountered error:', err);
  } finally {
    await browser.close();
    console.log('🏁 Audit script completed. Screenshots saved in screenshots/craft_audit/');
  }
}

runAudit();
