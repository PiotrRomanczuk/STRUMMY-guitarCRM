import { test, expect } from '../../fixtures';
import { adminClient } from '../../helpers/seed-ids';

/**
 * ADM-1 (docs/app-blueprint/10-admin-observability.md, Tranche 2) —
 * system_logs viewer replacing the /dashboard/logs placeholder.
 */

let seededLogId: string | null = null;
const MARKER = `e2e-marker-${Date.now()}`;

test.describe.configure({ mode: 'serial' });

test.describe('System logs viewer', { tag: ['@admin'] }, () => {
  test.beforeAll(async () => {
    const db = adminClient();
    const { data, error } = await db
      .from('system_logs')
      .insert({
        level: 'error',
        prefix: 'e2e-test',
        message: MARKER,
        occurred_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (error) throw new Error(`seed system_logs failed: ${error.message}`);
    seededLogId = data?.id ?? null;
  });

  test.afterAll(async () => {
    if (!seededLogId) return;
    const db = adminClient();
    await db.from('system_logs').delete().eq('id', seededLogId);
  });

  test('admin sees the seeded error row', async ({ page, loginAs }) => {
    test.skip(!seededLogId, 'Seed not created in beforeAll');
    await loginAs('admin');

    await page.goto('/dashboard/logs');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'System logs' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(MARKER)).toBeVisible();
  });

  test('level filter narrows results', async ({ page, loginAs }) => {
    test.skip(!seededLogId, 'Seed not created in beforeAll');
    await loginAs('admin');

    await page.goto('/dashboard/logs?level=error&prefix=e2e-test');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(MARKER)).toBeVisible({ timeout: 15_000 });

    await page.goto('/dashboard/logs?level=debug&prefix=e2e-test');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('No log entries match these filters.')).toBeVisible({
      timeout: 15_000,
    });
  });

  test('teacher is redirected away from /dashboard/logs', async ({ page, loginAs }) => {
    await loginAs('teacher');
    await page.goto('/dashboard/logs');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('student is redirected away from /dashboard/logs', async ({ page, loginAs }) => {
    await loginAs('student');
    await page.goto('/dashboard/logs');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
