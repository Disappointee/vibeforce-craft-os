import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generatePDF() {
  const htmlPath = path.resolve(__dirname, '../VIBEFORCE_FLOW_OS_BROSCHUERE.html');
  const outputPath = path.resolve(__dirname, '../Vibeforce_Flow_OS_Broschuere.pdf');

  console.log(`Loading HTML from: ${htmlPath}`);
  console.log(`Generating PDF to: ${outputPath}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '15mm',
      right: '15mm',
      bottom: '15mm',
      left: '15mm'
    }
  });

  await browser.close();
  console.log('✅ PDF successfully generated:', outputPath);
}

generatePDF().catch(err => {
  console.error('PDF Generation Error:', err);
  process.exit(1);
});
