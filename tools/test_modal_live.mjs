import { chromium } from 'playwright';

async function testModalLive() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Logging in...');
  await page.goto('https://vibeforce-flow-os.vercel.app/login');
  await page.fill('input[type="email"]', 'daniel@vibeforcetest.de');
  await page.fill('input[type="password"]', process.env.DEMO_DANIEL_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/');
  console.log('Logged in successfully!');

  console.log('Navigating to /craft...');
  await page.goto('https://vibeforce-flow-os.vercel.app/craft');
  await page.waitForSelector('#craft-create-report-btn');
  console.log('Found #craft-create-report-btn!');

  // Click #craft-create-report-btn
  await page.click('#craft-create-report-btn');
  await page.waitForSelector('text=Bautagesbericht erfassen');
  console.log('Modal opened!');

  await page.screenshot({ path: 'C:/Users/kasan/.gemini/antigravity-ide/brain/7c874965-02fd-4dce-b2a0-3b8cb1f404e0/scratch/live_modal_verified.png' });
  console.log('Saved scratch/live_modal_verified.png');

  await browser.close();
  console.log('ALL DONE!');
}

testModalLive().catch(console.error);
