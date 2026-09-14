import { chromium } from 'playwright';

async function tryLogin() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  let targetPostUrl = '';
  page.on('request', req => {
    if (req.method() === 'POST' && req.url().includes('auth-with-password')) {
      targetPostUrl = req.url();
      console.log('  -> Intercepted Auth POST:', targetPostUrl);
    }
  });

  try {
    await page.goto('https://vibeforce-flow-os.vercel.app/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.fill('#email', '***REMOVED***');
    await page.fill('#password', '***REMOVED***');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);

    const finalUrl = page.url();
    console.log('  -> Current URL after submit:', finalUrl);
    console.log('  -> Target Auth Endpoint:', targetPostUrl);

    if (finalUrl === 'https://vibeforce-flow-os.vercel.app/' || finalUrl.includes('/projects') || finalUrl.includes('/planner') || (!finalUrl.includes('/login') && finalUrl.includes('vibeforce-flow-os.vercel.app'))) {
      await browser.close();
      return { success: true, url: finalUrl, targetPostUrl };
    }

    const toast = await page.evaluate(() => {
      const el = document.querySelector('[data-sonner-toaster]') || document.querySelector('section[aria-label*="Notifications"]');
      return el ? el.textContent : '';
    });
    console.log('  -> Toast on page:', toast);

    await browser.close();
    return { success: false, url: finalUrl, targetPostUrl, toast };
  } catch (err) {
    await browser.close();
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log('Starting E2E verification loop for https://vibeforce-flow-os.vercel.app/login...');
  for (let attempt = 1; attempt <= 10; attempt++) {
    console.log(`\n[Attempt ${attempt}/10] Testing login...`);
    const res = await tryLogin();
    if (res.success) {
      console.log(`\n🎉 E2E VERIFICATION PASSED! Successfully logged in and redirected to: ${res.url}`);
      process.exit(0);
    }
    console.log(`Waiting 10s for Vercel deployment propagation...`);
    await new Promise(r => setTimeout(r, 10000));
  }
  console.error('\n❌ E2E Verification timed out.');
  process.exit(1);
}

main().catch(console.error);
