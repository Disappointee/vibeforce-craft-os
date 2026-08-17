import fs from 'fs';
import path from 'path';

const brainDir = 'C:\\Users\\kasan\\.gemini\\antigravity\\brain\\ce43276d-2a56-4faa-92d5-dee1cbbb9663';
const masterImg = path.join(brainDir, 'vf_v4_infinity_wave_1786998368434.jpg');

const desktopOfficialPng = 'C:\\Users\\kasan\\Desktop\\Vibeforce_Flow_OS_Logo_Official.png';
const desktopOfficialJpg = 'C:\\Users\\kasan\\Desktop\\Vibeforce_Flow_OS_Logo_Official.jpg';

if (fs.existsSync(masterImg)) {
  fs.copyFileSync(masterImg, desktopOfficialPng);
  fs.copyFileSync(masterImg, desktopOfficialJpg);
  console.log('✅ Master logo image copied to Desktop!');
} else {
  console.error('Master image not found at', masterImg);
}

// Copy to frontend public
const frontendPublic = 'C:\\Users\\kasan\\Desktop\\AlphaExplorer\\K.I. Takeover\\Neu\\Vibeforce One\\vibeforce-flow-os\\frontend\\public';
fs.copyFileSync(masterImg, path.join(frontendPublic, 'logo-vfos-master.png'));
fs.copyFileSync(masterImg, path.join(frontendPublic, 'icon-vfos.png'));
fs.copyFileSync(masterImg, path.join(frontendPublic, 'logo.png'));
console.log('✅ Master logo synced to frontend/public!');
