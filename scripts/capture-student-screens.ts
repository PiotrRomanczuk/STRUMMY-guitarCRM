import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'mobile-redesign', 'screenshots');

const ACCOUNTS = [
  { role: 'student', email: 'student@example.com', password: 'test123_student' },
  { role: 'teacher', email: 'teacher@example.com', password: 'test123_teacher' },
  { role: 'admin', email: 'p.romanczuk@gmail.com', password: 'test123_admin' },
];

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

  for (const account of ACCOUNTS) {
    console.log(`\n=== Capturing as ${account.role} ===`);
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login
    console.log(`Logging in as ${account.email}...`);
    await page.goto(`${BASE_URL}/sign-in`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"], input[name="email"]', account.email);
    await page.fill('input[type="password"], input[name="password"]', account.password);
    await page.click('button[type="submit"]');

    try {
      await page.waitForURL('**/dashboard**', { timeout: 15000 });
      console.log(`Logged in! Current URL: ${page.url()}`);
    } catch {
      console.error(`Login failed for ${account.role}, skipping...`);
      await context.close();
      continue;
    }

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const pg of PAGES) {
        const filename = `${account.role}-${pg.name}-${viewport.name}.png`;
        console.log(`  Capturing ${filename}...`);

        await page.goto(`${BASE_URL}${pg.path}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        await page.screenshot({
          path: path.join(OUTPUT_DIR, filename),
          fullPage: true,
        });
        console.log(`    Saved ${filename}`);
      }
    }

    await context.close();
  }

  await browser.close();
  console.log(`\nDone! Screenshots saved to ${OUTPUT_DIR}`);
}

main().catch(console.error);
