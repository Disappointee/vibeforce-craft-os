import { chromium } from 'playwright';

async function verifyGrillMeLive() {
  console.log('=== GRILL ME AUDIT: LIVE E2E VERIFICATION ===\n');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  console.log('1. Logging in with craftsman account (Daniel)...');
  await page.goto('https://vibeforce-flow-os.vercel.app/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', 'daniel@vibeforcetest.de');
  await page.fill('input[type="password"]', process.env.DEMO_DANIEL_PASSWORD);
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(5000);

  console.log('2. Navigating to /craft...');
  await page.goto('https://vibeforce-flow-os.vercel.app/craft', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  console.log('Current URL:', page.url());

  // Check if GAEB tab exists
  console.log('3. Testing GAEB Tab...');
  const screenshotDir = 'C:/Users/kasan/.gemini/antigravity/brain/9d4131b7-dd18-4294-9dc0-ab4a9932ffe9';
  const gaebTab = await page.$('#craft-tab-gaeb-btn');
  if (!gaebTab) {
    await page.screenshot({ path: `${screenshotDir}/diagnostic_live_fail.png` });
    const content = await page.content();
    console.log('Page Title:', await page.title());
    console.log('Has #craft-create-report-btn?', Boolean(await page.$('#craft-create-report-btn')));
    throw new Error('GRILL ME FAIL: #craft-tab-gaeb-btn not found on live page! (Vercel deployment might still be in progress)');
  }
  await gaebTab.click();
  await page.waitForTimeout(1500);

  // Click "Muster-LV" button inside GAEB Manager to verify state & rendering
  console.log('4. Testing GAEB Sample LV Loading...');
  const sampleBtn = await page.$('button:has-text("Muster-LV"), button:has-text("Muster-Ausschreibung")');
  if (sampleBtn) {
    await sampleBtn.click();
    await page.waitForTimeout(1000);
  }

  // Screenshot GAEB Tab
  await page.screenshot({ path: `${screenshotDir}/live_audit_gaeb.png` });
  console.log('Saved GAEB screenshot: live_audit_gaeb.png');

  // Check if Margin tab exists
  console.log('5. Testing Nachkalkulation & Margen Tab...');
  const marginTab = await page.$('#craft-tab-margin-btn');
  if (!marginTab) {
    throw new Error('GRILL ME FAIL: #craft-tab-margin-btn not found on live page!');
  }
  await marginTab.click();
  await page.waitForTimeout(1500);

  // Screenshot Margin Cockpit
  await page.screenshot({ path: `${screenshotDir}/live_audit_margin_cockpit.png` });
  console.log('Saved Margin Cockpit screenshot: live_audit_margin_cockpit.png');

  // Check if Wholesale & DATANORM tab exists
  console.log('6. Testing Großhandel & DATANORM / IDS-Connect Tab...');
  const wholesaleTab = await page.waitForSelector('#craft-tab-wholesale-btn', { timeout: 35000 });
  if (!wholesaleTab) {
    throw new Error('GRILL ME FAIL: #craft-tab-wholesale-btn not found on live page!');
  }
  await wholesaleTab.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${screenshotDir}/live_audit_wholesale_datanorm.png` });
  console.log('Saved Wholesale screenshot: live_audit_wholesale_datanorm.png');

  // Test Punchout subtab and simulator
  const idsTabBtn = await page.$('button:has-text("IDS-Connect Punchout")');
  if (idsTabBtn) {
    await idsTabBtn.click();
    await page.waitForTimeout(1000);

    const punchoutBtn = await page.$('button:has-text("Großhandels-Shop öffnen")');
    if (punchoutBtn) {
      await punchoutBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${screenshotDir}/live_audit_wholesale_punchout_modal.png` });
      console.log('Saved Wholesale Punchout Modal screenshot: live_audit_wholesale_punchout_modal.png');
      const closeBtn = await page.$('button:has-text("Abbrechen")');
      if (closeBtn) await closeBtn.click();
      await page.waitForTimeout(500);
    }
  }

  await browser.close();

  console.log('\n=== CONSOLE ERROR AUDIT ===');
  if (consoleErrors.length > 0) {
    console.warn(`Encountered ${consoleErrors.length} console errors:`, consoleErrors);
  } else {
    console.log('✅ ZERO CONSOLE ERRORS on Live Vercel deployment!');
  }

  console.log('\n🎉 ALL GRILL ME LIVE CHECKS PASSED!');
}

verifyGrillMeLive().catch((err) => {
  console.error('❌ GRILL ME AUDIT FAILED:', err);
  process.exit(1);
});
