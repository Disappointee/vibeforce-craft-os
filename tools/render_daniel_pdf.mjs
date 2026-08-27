import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const htmlPath = path.resolve(__dirname, '../VIBEFORCE_FLOW_OS_ANSCHREIBEN_DANIEL.html');
  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');

  const desktopPdf = 'C:\\Users\\kasan\\Desktop\\Vibeforce_Flow_OS_Anschreiben_Daniel.pdf';
  const projectPdf = path.resolve(__dirname, '../Vibeforce_Flow_OS_Anschreiben_Daniel.pdf');

  console.log('Generating PDF for Daniel via Playwright...');
  console.log('Source:', htmlPath);

  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  } catch (e) {
    browser = await chromium.launch({ headless: true });
  }

  const page = await browser.newPage();
  await page.goto(fileUrl, { waitUntil: 'networkidle' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
  });

  fs.writeFileSync(desktopPdf, pdfBuffer);
  fs.writeFileSync(projectPdf, pdfBuffer);

  await browser.close();

  console.log('🎉 PDF für Daniel erfolgreich gespeichert:');
  console.log('  - ' + desktopPdf);
  console.log('  - ' + projectPdf);
}

main().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
