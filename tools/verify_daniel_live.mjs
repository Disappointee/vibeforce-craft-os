import { chromium } from 'playwright';

async function testDaniel() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('request', req => {
    if (req.method() === 'POST' && req.url().includes('auth-with-password')) {
      console.log('  -> Intercepted Auth POST for Daniel:', req.url());
    }
  });

  await page.goto('https://vibeforce-flow-os.vercel.app/login', { waitUntil: 'networkidle' });
  await page.fill('#email', 'Daniel@vibeforcetest.de');
  await page.fill('#password', '***REMOVED***');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);

  const finalUrl = page.url();
  console.log('  -> Daniel Final URL:', finalUrl);

  const passed = finalUrl === 'https://vibeforce-flow-os.vercel.app/' || !finalUrl.includes('/login');
  await browser.close();

  if (!passed) throw new Error('Daniel login failed');
  console.log('🎉 DANIEL LOGIN VERIFIED 100%!');
}

testDaniel().catch(err => {
  console.error(err);
  process.exit(1);
});
