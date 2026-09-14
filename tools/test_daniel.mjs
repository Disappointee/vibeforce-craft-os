import { chromium } from 'playwright';

async function testDaniel() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Logging in with Daniel credentials...');
  await page.goto('https://vibeforce-flow-os.vercel.app/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'daniel@vibeforcetest.de');
  await page.fill('input[type="password"]', '***REMOVED***');
  await page.click('button[type="submit"]');

  await page.waitForTimeout(4000);
  console.log('Current URL after submit:', page.url());

  console.log('2. Navigating to /profile...');
  await page.goto('https://vibeforce-flow-os.vercel.app/profile', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  console.log('Profile URL:', page.url());

  // Check toggle
  const toggle = page.locator('#craft-module-toggle');
  const count = await toggle.count();
  console.log('Craft toggle found on /profile:', count);

  if (count > 0) {
    const isChecked = await toggle.getAttribute('data-state');
    console.log('Current craft toggle state:', isChecked);
    if (isChecked !== 'checked') {
      console.log('Activating craft toggle...');
      await toggle.click();
      await page.waitForTimeout(500);
    }
    const saveBtn = page.locator('button:has-text("Präferenzen speichern")');
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
    }
  }

  await page.screenshot({ path: 'C:/Users/kasan/.gemini/antigravity-ide/brain/7c874965-02fd-4dce-b2a0-3b8cb1f404e0/scratch/daniel_profile.png' });
  console.log('Screenshot saved: scratch/daniel_profile.png');

  // Navigate to projects
  console.log('3. Navigating to /projects...');
  await page.goto('https://vibeforce-flow-os.vercel.app/projects', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const sidebarText = await page.innerText('aside');
  console.log('Sidebar has Handwerk & Baustelle:', sidebarText.includes('Handwerk & Baustelle') || sidebarText.includes('Craft'));

  await page.screenshot({ path: 'C:/Users/kasan/.gemini/antigravity-ide/brain/7c874965-02fd-4dce-b2a0-3b8cb1f404e0/scratch/daniel_projects.png' });
  console.log('Screenshot saved: scratch/daniel_projects.png');

  await browser.close();
}

testDaniel().catch(console.error);
