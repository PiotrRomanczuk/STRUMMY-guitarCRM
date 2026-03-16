import { test } from '@playwright/test';
import { login, TEST_CREDENTIALS } from '../tests/helpers/auth';
import type { Page } from '@playwright/test';

const OUT = 'docs/mobile-redesign/screenshots';

const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
};

test.setTimeout(120_000);

async function setV2Cookie(page: Page) {
  await page.context().addCookies([{
    name: 'strummy-ui-version',
    value: 'v2',
    domain: 'localhost',
    path: '/',
  }]);
}

async function waitForContent(page: Page, opts?: { waitForSelector?: string }) {
  await page.waitForLoadState('networkidle');
  // If a specific selector is provided, wait for it to appear (indicates data loaded)
  if (opts?.waitForSelector) {
    try {
      await page.waitForSelector(opts.waitForSelector, { timeout: 15000 });
    } catch {
      // Data may not exist; continue with whatever is visible
    }
  }
  // Wait for skeletons/loading to disappear
  try {
    await page.waitForFunction(
      () => document.querySelectorAll('.animate-pulse').length === 0,
      { timeout: 10000 }
    );
  } catch {
    // Some pages may legitimately have pulse elements; continue
  }
  // Small settle time for animations
  await page.waitForTimeout(500);
}

async function screenshot(page: Page, name: string, opts?: { waitForSelector?: string }) {
  await waitForContent(page, opts);
  // Viewport-only screenshot (no fullPage) to avoid capturing 100K+ px pages
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
}

// Use a single browser context shared across all tests to avoid rate-limiting
// by reusing one login session
test.describe.serial('Wave 3 — v2 Visual Verification', () => {
  let context: import('@playwright/test').BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    await login(page, TEST_CREDENTIALS.admin);
    await setV2Cookie(page);
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('Lessons — mobile + tablet + desktop', async () => {
    for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
      await page.setViewportSize(vp);
      await page.goto('/dashboard/lessons', { waitUntil: 'networkidle' });
      await screenshot(page, `v2-lessons-list-${vpName}`);
    }

    // Dark mode mobile
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/dashboard/lessons', { waitUntil: 'networkidle' });
    await screenshot(page, `v2-lessons-list-mobile-dark`);
    await page.emulateMedia({ colorScheme: 'light' });
  });

  test('Songs — mobile + tablet + desktop', async () => {
    // Songs use client-side fetch (useSongList) — may show skeleton in E2E
    for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
      await page.setViewportSize(vp);
      await page.goto('/dashboard/songs', { waitUntil: 'networkidle' });
      await screenshot(page, `v2-songs-list-${vpName}`);
    }

    // Dark mode mobile
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/dashboard/songs', { waitUntil: 'networkidle' });
    await screenshot(page, `v2-songs-list-mobile-dark`);
    await page.emulateMedia({ colorScheme: 'light' });
  });

  test('Users — mobile + tablet + desktop', async () => {
    for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
      await page.setViewportSize(vp);
      await page.goto('/dashboard/users', { waitUntil: 'networkidle' });
      await screenshot(page, `v2-users-list-${vpName}`);
    }

    // Dark mode mobile
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/dashboard/users', { waitUntil: 'networkidle' });
    await screenshot(page, `v2-users-list-mobile-dark`);
    await page.emulateMedia({ colorScheme: 'light' });
  });

  test('New Lesson form — mobile', async () => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/dashboard/lessons/new', { waitUntil: 'networkidle' });
    await screenshot(page, `v2-lessons-form-mobile`);
  });

  test('New Song form — mobile', async () => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/dashboard/songs/new', { waitUntil: 'networkidle' });
    await screenshot(page, `v2-songs-form-mobile`);
  });
});
