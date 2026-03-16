import type { Page } from '@playwright/test';

export const SCREENSHOT_DIR = 'docs/mobile-redesign/screenshots/v2-tests';

export async function setV2Cookie(page: Page) {
  await page.context().addCookies([
    {
      name: 'strummy-ui-version',
      value: 'v2',
      domain: 'localhost',
      path: '/',
    },
  ]);
}

export async function waitForV2Content(page: Page, selector?: string) {
  await page.waitForLoadState('networkidle');
  if (selector) {
    try {
      await page.waitForSelector(selector, { timeout: 15_000 });
    } catch {
      // Data may not exist; continue
    }
  }
  // Wait for skeletons to disappear
  try {
    await page.waitForFunction(
      () => document.querySelectorAll('.animate-pulse').length === 0,
      { timeout: 10_000 }
    );
  } catch {
    // Some pages may not have skeletons
  }
  // Small settle time for animations
  await page.waitForTimeout(500);
}

export async function screenshotPage(
  page: Page,
  name: string,
  opts?: { fullPage?: boolean }
) {
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/${name}.png`,
    fullPage: opts?.fullPage ?? false,
  });
}
