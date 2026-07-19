import { test, expect } from '../../fixtures';

/**
 * ADM-3 (docs/app-blueprint/10-admin-observability.md, Tranche 5) — mount
 * the debug dashboard. The panel components (ServicesGrid, CronStatusPanel,
 * AIProviderPanel, AIQueuePanel, AIGenerationsPanel) already existed and
 * were fully wired in DebugDashboardClient.tsx — only page.tsx was a
 * "Coming soon" stub that never rendered it. No new UI was built here.
 */
test.describe('Admin debug dashboard', { tag: ['@admin'] }, () => {
  test('admin sees live service + AI infrastructure status', async ({ page, loginAs }) => {
    await loginAs('admin');

    await page.goto('/dashboard/admin/debug');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'System Debug' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('heading', { name: 'API Services' })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('teacher is redirected away', async ({ page, loginAs }) => {
    await loginAs('teacher');
    await page.goto('/dashboard/admin/debug');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
