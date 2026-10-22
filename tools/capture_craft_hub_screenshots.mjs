import { chromium } from 'playwright';
import path from 'path';

const SCREENSHOT_DIR = 'C:\\Users\\Robin\\.gemini\\antigravity\\brain\\9d1aaf3f-b89a-4ecb-802b-2cb0af98736a\\screenshots';
const TARGET_URL = 'https://vibeforce-flow-os.vercel.app';

async function captureCraftHub() {
  console.log('======================================================================');
  console.log('📸 CAPTURE: Craft Hub & Baustellen Showcase Screenshots');
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    locale: 'de-DE',
  });
  const page = await context.newPage();

  // 1. Login
  console.log('1. Login an ' + TARGET_URL + '...');
  await page.goto(`${TARGET_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', '***REMOVED***');
  await page.fill('input[type="password"]', process.env.PB_ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 20000 });
  console.log('   ✅ Eingeloggt!');

  // 2. /craft aufrufen
  console.log('2. Öffne /craft (Handwerks-Zentrale)...');
  await page.goto(`${TARGET_URL}/craft?t=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const hubScreenshotPath = path.join(SCREENSHOT_DIR, '01_craft_hub_live_seeded.png');
  await page.screenshot({ path: hubScreenshotPath, fullPage: false });
  console.log(`   📸 Screenshot gespeichert: ${hubScreenshotPath}`);

  // 3. Baustelle Huber aufrufen
  console.log('3. Öffne Baustelle Huber (58t8jfsty4e6o99)...');
  const huberLink = page.locator('text=Neubau EFH Familie Huber').first();
  if (await huberLink.count() > 0) {
    await huberLink.click();
    await page.waitForTimeout(3000);
    const p1ScreenshotPath = path.join(SCREENSHOT_DIR, '02_craft_baustelle_huber.png');
    await page.screenshot({ path: p1ScreenshotPath, fullPage: false });
    console.log(`   📸 Screenshot gespeichert: ${p1ScreenshotPath}`);
  }

  // 4. Baustelle Schmidt aufrufen
  console.log('4. Öffne Baustelle Schmidt (detyh3oxx7y80za)...');
  await page.goto(`${TARGET_URL}/craft?t=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const schmidtLink = page.locator('text=Sanierung Gewerbehalle Schmidt').first();
  if (await schmidtLink.count() > 0) {
    await schmidtLink.click();
    await page.waitForTimeout(3000);
    const p2ScreenshotPath = path.join(SCREENSHOT_DIR, '03_craft_baustelle_schmidt.png');
    await page.screenshot({ path: p2ScreenshotPath, fullPage: false });
    console.log(`   📸 Screenshot gespeichert: ${p2ScreenshotPath}`);
  }

  await browser.close();
  console.log('\n======================================================================');
  console.log('🎉 SCREENSHOTS ERFOLGREICH AUFGENOMMEN!');
  console.log('======================================================================\n');
}

captureCraftHub().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
