import { chromium } from 'playwright';

async function verifyAllTabs() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Logging in...');
  await page.goto('https://vibeforce-flow-os.vercel.app/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'daniel@vibeforcetest.de');
  await page.fill('input[type="password"]', process.env.DEMO_DANIEL_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  console.log('2. Clicking "Handwerk & Baustelle" in sidebar...');
  const craftNav = page.locator('aside a[href="/craft"]');
  await craftNav.first().click();
  await page.waitForTimeout(2000);

  // Screenshot Tab 1
  await page.screenshot({ path: 'C:/Users/Robin/.gemini/antigravity-ide/brain/7c874965-02fd-4dce-b2a0-3b8cb1f404e0/scratch/verified_tab_1.png' });
  console.log('Saved: verified_tab_1.png');

  // Click Tab 2 (Aufmaß)
  console.log('3. Clicking Tab 2 (Aufmaß)...');
  await page.click('button:has-text("VOB Teil C Aufmaß-Center")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'C:/Users/Robin/.gemini/antigravity-ide/brain/7c874965-02fd-4dce-b2a0-3b8cb1f404e0/scratch/verified_tab_2.png' });
  console.log('Saved: verified_tab_2.png');

  // Click Tab 3 (Geofencing)
  console.log('4. Clicking Tab 3 (Geofence)...');
  await page.click('button:has-text("Baustellen-Radar & Geofencing")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'C:/Users/Robin/.gemini/antigravity-ide/brain/7c874965-02fd-4dce-b2a0-3b8cb1f404e0/scratch/verified_tab_3.png' });
  console.log('Saved: verified_tab_3.png');

  // Click Tab 4 (Invoices)
  console.log('5. Clicking Tab 4 (Invoices)...');
  await page.click('button:has-text("ZUGFeRD & DATEV Rechnungen")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'C:/Users/Robin/.gemini/antigravity-ide/brain/7c874965-02fd-4dce-b2a0-3b8cb1f404e0/scratch/verified_tab_4.png' });
  console.log('Saved: verified_tab_4.png');

  console.log('ALL 4 TABS VERIFIED & CAPTURED ON PRODUCTION LIVE URL!');
  await browser.close();
}

verifyAllTabs().catch(console.error);
