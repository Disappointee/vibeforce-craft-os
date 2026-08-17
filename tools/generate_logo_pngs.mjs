import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const svgPath = path.resolve(__dirname, '../frontend/public/logo-vfos.svg');
  const svgContent = fs.readFileSync(svgPath, 'utf-8');

  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  } catch {
    browser = await chromium.launch({ headless: true });
  }

  const page = await browser.newPage({ viewport: { width: 512, height: 512, deviceScaleFactor: 2 } });
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;background:transparent;display:flex;align-items:center;justify-content:center;width:512px;height:512px;">${svgContent}</body></html>`);

  const pngBuffer = await page.screenshot({ omitBackground: true, type: 'png' });

  // Save to frontend public assets
  const publicDir = path.resolve(__dirname, '../frontend/public');
  fs.writeFileSync(path.join(publicDir, 'icon-vfos.png'), pngBuffer);
  fs.writeFileSync(path.join(publicDir, 'logo.png'), pngBuffer);
  fs.writeFileSync(path.join(publicDir, 'icon-kos.png'), pngBuffer);

  // Also copy to root public if present
  const rootPublicDir = path.resolve(__dirname, '../public');
  if (fs.existsSync(rootPublicDir)) {
    fs.writeFileSync(path.join(rootPublicDir, 'icon-vfos.png'), pngBuffer);
    fs.writeFileSync(path.join(rootPublicDir, 'logo.png'), pngBuffer);
  }

  await browser.close();
  console.log('✅ High-res PNG logo assets rendered successfully!');
}

main().catch(err => {
  console.error('Logo render error:', err);
  process.exit(1);
});
