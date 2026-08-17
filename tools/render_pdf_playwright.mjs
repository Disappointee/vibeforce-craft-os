import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const htmlPath = path.resolve(__dirname, '../VIBEFORCE_FLOW_OS_BROSCHUERE.html');
  const projectPdfPath = path.resolve(__dirname, '../Vibeforce_Flow_OS_Broschuere.pdf');
  const desktopPdfPath = 'C:\\Users\\kasan\\Desktop\\Vibeforce_Flow_OS_Broschuere.pdf';
  const desktopJanekPdfPath = 'C:\\Users\\kasan\\Desktop\\Vibeforce_Flow_OS_Broschuere_Janek.pdf';

  console.log(`Generating PDF via Playwright...`);
  console.log(`Source: ${htmlPath}`);

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

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '10mm',
      right: '10mm',
      bottom: '10mm',
      left: '10mm'
    }
  });

  // Save to project and Desktop
  fs.writeFileSync(projectPdfPath, pdfBuffer);
  fs.writeFileSync(desktopPdfPath, pdfBuffer);
  fs.writeFileSync(desktopJanekPdfPath, pdfBuffer);

  await browser.close();
  console.log(`🎉 PDF erfolgreich auf dem Desktop gespeichert:`);
  console.log(`  - ${desktopPdfPath}`);
  console.log(`  - ${desktopJanekPdfPath}`);
  console.log(`  - ${projectPdfPath}`);
}

main().catch(err => {
  console.error('Playwright PDF Error:', err);
  process.exit(1);
});
