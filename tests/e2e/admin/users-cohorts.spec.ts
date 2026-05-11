/**
 * Phase 4 — admin/users-cohorts
 *
 * Admin sees the full users list (no RLS-side filter) and the cohorts
 * management page renders.
 *
 * @tags @admin @cohorts @unbreakable
 */

import { test, expect } from '../../fixtures';

test.describe('Admin — users + cohorts', { tag: ['@admin', '@cohorts', '@unbreakable'] }, () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('admin');
  });

  test('users page lists at least the seeded accounts', async ({ page }) => {
    await page.goto('/dashboard/users', { waitUntil: 'networkidle' });
    const rows = page.locator('a[href*="/dashboard/users/"]');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('cohorts page renders', async ({ page }) => {
    await page.goto('/dashboard/cohorts', { waitUntil: 'networkidle' });
    const content = page.getByText(/cohort|group|class/i).first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });
});
