import { chromium } from 'playwright';

async function activateDaniel() {
  // First get cookie
  const res = await fetch('https://vibeforce-flow-os.vercel.app/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'daniel@vibeforcetest.de', password: process.env.DEMO_DANIEL_PASSWORD })
  });
  const cookieHeader = res.headers.get('set-cookie');
  console.log('Got cookie from login API');

  const cookieVal = cookieHeader.split(';')[0].replace('pb_auth=', '');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  
  await context.addCookies([{
    name: 'pb_auth',
    value: cookieVal,
    domain: 'vibeforce-flow-os.vercel.app',
    path: '/',
    httpOnly: false,
    secure: true,
    sameSite: 'Lax'
  }]);

  const page = await context.newPage();

  console.log('Navigating directly to https://vibeforce-flow-os.vercel.app/profile...');
  await page.goto('https://vibeforce-flow-os.vercel.app/profile', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('Current page title:', await page.title(), 'URL:', page.url());

  // Scroll to bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);

  // Check toggle
  const toggle = page.locator('#craft-module-toggle');
  console.log('Toggle count:', await toggle.count());

  if (await toggle.count() > 0) {
    const isChecked = await toggle.getAttribute('data-state');
    console.log('Craft toggle state before click:', isChecked);
    if (isChecked !== 'checked') {
      await toggle.click();
      await page.waitForTimeout(500);
      console.log('Craft toggle state after click:', await toggle.getAttribute('data-state'));
    }

    const saveBtn = page.locator('button:has-text("Präferenzen speichern")');
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
      console.log('Saved preferences!');
    }
  }

  await page.screenshot({ path: 'C:/Users/kasan/.gemini/antigravity-ide/brain/7c874965-02fd-4dce-b2a0-3b8cb1f404e0/scratch/profile_toggled.png' });

  // Now go to /projects
  console.log('Navigating to /projects...');
  await page.goto('https://vibeforce-flow-os.vercel.app/projects', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const sidebarText = await page.innerText('aside');
  console.log('SIDEBAR CONTAINS HANDWERK & BAUSTELLE:', sidebarText.includes('Handwerk & Baustelle') || sidebarText.includes('Craft'));

  await page.screenshot({ path: 'C:/Users/kasan/.gemini/antigravity-ide/brain/7c874965-02fd-4dce-b2a0-3b8cb1f404e0/scratch/live_sidebar_verified.png' });
  console.log('Saved live_sidebar_verified.png');

  await browser.close();
}

activateDaniel().catch(console.error);
