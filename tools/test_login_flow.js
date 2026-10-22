const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER:', msg.type(), msg.text()));
  page.on('response', async res => {
    if (res.url().includes('/api/auth/login')) {
      console.log('Login API status:', res.status());
      console.log('Login API headers:', res.headers()['set-cookie']);
      try {
        console.log('Login API body:', await res.text());
      } catch(e) {}
    }
  });

  await page.goto('https://vibeforce-flow-os.vercel.app/login');
  await page.fill('#email', 'daniel@vibeforcetest.de');
  await page.fill('#password', process.env.DEMO_DANIEL_PASSWORD);
  await page.click('button[type="submit"]');

  await page.waitForTimeout(4000);
  console.log('Cookies in context:', await page.context().cookies());
  console.log('Page URL after 4s:', page.url());

  await browser.close();
})();
