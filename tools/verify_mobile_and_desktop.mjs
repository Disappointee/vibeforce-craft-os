import { chromium } from 'playwright';

async function checkMobileAndDesktop() {
  const browser = await chromium.launch({ headless: true });

  // 1. Desktop Viewport (1440x900)
  const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dPage = await desktopCtx.newPage();
  await dPage.goto('https://vibeforce-flow-os.vercel.app/login', { waitUntil: 'networkidle' });
  await dPage.fill('input[type="email"]', 'daniel@vibeforcetest.de');
  await dPage.fill('input[type="password"]', process.env.DEMO_DANIEL_PASSWORD);
  await dPage.click('button[type="submit"]');
  await dPage.waitForTimeout(3000);

  const craftNavD = dPage.locator('aside a[href="/craft"]');
  await craftNavD.first().click();
  await dPage.waitForTimeout(2000);
  await dPage.screenshot({ path: 'C:/Users/Robin/.gemini/antigravity-ide/brain/7c874965-02fd-4dce-b2a0-3b8cb1f404e0/scratch/view_desktop.png' });
  console.log('Saved: scratch/view_desktop.png');

  // 2. Mobile Viewport (iPhone 14: 390x844)
  const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mPage = await mobileCtx.newPage();
  await mPage.goto('https://vibeforce-flow-os.vercel.app/login', { waitUntil: 'networkidle' });
  await mPage.fill('input[type="email"]', 'daniel@vibeforcetest.de');
  await mPage.fill('input[type="password"]', process.env.DEMO_DANIEL_PASSWORD);
  await mPage.click('button[type="submit"]');
  await mPage.waitForTimeout(3000);

  // On mobile, the sidebar might be collapsed behind a hamburger menu or bottom nav!
  console.log('Mobile URL after login:', mPage.url());
  await mPage.goto('https://vibeforce-flow-os.vercel.app/craft', { waitUntil: 'domcontentloaded' });
  await mPage.waitForTimeout(2500);
  await mPage.screenshot({ path: 'C:/Users/Robin/.gemini/antigravity-ide/brain/7c874965-02fd-4dce-b2a0-3b8cb1f404e0/scratch/view_mobile.png' });
  console.log('Saved: scratch/view_mobile.png');

  await browser.close();
}

checkMobileAndDesktop().catch(console.error);
