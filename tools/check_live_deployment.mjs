import { chromium } from 'playwright';

async function check() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  console.log('1. Navigating to login...');
  await page.goto('https://vibeforce-flow-2b62u54jn-robins-projects-34c3aad5.vercel.app/login', { waitUntil: 'load' });
  await page.fill('#email', '***REMOVED***');
  await page.fill('#password', process.env.PB_ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  
  console.log('2. Navigating to /craft...');
  await page.goto('https://vibeforce-flow-2b62u54jn-robins-projects-34c3aad5.vercel.app/craft', { waitUntil: 'load' });
  await page.waitForTimeout(4000);
  
  const content = await page.content();
  const hasBaustelleAnlegen = content.includes('Baustelle anlegen');
  const hasButtonId = content.includes('craft-create-baustelle-btn');
  console.log('LIVE /craft has "Baustelle anlegen":', hasBaustelleAnlegen);
  console.log('LIVE /craft has id "craft-create-baustelle-btn":', hasButtonId);

  // Check what happens if we click #craft-create-report-btn
  console.log('3. Clicking #craft-create-report-btn...');
  const reportBtn = page.locator('#craft-create-report-btn');
  if (await reportBtn.count() > 0) {
    await reportBtn.first().click();
    await page.waitForTimeout(1500);
    const modalContent = await page.content();
    console.log('Modal has "Erste Baustelle anlegen":', modalContent.includes('Erste Baustelle anlegen'));
    console.log('Modal has link to /projects:', modalContent.includes('href="/projects"'));
    console.log('Modal has "Neue Baustelle":', modalContent.includes('Neue Baustelle'));
    await page.screenshot({ path: 'tools/modal_live.png' });
    console.log('Saved screenshot tools/modal_live.png');
  } else {
    console.log('reportBtn not found');
  }

  await browser.close();
}

check().catch(console.error);
