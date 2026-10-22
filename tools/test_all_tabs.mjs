import { chromium } from 'playwright';

async function testTabs() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Login...');
  await page.goto('https://vibeforce-flow-os.vercel.app/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', 'daniel@vibeforcetest.de');
  await page.fill('input[type="password"]', process.env.DEMO_DANIEL_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  console.log('2. Navigating to /craft...');
  await page.goto('https://vibeforce-flow-os.vercel.app/craft', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  // Tab 1: Default
  await page.screenshot({ path: 'C:/Users/kasan/.gemini/antigravity-ide/brain/7c874965-02fd-4dce-b2a0-3b8cb1f404e0/scratch/live_tab_1_reports.png' });
  console.log('Saved: scratch/live_tab_1_reports.png');

  // Click Aufmaß-Center tab
  console.log('3. Clicking Aufmaß-Center tab...');
  await page.click('button:has-text("VOB Teil C Aufmaß-Center")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'C:/Users/kasan/.gemini/antigravity-ide/brain/7c874965-02fd-4dce-b2a0-3b8cb1f404e0/scratch/live_tab_2_aufmass.png' });
  console.log('Saved: scratch/live_tab_2_aufmass.png');

  // Click Geofencing tab
  console.log('4. Clicking Geofence tab...');
  await page.click('button:has-text("Baustellen-Radar & Geofencing")');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'C:/Users/kasan/.gemini/antigravity-ide/brain/7c874965-02fd-4dce-b2a0-3b8cb1f404e0/scratch/live_tab_3_geofence.png' });
  console.log('Saved: scratch/live_tab_3_geofence.png');

  // Click Invoices tab
  console.log('5. Clicking Invoices tab...');
  await page.click('button:has-text("ZUGFeRD & DATEV Rechnungen")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'C:/Users/kasan/.gemini/antigravity-ide/brain/7c874965-02fd-4dce-b2a0-3b8cb1f404e0/scratch/live_tab_4_invoices.png' });
  console.log('Saved: scratch/live_tab_4_invoices.png');

  console.log('ALL TABS TESTED SUCCESSFULLY!');
  await browser.close();
}

testTabs().catch(console.error);
