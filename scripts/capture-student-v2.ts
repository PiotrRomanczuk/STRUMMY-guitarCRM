import { chromium } from 'playwright';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const OUT = path.join('/Users/piotr/Desktop/MainCV/guitar-crm/docs/mobile-redesign/screenshots');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login as student
  await page.goto(`${BASE_URL}/sign-in`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"], input[name="email"]', 'student@example.com');
  await page.fill('input[type="password"], input[name="password"]', 'test123_student');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });

  // Set v2 cookie
  await context.addCookies([{
    name: 'strummy-ui-version',
    value: 'v2',
    domain: 'localhost',
    path: '/',
  }]);

  // Capture mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(OUT, 'student-dashboard-v2-mobile.png'), fullPage: true });
  console.log('Saved student-dashboard-v2-mobile.png');

  // Capture desktop
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(OUT, 'student-dashboard-v2-desktop.png'), fullPage: true });
  console.log('Saved student-dashboard-v2-desktop.png');

  await browser.close();
  console.log('Done!');
}

main().catch(console.error);
