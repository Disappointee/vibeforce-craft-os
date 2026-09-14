import { chromium } from 'playwright';

const TARGET_URL = 'https://vibeforce-flow-os.vercel.app';

async function diagnose() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, locale: 'de-DE' });

  page.on('console', msg => console.log(`[Browser Console ${msg.type()}]:`, msg.text()));
  page.on('pageerror', err => console.log(`[Browser Uncaught Error]:`, err.message));
  page.on('response', res => {
    if (res.status() >= 400) {
      console.log(`[HTTP ${res.status()}]:`, res.url());
    }
  });

  // Login
  await page.goto(`${TARGET_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', '***REMOVED***');
  await page.fill('input[type="password"]', '***REMOVED***');
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 20000 });

  // Navigate to existing project
  console.log('\nTesting existing project: 9e83423ad4btu8l...');
  await page.goto(`${TARGET_URL}/projects/9e83423ad4btu8l`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  console.log('URL:', page.url());

  // Navigate to craft project
  console.log('\nTesting craft project: 58t8jfsty4e6o99...');
  await page.goto(`${TARGET_URL}/projects/58t8jfsty4e6o99`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  console.log('URL:', page.url());

  await browser.close();
}

diagnose().catch(console.error);
