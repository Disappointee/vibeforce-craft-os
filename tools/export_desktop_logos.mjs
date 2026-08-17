import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const svgPath = path.resolve(__dirname, '../frontend/public/logo-vfos.svg');
  const svgContent = fs.readFileSync(svgPath, 'utf-8');

  const desktopSvgPath = 'C:\\Users\\kasan\\Desktop\\Vibeforce_Flow_OS_Logo_4.4.svg';
  const desktopPngPath = 'C:\\Users\\kasan\\Desktop\\Vibeforce_Flow_OS_Logo_4.4_4K.png';
  const desktopIconPath = 'C:\\Users\\kasan\\Desktop\\Vibeforce_Flow_OS_App_Icon.png';

  // 1. Write SVG to Desktop
  fs.writeFileSync(desktopSvgPath, svgContent);
  console.log(`✅ Vector SVG saved to Desktop: ${desktopSvgPath}`);

  // 2. Launch browser to render 4K PNG
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  } catch {
    browser = await chromium.launch({ headless: true });
  }

  // Render transparent 4K logo (2048 x 2048 @ 2x scale = 4096px)
  const page = await browser.newPage({ viewport: { width: 1024, height: 1024, deviceScaleFactor: 4 } });
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;background:transparent;display:flex;align-items:center;justify-content:center;width:1024px;height:1024px;">${svgContent}</body></html>`);
  const png4kBuffer = await page.screenshot({ omitBackground: true, type: 'png' });
  fs.writeFileSync(desktopPngPath, png4kBuffer);
  console.log(`✅ 4K High-Res PNG saved to Desktop: ${desktopPngPath}`);

  // Render App Icon badge (Squircle container with logo)
  const iconPage = await browser.newPage({ viewport: { width: 512, height: 512, deviceScaleFactor: 2 } });
  const iconHtml = `<!DOCTYPE html>
  <html>
  <head>
    <style>
      body { margin:0; padding:0; background: transparent; display: flex; align-items: center; justify-content: center; width: 512px; height: 512px; }
      .icon-box {
        width: 440px;
        height: 440px;
        background: #090d16;
        border-radius: 96px;
        border: 2px solid rgba(59, 130, 246, 0.3);
        box-shadow: 0 20px 40px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        box-sizing: border-box;
      }
    </style>
  </head>
  <body>
    <div class="icon-box">
      ${svgContent}
    </div>
  </body>
  </html>`;

  await iconPage.setContent(iconHtml);
  const iconBuffer = await iconPage.screenshot({ omitBackground: true, type: 'png' });
  fs.writeFileSync(desktopIconPath, iconBuffer);

  // Also update public assets
  const publicDir = path.resolve(__dirname, '../frontend/public');
  fs.writeFileSync(path.join(publicDir, 'icon-vfos.png'), iconBuffer);
  fs.writeFileSync(path.join(publicDir, 'logo.png'), iconBuffer);
  fs.writeFileSync(path.join(publicDir, 'icon-kos.png'), iconBuffer);

  console.log(`✅ App Icon PNG saved to Desktop: ${desktopIconPath}`);
  await browser.close();
}

main().catch(err => {
  console.error('Export Error:', err);
  process.exit(1);
});
