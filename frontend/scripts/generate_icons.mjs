import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
mkdirSync(path.resolve(__dirname, '../public/icons'), { recursive: true });

const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(245,158,11,0.2)"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
    <radialGradient id="bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0A1535"/>
      <stop offset="100%" stop-color="#020818"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" fill="url(#bg)"/>

  <!-- Glow -->
  <circle cx="256" cy="256" r="240" fill="url(#glow)"/>

  <!-- Outer hex -->
  <polygon points="256,32 464,148 464,364 256,480 48,364 48,148"
    fill="none" stroke="#F59E0B" stroke-width="6" opacity="0.6"/>

  <!-- Inner hex -->
  <polygon points="256,72 424,168 424,344 256,440 88,344 88,168"
    fill="none" stroke="#F59E0B" stroke-width="2" opacity="0.2"/>

  <!-- Subtle inner fill -->
  <polygon points="256,72 424,168 424,344 256,440 88,344 88,168"
    fill="rgba(245,158,11,0.03)"/>

  <!-- Corner dots on hex points -->
  <circle cx="256" cy="32" r="5" fill="#F59E0B" opacity="0.8"/>
  <circle cx="464" cy="148" r="5" fill="#F59E0B" opacity="0.8"/>
  <circle cx="464" cy="364" r="5" fill="#F59E0B" opacity="0.8"/>
  <circle cx="256" cy="480" r="5" fill="#F59E0B" opacity="0.8"/>
  <circle cx="48" cy="364" r="5" fill="#F59E0B" opacity="0.8"/>
  <circle cx="48" cy="148" r="5" fill="#F59E0B" opacity="0.8"/>

  <!-- Divider line above LUXURY text -->
  <line x1="156" y1="360" x2="356" y2="360" stroke="rgba(245,158,11,0.3)" stroke-width="1.5"/>

  <!-- S letter -->
  <text x="256" y="340" text-anchor="middle" font-size="260" font-weight="700"
    fill="#F4F4F2" font-family="Georgia,serif" opacity="0.95">S</text>

  <!-- LUXURY text -->
  <text x="256" y="410" text-anchor="middle" font-size="48" fill="#F59E0B"
    font-family="Arial,sans-serif" letter-spacing="20" font-weight="400"
    opacity="0.7">LUXURY</text>
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
