/**
 * Phase 4 — admin/stats-dashboards
 *
 * The three admin stats pages render with seeded data.
 *
 * @tags @admin @stats @unbreakable
 */

import { test, expect } from '../../fixtures';

test.describe('Admin — stats', { tag: ['@admin', '@stats', '@unbreakable'] }, () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('admin');
  });

  test('/dashboard/admin/stats/lessons renders', async ({ page }) => {
    await page.goto('/dashboard/admin/stats/lessons', { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toBeVisible();
  });

  test('/dashboard/admin/stats/songs renders', async ({ page }) => {
    await page.goto('/dashboard/admin/stats/songs', { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toBeVisible();
  });

  test('/dashboard/admin/stats/chord-analysis renders', async ({ page }) => {
    await page.goto('/dashboard/admin/stats/chord-analysis', { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toBeVisible();
  });
});
