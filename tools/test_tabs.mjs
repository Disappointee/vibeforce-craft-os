import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, locale: 'de-DE' });

  await page.goto('https://craft-vibeforce.vercel.app/login', { waitUntil: 'domcontentloaded' });
  await page.click('#demo-login-button');
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 20000 });

  await page.goto('https://craft-vibeforce.vercel.app/projects/58t8jfsty4e6o99', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  // Click VOB Aufmaß
  const aufmassBtn = page.getByRole('button', { name: /VOB-Aufmaßblatt/i });
  if (await aufmassBtn.count() > 0) {
    await aufmassBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'craft_baustelle_aufmass.png' });
  }

  // Click Margen
  const margeBtn = page.getByRole('button', { name: /Margen-/i });
  if (await margeBtn.count() > 0) {
    await margeBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'craft_baustelle_marge.png' });
  }

  await browser.close();
  console.log('Done!');
}
run().catch(console.error);
