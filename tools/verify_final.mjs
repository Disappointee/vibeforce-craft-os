import { chromium } from 'playwright';

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to live docs...');
  await page.goto('https://vibeforce-flow-os.vercel.app/docs', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const text = await page.innerText('body');
  const hasCraft = text.includes('Handwerker') || text.includes('VIBE Craft') || text.includes('Geofencing');
  console.log('Docs has VIBE Craft / Handwerker:', hasCraft);

  // Take screenshot of Docs
  await page.screenshot({ path: 'C:/Users/Robin/.gemini/antigravity-ide/brain/7c874965-02fd-4dce-b2a0-3b8cb1f404e0/scratch/live_docs_final.png' });
  console.log('Docs screenshot saved: scratch/live_docs_final.png');

  await browser.close();
}

verify().catch(console.error);
