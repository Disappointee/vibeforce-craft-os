import { chromium } from 'playwright';

async function verifyFinal() {
  const browser = await chromium.launch({ headless: true });

  // 1. Mobile Viewport (iPhone 14: 390x844)
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mPage = await mobileCtx.newPage();

  console.log('Logging in on Mobile...');
  await mPage.goto('https://vibeforce-flow-os.vercel.app/login', { waitUntil: 'domcontentloaded' });
  await mPage.fill('input[type="email"]', 'daniel@vibeforcetest.de');
  await mPage.fill('input[type="password"]', process.env.DEMO_DANIEL_PASSWORD);
  await mPage.click('button[type="submit"]');
  await mPage.waitForTimeout(3500);

  console.log('Navigating to /craft on Mobile...');
  await mPage.goto('https://vibeforce-flow-os.vercel.app/craft', { waitUntil: 'domcontentloaded' });
  await mPage.waitForTimeout(3000);

  // Take Mobile Screenshot of sober UI
  await mPage.screenshot({ path: 'C:/Users/kasan/.gemini/antigravity-ide/brain/7c874965-02fd-4dce-b2a0-3b8cb1f404e0/scratch/mobile_clean_hub_final.png' });
  console.log('Saved: scratch/mobile_clean_hub_final.png');

  // Click #craft-create-report-btn
  console.log('Clicking #craft-create-report-btn...');
  await mPage.click('#craft-create-report-btn');
  await mPage.waitForTimeout(1500);

  // Take screenshot with modal open
  await mPage.screenshot({ path: 'C:/Users/kasan/.gemini/antigravity-ide/brain/7c874965-02fd-4dce-b2a0-3b8cb1f404e0/scratch/mobile_quick_create_modal_final.png' });
  console.log('Saved: scratch/mobile_quick_create_modal_final.png');

  // Close modal with Escape
  await mPage.keyboard.press('Escape');
  await mPage.waitForTimeout(500);

  // 2. Desktop Viewport (1440x900)
  const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dPage = await desktopCtx.newPage();
  await dPage.goto('https://vibeforce-flow-os.vercel.app/login', { waitUntil: 'domcontentloaded' });
  await dPage.fill('input[type="email"]', 'daniel@vibeforcetest.de');
  await dPage.fill('input[type="password"]', process.env.DEMO_DANIEL_PASSWORD);
  await dPage.click('button[type="submit"]');
  await dPage.waitForTimeout(3500);

  await dPage.goto('https://vibeforce-flow-os.vercel.app/craft', { waitUntil: 'domcontentloaded' });
  await dPage.waitForTimeout(3000);
  await dPage.screenshot({ path: 'C:/Users/kasan/.gemini/antigravity-ide/brain/7c874965-02fd-4dce-b2a0-3b8cb1f404e0/scratch/desktop_clean_hub_final.png' });
  console.log('Saved: scratch/desktop_clean_hub_final.png');

  await browser.close();
  console.log('✅ ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
}

verifyFinal().catch(console.error);
