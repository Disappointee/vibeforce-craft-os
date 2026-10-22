import { chromium } from 'playwright';

async function check() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', 'daniel@vibeforcetest.de');
  await page.fill('input[type="password"]', process.env.DEMO_DANIEL_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  await page.goto('http://localhost:3000/craft', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const url = page.url();
  console.log('Current URL:', url);
  const buttons = await page.$$eval('button', btns => btns.map(b => ({ id: b.id, text: b.innerText.trim().replace(/\n+/g, ' ') })));
  console.log('Total buttons found:', buttons.length);
  console.log('Buttons on /craft:\n', buttons.map(b => `[${b.id || 'no-id'}] "${b.text}"`).join('\n'));
  await browser.close();
}

check().catch(console.error);
