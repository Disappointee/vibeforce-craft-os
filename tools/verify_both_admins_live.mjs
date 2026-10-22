import { chromium } from 'playwright';

async function testUser(email, password, label) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  let interceptedUrl = '';
  page.on('request', req => {
    if (req.method() === 'POST' && req.url().includes('auth-with-password')) {
      interceptedUrl = req.url();
    }
  });

  try {
    await page.goto('https://vibeforce-flow-os.vercel.app/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    const finalUrl = page.url();
    const isSuccess = finalUrl === 'https://vibeforce-flow-os.vercel.app/' || !finalUrl.includes('/login');
    
    console.log(`[${label}] URL after login: ${finalUrl} | Intercepted Backend: ${interceptedUrl}`);
    await browser.close();
    return isSuccess;
  } catch (err) {
    console.error(`[${label}] Error: ${err.message}`);
    await browser.close();
    return false;
  }
}

async function main() {
  console.log('Testing BOTH Robin and Daniel accounts against live Vercel deployment...');

  for (let round = 1; round <= 10; round++) {
    console.log(`\n=== Round ${round}/10 ===`);
    const robinOk = await testUser('***REMOVED***', process.env.PB_ADMIN_PASSWORD, 'Robin Admin');
    const danielOk = await testUser('Daniel@vibeforcetest.de', process.env.DEMO_DANIEL_PASSWORD, 'Daniel Admin');

    console.log(`Results: Robin -> ${robinOk ? '✅ SUCCESS' : '❌ FAILED'}, Daniel -> ${danielOk ? '✅ SUCCESS' : '❌ FAILED'}`);

    if (robinOk && danielOk) {
      console.log('\n🎉🎉 BOTH ADMIN ACCOUNTS ARE FULLY VERIFIED ON LIVE VERCEL PRODUCTION!');
      process.exit(0);
    }

    console.log('Waiting 10s for edge cache invalidation...');
    await new Promise(r => setTimeout(r, 10000));
  }

  console.error('❌ Verification failed after 10 rounds.');
  process.exit(1);
}

main().catch(console.error);
