import { chromium } from 'playwright';

async function testFetch() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, locale: 'de-DE' });

  // Login
  await page.goto('https://craft-vibeforce.vercel.app/login', { waitUntil: 'domcontentloaded' });
  await page.click('#demo-login-button');
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 20000 });

  // Test /craft
  console.log('Navigating to /craft...');
  await page.goto('https://craft-vibeforce.vercel.app/craft', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  console.log('/craft URL:', page.url());
  await page.screenshot({ path: 'craft_hub_verified.png' });

  // Test /projects
  console.log('Navigating to /projects...');
  await page.goto('https://craft-vibeforce.vercel.app/projects', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  console.log('/projects URL:', page.url());
  await page.screenshot({ path: 'craft_projects_verified.png' });

  // Test /projects/58t8jfsty4e6o99
  console.log('Navigating to /projects/58t8jfsty4e6o99...');
  await page.goto('https://craft-vibeforce.vercel.app/projects/58t8jfsty4e6o99', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  console.log('/projects/58t8jfsty4e6o99 URL:', page.url());
  await page.screenshot({ path: 'craft_baustelle_huber_verified.png' });

  await browser.close();
}

testFetch().catch(console.error);
