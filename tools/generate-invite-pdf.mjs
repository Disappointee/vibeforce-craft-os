import { launch } from 'puppeteer';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(__dirname, 'invite-hotze.html');
const pdfPath = resolve('C:\\Users\\kasan\\Desktop', 'Einladung_Frau_Kalb.pdf');

const html = readFileSync(htmlPath, 'utf-8');

const browser = await launch({ headless: true });
const page = await browser.newPage();

await page.setContent(html, {
  waitUntil: 'networkidle0',
  timeout: 30000,
});

await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  displayHeaderFooter: false,
  preferCSSPageSize: true,
});

await browser.close();

console.log(`PDF gespeichert: ${pdfPath}`);
