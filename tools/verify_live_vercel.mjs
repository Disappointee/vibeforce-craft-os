import { chromium } from 'playwright';

async function verifyLive() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log('1. Logging in to https://vibeforce-flow-os.vercel.app/login...');
  await page.goto('https://vibeforce-flow-os.vercel.app/login', { waitUntil: 'networkidle' });
  await page.fill('#email', '***REMOVED***');
  await page.fill('#password', '***REMOVED***');
  await page.click('button[type="submit"]');

  await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 15000 });
  console.log('Logged in! Current URL:', page.url());

  // Check /docs tab
  console.log('2. Checking /docs page...');
  await page.goto('https://vibeforce-flow-os.vercel.app/docs', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const docsText = await page.innerText('body');
  const hasCraftTab = docsText.includes('VIBE Craft') || docsText.includes('Handwerker') || docsText.includes('M007');
  console.log('Docs contains VIBE Craft:', hasCraftTab);

  // Check /profile page
  console.log('3. Checking /profile page for M007 toggle and language...');
  await page.goto('https://vibeforce-flow-os.vercel.app/profile', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const profileText = await page.innerText('body');
  const hasCraftToggle = profileText.includes('VIBE Craft') || profileText.includes('M007');
  const hasLanguageSelect = profileText.includes('Sprache') || profileText.includes('Language') || profileText.includes('Deutsch');
  console.log('Profile contains Craft Toggle:', hasCraftToggle);
  console.log('Profile contains Language Select:', hasLanguageSelect);

  // Take screenshot of profile
  await page.screenshot({ path: 'C:/Users/kasan/.gemini/antigravity-ide/brain/7c874965-02fd-4dce-b2a0-3b8cb1f404e0/scratch/live_profile.png' });
  console.log('Screenshot saved to scratch/live_profile.png');

  await browser.close();
}

verifyLive().catch(console.error);
