import { chromium } from 'playwright';

async function testToggle() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Navigating to login...');
  await page.goto('https://vibeforce-flow-os.vercel.app/login', { waitUntil: 'domcontentloaded' });
  await page.fill('#email', '***REMOVED***');
  await page.fill('#password', process.env.PB_ADMIN_PASSWORD);
  await page.click('button[type="submit"]');

  await page.waitForTimeout(3000);
  console.log('Current URL:', page.url());

  console.log('2. Navigating to /profile...');
  await page.goto('https://vibeforce-flow-os.vercel.app/profile', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Scroll down to preferences
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);

  // Check if craft toggle exists
  const toggle = page.locator('#craft-module-toggle');
  const count = await toggle.count();
  console.log('Craft toggle count:', count);

  if (count > 0) {
    const isChecked = await toggle.getAttribute('data-state');
    console.log('Initial craft toggle state:', isChecked);
    if (isChecked !== 'checked') {
      console.log('Clicking craft toggle...');
      await toggle.click();
      await page.waitForTimeout(500);
    }

    // Click save button
    const saveBtn = page.locator('button:has-text("Präferenzen speichern")');
    if (await saveBtn.count() > 0) {
      console.log('Clicking save preferences...');
      await saveBtn.click();
      await page.waitForTimeout(2000);
    }
  }

  // Take screenshot of profile with toggle
  await page.screenshot({ path: 'C:/Users/Robin/.gemini/antigravity-ide/brain/7c874965-02fd-4dce-b2a0-3b8cb1f404e0/scratch/m007_activated_profile.png' });
  console.log('Saved m007_activated_profile.png');

  // Go to /projects
  console.log('3. Navigating to /projects...');
  await page.goto('https://vibeforce-flow-os.vercel.app/projects', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const sidebarText = await page.innerText('aside');
  console.log('Sidebar contains Handwerk & Baustelle:', sidebarText.includes('Handwerk & Baustelle') || sidebarText.includes('Craft'));

  await page.screenshot({ path: 'C:/Users/Robin/.gemini/antigravity-ide/brain/7c874965-02fd-4dce-b2a0-3b8cb1f404e0/scratch/sidebar_with_craft.png' });
  console.log('Saved sidebar_with_craft.png');

  await browser.close();
}

testToggle().catch(console.error);
