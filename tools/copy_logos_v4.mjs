import fs from 'fs';
import path from 'path';

const brainDir = 'C:\\Users\\kasan\\.gemini\\antigravity\\brain\\ce43276d-2a56-4faa-92d5-dee1cbbb9663';
const targetDir = 'C:\\Users\\kasan\\Desktop\\AlphaExplorer\\K.I. Takeover\\Neu\\Vibeforce One\\vibeforce-flow-os\\public\\logos';
const frontendPublic = 'C:\\Users\\kasan\\Desktop\\AlphaExplorer\\K.I. Takeover\\Neu\\Vibeforce One\\vibeforce-flow-os\\frontend\\public\\logos';

const files = [
  { src: 'vf_v4_pure_flat_1786998330448.jpg', name: 'konzept_4_1_dual_wave.jpg' },
  { src: 'vf_v4_glass_depth_1786998343237.jpg', name: 'konzept_4_2_glass_depth.jpg' },
  { src: 'vf_v4_kinetic_slash_1786998355631.jpg', name: 'konzept_4_3_kinetic_slash.jpg' },
  { src: 'vf_v4_infinity_wave_1786998368434.jpg', name: 'konzept_4_4_infinity_wave.jpg' },
];

for (const f of files) {
  const srcPath = path.join(brainDir, f.src);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, path.join(targetDir, f.name));
    fs.copyFileSync(srcPath, path.join(frontendPublic, f.name));
    console.log(`Copied ${f.name}`);
  }
}
