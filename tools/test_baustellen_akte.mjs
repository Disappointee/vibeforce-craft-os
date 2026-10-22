import { chromium } from 'playwright';
import path from 'path';

const SCREENSHOT_DIR = 'C:\\Users\\Robin\\.gemini\\antigravity\\brain\\568fb111-7fa9-46aa-924c-5baba7305d6a\\screenshots';
const TARGET_URL = 'https://vibeforce-flow-os.vercel.app';

async function testBaustellenAkte() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, locale: 'de-DE' });

  // 1. Login
  await page.goto(`${TARGET_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await page.fill('input[type="email"]', '***REMOVED***');
  await page.fill('input[type="password"]', process.env.PB_ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 20000 });

  // 2. Open Baustelle BAU-01 directly
  console.log('Navigating to Baustellen-Akte BAU-01 (58t8jfsty4e6o99)...');
  await page.goto(`${TARGET_URL}/projects/58t8jfsty4e6o99`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '03_baustellen_akte_overview.png'),
    fullPage: false,
  });
  console.log('📸 03_baustellen_akte_overview.png');

  // Check if Bautagebuch tab or DailySiteReportForm is visible
  const reportTab = page.locator('button:has-text("Bautagebuch"), button:has-text("Berichte"), [role="tab"]:has-text("Bericht")').first();
  if (await reportTab.count() > 0) {
    await reportTab.click();
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '03b_baustellen_bautagebuch_tab.png'),
      fullPage: false,
    });
    console.log('📸 03b_baustellen_bautagebuch_tab.png');
  }

  // Open create report if available
  const newReportBtn = page.locator('button:has-text("Tagesbericht erfassen"), button:has-text("Neuer Bericht")').first();
  if (await newReportBtn.count() > 0) {
    await newReportBtn.click();
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '03c_baustellen_bericht_formular.png'),
      fullPage: false,
    });
    console.log('📸 03c_baustellen_bericht_formular.png');

    // Click signature pad inside form
    const sigPadTrigger = page.locator('[role="button"]:has-text("Signatur"), [role="button"]:has-text("Tippen"), div:has-text("Klicken/Tippen zum Signieren")').first();
    if (await sigPadTrigger.count() > 0) {
      await sigPadTrigger.scrollIntoViewIfNeeded();
      await sigPadTrigger.click();
      await page.waitForTimeout(1500);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '04_signature_studio_92vh_active.png'),
        fullPage: false,
      });
      console.log('📸 04_signature_studio_92vh_active.png');
    }
  }

  await browser.close();
}

testBaustellenAkte().catch(console.error);
