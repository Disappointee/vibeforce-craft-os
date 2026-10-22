import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('request', req => console.log('REQ:', req.method(), req.url()));
  page.on('response', async res => {
    console.log('RES:', res.status(), res.url());
    if (res.url().includes('pocketbase') || res.url().includes('auth') || res.url().includes('api')) {
      try {
        const body = await res.text();
        console.log('RES BODY:', body.substring(0, 300));
      } catch (e) {}
    }
  });

  console.log('Navigating to https://vibeforce-flow-os.vercel.app/login...');
  await page.goto('https://vibeforce-flow-os.vercel.app/login', { waitUntil: 'networkidle' });

  console.log('Filling form...');
  await page.fill('#email', '***REMOVED***');
  await page.fill('#password', process.env.PB_ADMIN_PASSWORD);

  console.log('Clicking Anmelden button...');
  await page.click('button[type="submit"]');

  await page.waitForTimeout(4000);

  const currentUrl = page.url();
  console.log('Final URL after login attempt:', currentUrl);

  const toastText = await page.evaluate(() => {
    const el = document.querySelector('[data-sonner-toaster]') || document.querySelector('section[aria-label="Notifications alt+T"]');
    return el ? el.innerText : 'NO TOAST FOUND';
  });
  console.log('Toast on screen:', toastText);

  await browser.close();
}

main().catch(console.error);
