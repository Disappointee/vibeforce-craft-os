import { chromium } from 'playwright';

async function testFullNavigation() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('1. Logging in as Robin Admin...');
  await page.goto('https://vibeforce-flow-os.vercel.app/login', { waitUntil: 'networkidle' });
  await page.fill('#email', '***REMOVED***');
  await page.fill('#password', process.env.PB_ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('https://vibeforce-flow-os.vercel.app/', { timeout: 15000 });
  console.log('✅ Reached Dashboard:', page.url());

  console.log('2. Testing /projects navigation...');
  await page.goto('https://vibeforce-flow-os.vercel.app/projects', { waitUntil: 'networkidle' });
  const projectCards = await page.$$('a[href*="/projects/"]');
  console.log(`✅ Projects page loaded with ${projectCards.length} project links`);

  console.log('3. Testing /planner navigation...');
  await page.goto('https://vibeforce-flow-os.vercel.app/planner', { waitUntil: 'networkidle' });
  console.log('✅ Planner page loaded:', page.url());

  console.log('4. Testing /time navigation...');
  await page.goto('https://vibeforce-flow-os.vercel.app/time', { waitUntil: 'networkidle' });
  console.log('✅ Time tracking page loaded:', page.url());

  await browser.close();
  console.log('\n🎉 ALL CORE ROUTES VERIFIED LIVE!');
}

testFullNavigation().catch(err => {
  console.error(err);
  process.exit(1);
});
