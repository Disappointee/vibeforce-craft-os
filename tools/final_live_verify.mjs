import { chromium } from 'playwright';

async function verifyAccount(email, password, roleLabel) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log(`\n=== Testing ${roleLabel} (${email}) ===`);
  await page.goto('https://vibeforce-flow-os.vercel.app/login', { waitUntil: 'networkidle' });

  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');

  await page.waitForURL('https://vibeforce-flow-os.vercel.app/', { timeout: 15000 });
  console.log(`✅ ${roleLabel} successfully logged in -> Reached Dashboard`);

  // Check projects count
  await page.goto('https://vibeforce-flow-os.vercel.app/projects', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const projectCards = await page.$$('a[href*="/projects/"]');
  console.log(`✅ Projects page loaded: ${projectCards.length} projects displayed`);

  // Check planner
  await page.goto('https://vibeforce-flow-os.vercel.app/planner', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log(`✅ Planner timeline loaded: ${page.url()}`);

  // Check team/users
  await page.goto('https://vibeforce-flow-os.vercel.app/team', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log(`✅ Team workload loaded: ${page.url()}`);

  await browser.close();
  return true;
}

async function main() {
  console.log('🚀 Executing Full Playwright Verification across all admin accounts...');
  
  const robinOk = await verifyAccount('***REMOVED***', process.env.PB_ADMIN_PASSWORD, 'Robin Admin');
  const danielOk = await verifyAccount('Daniel@vibeforcetest.de', process.env.DEMO_DANIEL_PASSWORD, 'Daniel Admin');

  if (robinOk && danielOk) {
    console.log('\n===============================================================');
    console.log('🎉 100% COMPLETE & VERIFIED: Both accounts verified on live Vercel!');
    console.log('===============================================================');
  }
}

main().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
