import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const masterImgPath = 'C:\\Users\\kasan\\Desktop\\Vibeforce_Flow_OS_Logo_Official.png';
  const imgBase64 = fs.readFileSync(masterImgPath).toString('base64');
  const transparentPngPath = 'C:\\Users\\kasan\\Desktop\\Vibeforce_Flow_OS_Logo_Transparent.png';

  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  } catch {
    browser = await chromium.launch({ headless: true });
  }

  const page = await browser.newPage({ viewport: { width: 1024, height: 1024, deviceScaleFactor: 2 } });
  
  const html = `<!DOCTYPE html>
  <html>
  <body style="margin:0;padding:0;background:transparent;">
    <canvas id="c" width="1024" height="1024"></canvas>
    <script>
      const img = new Image();
      img.onload = () => {
        const canvas = document.getElementById('c');
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 1024, 1024);
        const imgData = ctx.getImageData(0, 0, 1024, 1024);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i+1], b = d[i+2];
          // If pixel is white / near-white background
          if (r > 240 && g > 240 && b > 240) {
            const brightness = (r + g + b) / 3;
            if (brightness > 250) {
              d[i+3] = 0; // pure transparent
            } else {
              // smooth edge feathering
              d[i+3] = Math.round((255 - brightness) * 25.5);
            }
          }
        }
        ctx.putImageData(imgData, 0, 0);
        window.__DONE = true;
      };
      img.src = 'data:image/png;base64,${imgBase64}';
    </script>
  </body>
  </html>`;

  await page.setContent(html);
  await page.waitForFunction(() => window.__DONE === true);

  const canvas = await page.$('#c');
  const buffer = await canvas.screenshot({ omitBackground: true, type: 'png' });
  fs.writeFileSync(transparentPngPath, buffer);
  
  // Also save to frontend public
  const frontendPublic = path.resolve(__dirname, '../frontend/public');
  fs.writeFileSync(path.join(frontendPublic, 'logo-vfos-transparent.png'), buffer);

  console.log(`✅ Transparent master PNG created: ${transparentPngPath}`);
  await browser.close();
}

main().catch(err => {
  console.error('Transparent generation error:', err);
  process.exit(1);
});
