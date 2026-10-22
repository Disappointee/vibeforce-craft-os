import { chromium } from 'playwright';

async function verifyCraftLive() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Navigating to login...');
  await page.goto('https://vibeforce-flow-os.vercel.app/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'daniel@vibeforcetest.de');
  await page.fill('input[type="password"]', process.env.DEMO_DANIEL_PASSWORD);
  await page.click('button[type="submit"]');

  await page.waitForTimeout(3000);
  console.log('URL after login:', page.url());

  console.log('2. Clicking "Handwerk & Baustelle" in the sidebar...');
  const craftNav = page.locator('aside a[href="/craft"]');
  const count = await craftNav.count();
  console.log('Found /craft NavItem in sidebar:', count);

  if (count > 0) {
    await craftNav.first().click();
    await page.waitForTimeout(3000);
    console.log('URL after clicking craft nav:', page.url());
  } else {
    console.log('Navigating directly to /craft...');
    await page.goto('https://vibeforce-flow-os.vercel.app/craft', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
  }

  console.log('Taking screenshot of live /craft...');
  await page.screenshot({ path: 'C:/Users/kasan/.gemini/antigravity-ide/brain/7c874965-02fd-4dce-b2a0-3b8cb1f404e0/scratch/live_craft_hub_verified.png' });
  console.log('Saved: scratch/live_craft_hub_verified.png');

  const pageText = await page.innerText('body');
  console.log('Page has "VIBE CRAFT OS":', pageText.includes('VIBE CRAFT OS'));
  console.log('Page has "Handwerk & Baustellen-Zentrale":', pageText.includes('Handwerk & Baustellen-Zentrale'));
  console.log('Page has "VOB Teil C Aufmaß-Center":', pageText.includes('VOB Teil C Aufmaß-Center'));

  await browser.close();
}

verifyCraftLive().catch(console.error);
