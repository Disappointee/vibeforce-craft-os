import fs from 'fs';
import path from 'path';

const brainDir = 'C:\\Users\\kasan\\.gemini\\antigravity\\brain\\ce43276d-2a56-4faa-92d5-dee1cbbb9663';
const targetDir = 'C:\\Users\\kasan\\Desktop\\AlphaExplorer\\K.I. Takeover\\Neu\\Vibeforce One\\vibeforce-flow-os\\public\\logos';
const frontendPublic = 'C:\\Users\\kasan\\Desktop\\AlphaExplorer\\K.I. Takeover\\Neu\\Vibeforce One\\vibeforce-flow-os\\frontend\\public\\logos';

if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
if (!fs.existsSync(frontendPublic)) fs.mkdirSync(frontendPublic, { recursive: true });

const files = [
  { src: 'vibeforce_logo_prism_1786998177394.jpg', name: 'konzept_1_prism.jpg' },
  { src: 'vibeforce_logo_icon_1786998195336.jpg', name: 'konzept_2_app_icon.jpg' },
  { src: 'vibeforce_logo_minimal_1786998212722.jpg', name: 'konzept_3_faceted_white.jpg' },
  { src: 'vibeforce_logo_linear_1786998224628.jpg', name: 'konzept_4_linear_ribbon.jpg' },
];

for (const f of files) {
  const srcPath = path.join(brainDir, f.src);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, path.join(targetDir, f.name));
    fs.copyFileSync(srcPath, path.join(frontendPublic, f.name));
    console.log(`Copied ${f.name}`);
  }
}
