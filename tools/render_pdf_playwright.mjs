import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const htmlPath = path.resolve(__dirname, '../VIBEFORCE_FLOW_OS_BROSCHUERE.html');
  const outputPath = path.resolve(__dirname, '../Vibeforce_Flow_OS_Broschuere.pdf');

  console.log(`Generating PDF via Playwright...`);
  console.log(`Source: ${htmlPath}`);
  console.log(`Output: ${outputPath}`);

  let browser;
  try {
    browser = await chromium.launch({
      channel: 'msedge',
      headless: true
    });
  } catch {
    try {
      browser = await chromium.launch({
        channel: 'chrome',
        headless: true
      });
    } catch {
      browser = await chromium.launch({ headless: true });
    }
  }

  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '12mm',
      right: '12mm',
      bottom: '12mm',
      left: '12mm'
    }
  });

  await browser.close();
  console.log(`🎉 PDF erfolgreich erstellt: ${outputPath}`);
}

main().catch(err => {
  console.error('Playwright PDF Error:', err);
  process.exit(1);
});
