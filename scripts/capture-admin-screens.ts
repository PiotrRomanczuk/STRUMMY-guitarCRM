import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'mobile-redesign', 'screenshots');

const PAGES = [
  { name: 'dashboard', path: '/dashboard' },
  { name: 'songs', path: '/dashboard/songs' },
  { name: 'lessons', path: '/dashboard/lessons' },
  { name: 'assignments', path: '/dashboard/assignments' },
  { name: 'repertoire', path: '/dashboard/repertoire' },
  { name: 'stats', path: '/dashboard/stats' },
  { name: 'settings', path: '/dashboard/settings' },
  { name: 'fretboard', path: '/dashboard/fretboard' },
  { name: 'theory', path: '/dashboard/theory' },
];

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
];

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Logging in as admin...');
  await page.goto(`${BASE_URL}/sign-in`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  await page.fill('input[type="email"], input[name="email"]', 'p.romanczuk@gmail.com');
  await page.fill('input[type="password"], input[name="password"]', 'test123_admin');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard**', { timeout: 20000 });
  console.log(`Logged in! Current URL: ${page.url()}`);

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    for (const pg of PAGES) {
      const filename = `admin-${pg.name}-${viewport.name}.png`;
      console.log(`  Capturing ${filename}...`);

      await page.goto(`${BASE_URL}${pg.path}`, { waitUntil: 'domcontentloaded' });
      // Wait for data to render (longer for admin — heavy pages)
      await page.waitForTimeout(5000);

      await page.screenshot({
        path: path.join(OUTPUT_DIR, filename),
        fullPage: true,
      });
      console.log(`    Saved ${filename}`);
    }
  }

  await browser.close();
  console.log(`\nDone! Admin screenshots saved to ${OUTPUT_DIR}`);
}

main().catch(console.error);
