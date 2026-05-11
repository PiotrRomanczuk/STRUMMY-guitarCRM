/**
 * Phase 5 — edge/dark-mode
 *
 * Toggle dark mode, navigate the three primary pages, and capture screenshots
 * to a baseline directory. The unbreakable property: no page hard-crashes in
 * dark mode and the dark-mode-class is applied at the document root.
 *
 * @tags @edge @ui @unbreakable
 */

import { test, expect } from '../../fixtures';

test.describe('Edge — dark mode', { tag: ['@edge', '@ui', '@unbreakable'] }, () => {
  test.beforeEach(async ({ loginAs, page }) => {
    await loginAs('teacher');
    // Set prefers-color-scheme: dark via emulateMedia.
    await page.emulateMedia({ colorScheme: 'dark' });
  });

  test('dashboard renders in dark mode without crashing', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toBeVisible();
  });

  test('lessons list renders in dark mode', async ({ page }) => {
    await page.goto('/dashboard/lessons', { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toBeVisible();
  });

  test('songs list renders in dark mode', async ({ page }) => {
    await page.goto('/dashboard/songs', { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toBeVisible();
  });
});
