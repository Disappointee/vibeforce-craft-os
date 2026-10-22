import { chromium } from 'playwright';

async function testProjectAndForm() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Logging in...');
  await page.goto('https://vibeforce-flow-os.vercel.app/login');
  await page.fill('input[type="email"]', 'daniel@vibeforcetest.de');
  await page.fill('input[type="password"]', process.env.DEMO_DANIEL_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/');

  // Navigate to projects to check count
  await page.goto('https://vibeforce-flow-os.vercel.app/projects');
  await page.waitForTimeout(2000);

  // Check if projects exist, if none, create one quick test project
  const projectCards = await page.locator('a[href^="/projects/"]').count();
  console.log('Projects found on /projects:', projectCards);

  await page.goto('https://vibeforce-flow-os.vercel.app/craft');
  await page.waitForTimeout(2000);
  await page.click('#craft-create-report-btn');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'C:/Users/kasan/.gemini/antigravity-ide/brain/7c874965-02fd-4dce-b2a0-3b8cb1f404e0/scratch/modal_state.png' });
  console.log('Modal state captured in scratch/modal_state.png');

  await browser.close();
}

testProjectAndForm().catch(console.error);
