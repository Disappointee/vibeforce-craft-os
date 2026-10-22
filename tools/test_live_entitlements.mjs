import { chromium } from 'playwright';

async function run() {
  console.log('=== VERIFYING CRAFT ENTITLEMENTS LIVE ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  console.log('1. Logging in...');
  await page.goto('https://vibeforce-flow-os.vercel.app/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', 'daniel@vibeforcetest.de');
  await page.fill('input[type="password"]', process.env.DEMO_DANIEL_PASSWORD);
  await page.click('button[type="submit"]');

  await page.waitForTimeout(4000);

  console.log('2. Navigating to /craft...');
  await page.goto('https://vibeforce-flow-os.vercel.app/craft', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const screenshotDir = 'C:/Users/kasan/.gemini/antigravity/brain/9d4131b7-dd18-4294-9dc0-ab4a9932ffe9';

  // Check header license button
  const licenseBtn = page.locator('button:has-text("Module & Lizenzen")');
  console.log('Has "Module & Lizenzen" button?', (await licenseBtn.count()) > 0);

  // Take screenshot of Craft Hub with Module button
  await page.screenshot({ path: `${screenshotDir}/live_audit_craft_hub_with_license_badge.png` });
  console.log('Saved live_audit_craft_hub_with_license_badge.png');

  // Click "Module & Lizenzen" button to open modal
  await licenseBtn.first().click();
  await page.waitForTimeout(1000);

  // Screenshot modal
  await page.screenshot({ path: `${screenshotDir}/live_audit_craft_license_modal.png` });
  console.log('Saved live_audit_craft_license_modal.png');

  // Select "Craft Starter" tier in the modal to test locking
  console.log('Selecting Starter Tier in modal...');
  const starterTier = page.locator('div:has-text("Craft Starter")').first();
  if ((await starterTier.count()) > 0) {
    await starterTier.click();
    await page.waitForTimeout(500);
  }

  // Close modal with "Übernehmen & Schließen"
  const closeBtn = page.locator('button:has-text("Übernehmen & Schließen")');
  if ((await closeBtn.count()) > 0) {
    await closeBtn.click();
    await page.waitForTimeout(1000);
  }

  // Click Wholesale tab which should now be locked and show the Upsell showcase
  console.log('Clicking Wholesale Tab to verify Upsell Showcase...');
  const wholesaleTab = page.locator('#craft-tab-wholesale-btn');
  if ((await wholesaleTab.count()) > 0) {
    await wholesaleTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${screenshotDir}/live_audit_craft_upsell_showcase.png` });
    console.log('Saved live_audit_craft_upsell_showcase.png');
  }

  // Test 1-click unlock button inside upsell showcase
  console.log('Testing 1-click unlock in Upsell Showcase...');
  const unlockBtn = page.locator('button:has-text("Modul jetzt sofort aktivieren")');
  if ((await unlockBtn.count()) > 0) {
    await unlockBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${screenshotDir}/live_audit_craft_unlocked_wholesale.png` });
    console.log('Saved live_audit_craft_unlocked_wholesale.png');
  }

  await browser.close();
  console.log('Total console errors on live:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log('Console Errors:', consoleErrors);
  }
}

run().catch(console.error);
