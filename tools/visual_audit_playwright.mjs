import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const screenshotsDir = 'C:\\Users\\Robin\\.gemini\\antigravity-ide\\brain\\db9e0f27-58a9-4eef-aec4-c405137b8126\\screenshots';
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Sample GAEB 90 .d83 file for testing
const sampleD83Content = [
  '00DP8320260907EURBaustelle Neubau Bürokomplex VIBE',
  '1001Rohbau- und Maurerarbeiten',
  '2101.01.0010Mauerwerk Porenbetonstein d=24cm DIN V 4165',
  '2585.000m212.501062.50',
  '26Außenwandmauerwerk Porenbetonstein PP4-0,50 mit Dünnbettmörtel.',
  '2101.01.0020Stahlbeton-Ringanker d=24cm B25 bewehrt',
  '2524.500m45.001102.50',
  '26Ringanker herstellen inkl. Schalung und Bewehrungsstahl BSt 500 S.'
].join('\r\n');

const sampleD83Path = path.resolve('tools', 'sample_test_boq.d83');
fs.writeFileSync(sampleD83Path, sampleD83Content, 'latin1');

async function runVisualAudit() {
  console.log('=== STARTING PLAYWRIGHT VISUAL AUDIT (M007 VIBE CRAFT) ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    locale: 'de-DE'
  });
  const page = await context.newPage();

  const results = [];

  // 1. Login
  console.log('1. Navigating to Login...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', 'daniel@vibeforcetest.de');
  await page.fill('input[type="password"]', process.env.DEMO_DANIEL_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // 2. Craft Hub Overview
  console.log('2. Navigating to /craft...');
  await page.goto('http://localhost:3000/craft', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const shot1 = path.join(screenshotsDir, '01_craft_hub_overview.png');
  await page.screenshot({ path: shot1, fullPage: false });
  console.log('  ✓ Saved:', shot1);
  results.push({ name: 'Craft Hub Overview', file: shot1 });

  // 3. Cost Cockpit (Nachkalkulation & Margen)
  console.log('3. Testing Cost Cockpit (Stunden-Quelle & Amber-Kollisionswarnung)...');
  const marginTab = page.locator('#craft-tab-margin-btn');
  await marginTab.click();
  await page.waitForTimeout(1500);

  const shot2 = path.join(screenshotsDir, '02_cost_cockpit_time_entries.png');
  await page.screenshot({ path: shot2 });
  console.log('  ✓ Saved:', shot2);
  results.push({ name: 'Cost Cockpit Time Entries', file: shot2 });

  // Find Hours Source dropdown
  const sourceSelect = page.locator('#cost-cockpit-source-select, select').first();
  if (await sourceSelect.count() > 0) {
    console.log('  Found hours source dropdown, switching to site_reports...');
    await sourceSelect.selectOption('site_reports');
    await page.waitForTimeout(1200);

    const shot3 = path.join(screenshotsDir, '03_cost_cockpit_site_reports.png');
    await page.screenshot({ path: shot3 });
    console.log('  ✓ Saved:', shot3);
    results.push({ name: 'Cost Cockpit Site Reports Source', file: shot3 });

    console.log('  Switching to regie_additive...');
    await sourceSelect.selectOption('regie_additive');
    await page.waitForTimeout(1200);

    const shot4 = path.join(screenshotsDir, '04_cost_cockpit_regie_additive.png');
    await page.screenshot({ path: shot4 });
    console.log('  ✓ Saved:', shot4);
    results.push({ name: 'Cost Cockpit Regie Additive Source', file: shot4 });
  }

  // 4. GAEB Manager (.d83 Parser & Viewer)
  console.log('4. Testing GAEB Manager (.d83 file upload & parsing)...');
  const gaebTab = page.locator('#craft-tab-gaeb-btn');
  await gaebTab.click();
  await page.waitForTimeout(1500);

  // Upload sample .d83 file
  const fileInput = page.locator('input[type="file"]').first();
  if (await fileInput.count() > 0) {
    console.log('  Uploading sample .d83 file to GAEB Manager...');
    await fileInput.setInputFiles(sampleD83Path);
    await page.waitForTimeout(2500);
  }

  const shot5 = path.join(screenshotsDir, '05_gaeb90_parsed_boq.png');
  await page.screenshot({ path: shot5 });
  console.log('  ✓ Saved:', shot5);
  results.push({ name: 'GAEB 90 .d83 Parsed BoQ', file: shot5 });

  // 5. Wholesale Manager (Großhandel & Punchout)
  console.log('5. Testing Wholesale Manager...');
  const wholesaleTab = page.locator('#craft-tab-wholesale-btn');
  await wholesaleTab.click();
  await page.waitForTimeout(1500);

  const shot6 = path.join(screenshotsDir, '06_wholesale_manager.png');
  await page.screenshot({ path: shot6 });
  console.log('  ✓ Saved:', shot6);
  results.push({ name: 'Wholesale Manager', file: shot6 });

  // 6. Invoices & ZUGFeRD Tab
  console.log('6. Testing Invoices & ZUGFeRD Hub...');
  const invoicesTab = page.locator('button:has-text("Rechnungen & DATEV")');
  await invoicesTab.click();
  await page.waitForTimeout(1500);

  const shot7 = path.join(screenshotsDir, '07_invoices_zugferd_hub.png');
  await page.screenshot({ path: shot7 });
  console.log('  ✓ Saved:', shot7);
  results.push({ name: 'Invoices & ZUGFeRD Hub', file: shot7 });

  // 7. Bautagesbericht Form & VOB/B § 2 Abs. 10 Checkbox
  console.log('7. Testing Bautagesbericht Modal & VOB/B § 2 Abs. 10 Checkbox...');
  const createReportBtn = page.locator('#craft-create-report-btn, button:has-text("Bericht erfassen")').first();
  await createReportBtn.click();
  await page.waitForTimeout(1500);

  // Scroll to VOB/B § 2 Abs. 10 checkbox inside modal
  const vobLabel = page.locator('label:has-text("§ 2 Abs. 10 VOB/B")').first();
  const vobCheckbox = page.locator('#is_regie_extra, input[type="checkbox"]').first();

  const isLabelVisible = await vobLabel.isVisible().catch(() => false);
  console.log('  VOB/B § 2 Abs. 10 Label visible:', isLabelVisible);

  if (await vobCheckbox.count() > 0) {
    await vobCheckbox.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await vobCheckbox.check();
    await page.waitForTimeout(500);
  }

  const shot8 = path.join(screenshotsDir, '08_daily_site_report_vob_checkbox.png');
  await page.screenshot({ path: shot8 });
  console.log('  ✓ Saved:', shot8);
  results.push({ name: 'Bautagesbericht VOB/B § 2 Abs. 10 Checkbox', file: shot8 });

  await browser.close();
  console.log('\n=== VISUAL AUDIT COMPLETED SUCCESSFULLY ===');
  console.log(`Generated ${results.length} visual screenshots in ${screenshotsDir}`);
}

runVisualAudit().catch(err => {
  console.error('Playwright Visual Audit Error:', err);
  process.exit(1);
});
