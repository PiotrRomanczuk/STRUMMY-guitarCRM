/**
 * Phase 2 — teacher/dashboard-widgets
 *
 * The `/dashboard` home page renders its primary widgets without crash.
 * Each widget hits a dashboard action under the hood; this spec catches
 * regressions where a widget hard-crashes due to a stale query.
 *
 * @tags @teacher @dashboard @unbreakable
 */

import { test, expect } from '../../fixtures';

test.describe(
  'Teacher — dashboard widgets',
  { tag: ['@teacher', '@dashboard', '@unbreakable'] },
  () => {
    test.beforeEach(async ({ loginAs }) => {
      await loginAs('teacher');
    });

    test('dashboard renders without crashing on first load', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      await expect(page.locator('body')).toBeVisible();
      // No global error boundary banner should be visible.
      const errorBoundary = page.getByText(/something went wrong|application error/i);
      expect(await errorBoundary.count()).toBe(0);
    });

    test('the upcoming-lessons widget or its empty state is present', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      const widget = page.getByText(/upcoming lesson|next lesson|no lessons|no upcoming/i).first();
      await expect(widget).toBeVisible({ timeout: 10000 });
    });
  }
);
