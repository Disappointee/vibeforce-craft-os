import { chromium } from 'playwright';

async function fastVerify() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  console.log('Navigating to login...');
  await page.goto('https://vibeforce-flow-os.vercel.app/login', { waitUntil: 'domcontentloaded' });
  await page.fill('#email', '***REMOVED***');
  await page.fill('#password', process.env.PB_ADMIN_PASSWORD);
  await page.click('button[type="submit"]');

  await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 15000 });
  console.log('Login successful! URL:', page.url());

  // Go to Profile
  console.log('Navigating to Profile...');
  await page.goto('https://vibeforce-flow-os.vercel.app/profile', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const profileBody = await page.innerText('body');
  const hasCraft = profileBody.includes('VIBE Craft') || profileBody.includes('Handwerk & Baustelle') || profileBody.includes('M007');
  const hasLang = profileBody.includes('Sprache') || profileBody.includes('Language') || profileBody.includes('Deutsch');
  console.log('Profile has M007 Craft Toggle:', hasCraft);
  console.log('Profile has Language Switcher:', hasLang);

  await page.screenshot({ path: 'C:/Users/Robin/.gemini/antigravity-ide/brain/7c874965-02fd-4dce-b2a0-3b8cb1f404e0/scratch/live_profile.png' });
  console.log('Saved screenshot to scratch/live_profile.png');

  // Go to Docs
  console.log('Navigating to Docs...');
  await page.goto('https://vibeforce-flow-os.vercel.app/docs', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const docsBody = await page.innerText('body');
  const docsHasCraft = docsBody.includes('VIBE Craft') || docsBody.includes('Handwerker') || docsBody.includes('M007');
  console.log('Docs has M007 section:', docsHasCraft);

  await page.screenshot({ path: 'C:/Users/Robin/.gemini/antigravity-ide/brain/7c874965-02fd-4dce-b2a0-3b8cb1f404e0/scratch/live_docs.png' });
  console.log('Saved screenshot to scratch/live_docs.png');

  await browser.close();
}

fastVerify().catch(console.error);
