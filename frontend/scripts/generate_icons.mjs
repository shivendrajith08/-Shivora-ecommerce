import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
mkdirSync(path.resolve(__dirname, '../public/icons'), { recursive: true });

const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#020818"/>
  <polygon points="256,40 440,140 440,372 256,472 72,372 72,140" fill="none" stroke="#F59E0B" stroke-width="12"/>
  <polygon points="256,80 400,165 400,347 256,432 112,347 112,165" fill="none" stroke="#F59E0B" stroke-width="4" opacity="0.4"/>
  <text x="256" y="300" text-anchor="middle" font-size="200" font-weight="700" fill="#F59E0B" font-family="Georgia,serif">S</text>
</svg>`;

import { Buffer } from 'buffer';
const svgBuffer = Buffer.from(svgIcon);

for (const size of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(path.resolve(__dirname, `../public/icons/icon-${size}x${size}.png`));
  console.log(`Generated ${size}x${size} icon`);
}
console.log('All icons generated!');
