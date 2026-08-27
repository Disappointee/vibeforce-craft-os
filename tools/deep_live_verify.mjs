import { chromium } from 'playwright';

async function testLogin(email, password, label) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  let interceptedPostUrl = '';
  let interceptedStatus = 0;

  page.on('request', req => {
    if (req.method() === 'POST' && req.url().includes('auth-with-password')) {
      interceptedPostUrl = req.url();
    }
  });

  page.on('response', res => {
    if (res.url().includes('auth-with-password')) {
      interceptedStatus = res.status();
    }
  });

  try {
    await page.goto('https://vibeforce-flow-os.vercel.app/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    const finalUrl = page.url();
    const passed = (finalUrl === 'https://vibeforce-flow-os.vercel.app/' || (!finalUrl.includes('/login') && finalUrl.includes('vercel.app'))) && interceptedStatus === 200;

    console.log(`[${label}] URL: ${finalUrl} | Status: ${interceptedStatus} | Endpoint: ${interceptedPostUrl}`);
    await browser.close();
    return { passed, finalUrl, interceptedPostUrl, interceptedStatus };
  } catch (err) {
    console.error(`[${label}] Error: ${err.message}`);
    await browser.close();
    return { passed: false, error: err.message };
  }
}

async function run() {
  console.log('🚀 Starting deep live Playwright verification loop...');

  for (let i = 1; i <= 15; i++) {
    console.log(`\n--- Verification Run ${i}/15 ---`);
    const robin = await testLogin('***REMOVED***', '***REMOVED***', 'Robin Admin');
    const daniel = await testLogin('Daniel@vibeforcetest.de', '***REMOVED***', 'Daniel Admin');

    if (robin.passed && daniel.passed) {
      console.log('\n======================================================');
      console.log('✅ BOTH ADMIN ACCOUNTS ARE 100% VERIFIED LIVE ON VERCEL!');
      console.log('======================================================');
      process.exit(0);
    }

    console.log('Waiting 10s for Vercel deployment to propagate...');
    await new Promise(r => setTimeout(r, 10000));
  }

  console.error('❌ Verification failed after 15 runs.');
  process.exit(1);
}

run().catch(console.error);
