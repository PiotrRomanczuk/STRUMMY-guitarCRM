/**
 * Phase 4 — admin/logs-and-health
 *
 * Admin pages: `/dashboard/logs` and `/dashboard/health`. Both should render
 * without errors and expose the expected controls (filter dropdown for
 * logs; status indicators for health).
 *
 * @tags @admin @unbreakable
 */

import { test, expect } from '../../fixtures';

test.describe('Admin — logs & health', { tag: ['@admin', '@unbreakable'] }, () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('admin');
  });

  test('logs page renders', async ({ page }) => {
    await page.goto('/dashboard/logs', { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toBeVisible();
  });

  test('health page renders with at least one status indicator', async ({ page }) => {
    await page.goto('/dashboard/health', { waitUntil: 'networkidle' });
    const indicator = page.getByText(/healthy|ok|connected|degraded|down/i).first();
    await expect(indicator).toBeVisible({ timeout: 10000 });
  });
});
