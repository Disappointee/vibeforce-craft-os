import { chromium } from 'playwright';

async function run() {
  console.log('=== VERIFYING SERVER ENTITLEMENTS LIVE ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  console.log('1. Logging in as Daniel (Admin)...');
  await page.goto('https://vibeforce-flow-os.vercel.app/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', 'daniel@vibeforcetest.de');
  await page.fill('input[type="password"]', '***REMOVED***');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);

  console.log('2. Testing /admin/settings Craft Lizenzen Tab...');
  await page.goto('https://vibeforce-flow-os.vercel.app/admin/settings', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const craftTab = page.locator('button:has-text("Craft Lizenzen")');
  await craftTab.click();
  await page.waitForTimeout(1500);

  // Click "In PocketBase sichern" button
  const saveBtn = page.locator('button:has-text("In PocketBase sichern")').first();
  if (await saveBtn.count() > 0) {
    console.log('Clicking "In PocketBase sichern"...');
    await saveBtn.click();
    await page.waitForTimeout(2000);
  }

  const screenshotPath = 'C:\\Users\\kasan\\.gemini\\antigravity\\brain\\9d4131b7-dd18-4294-9dc0-ab4a9932ffe9\\live_audit_pb_saved_toast.png';
  await page.screenshot({ path: screenshotPath });
  console.log('Screenshot saved to', screenshotPath);

  await browser.close();
  console.log('Console errors count:', consoleErrors.length);
}

run().catch(console.error);
