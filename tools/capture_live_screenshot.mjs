import { chromium } from 'playwright';

async function captureDashboardScreenshot() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Logging in as Robin on live Vercel...');
  await page.goto('https://vibeforce-flow-os.vercel.app/login', { waitUntil: 'networkidle' });
  await page.fill('#email', '***REMOVED***');
  await page.fill('#password', process.env.PB_ADMIN_PASSWORD);
  await page.click('button[type="submit"]');

  await page.waitForURL('https://vibeforce-flow-os.vercel.app/', { timeout: 15000 });
  await page.waitForTimeout(3000);

  const screenshotPath = 'c:\\Users\\Robin\\Desktop\\AlphaExplorer\\K.I. Takeover\\Neu\\Vibeforce One\\vibeforce-flow-os\\tools\\dashboard_live_verified.png';
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log('📸 Screenshot saved to:', screenshotPath);

  await browser.close();
}

captureDashboardScreenshot().catch(console.error);
