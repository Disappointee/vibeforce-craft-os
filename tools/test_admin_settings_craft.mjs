import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('https://vibeforce-flow-os.vercel.app/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', 'daniel@vibeforcetest.de');
  await page.fill('input[type="password"]', '***REMOVED***');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);

  console.log('Navigating to /admin/settings...');
  await page.goto('https://vibeforce-flow-os.vercel.app/admin/settings', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const craftTab = page.locator('button:has-text("Craft Lizenzen")');
  if (await craftTab.count() > 0) {
    console.log('Clicking "Craft Lizenzen" tab...');
    await craftTab.click();
    await page.waitForTimeout(1500);
  }

  const screenshotPath = 'C:\\Users\\kasan\\.gemini\\antigravity\\brain\\9d4131b7-dd18-4294-9dc0-ab4a9932ffe9\\live_audit_admin_settings_craft.png';
  await page.screenshot({ path: screenshotPath });
  console.log('Saved admin settings screenshot to', screenshotPath);

  await browser.close();
}

run().catch(console.error);
