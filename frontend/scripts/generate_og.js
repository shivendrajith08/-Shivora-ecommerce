import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  const filePath = 'file://' + path.resolve(__dirname, '../public/og-image.html');
  await page.goto(filePath, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.resolve(__dirname, '../public/og-image.jpg'), type: 'jpeg', quality: 95 });
  await browser.close();
  console.log('OG image saved to frontend/public/og-image.jpg');
})();
