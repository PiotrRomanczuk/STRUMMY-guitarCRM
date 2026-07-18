import { test, expect } from '../../fixtures';
import { adminClient, getStudentId } from '../../helpers/seed-ids';

/**
 * IDA-3 (docs/app-blueprint/01-identity-access.md, Tranche 2) — re-mounted
 * admin lockout widget.
 *
 * Seeds a locked profile (failed_login_attempts + locked_until in the
 * future), verifies the admin dashboard lists it and Unlock clears it, and
 * verifies a non-admin gets nothing extra.
 */

let lockedStudentId: string | null = null;
let originalState: { failed_login_attempts: number; locked_until: string | null } | null = null;

test.describe.configure({ mode: 'serial' });

test.describe('Admin lockout widget', { tag: ['@admin'] }, () => {
  test.beforeAll(async () => {
    const db = adminClient();
    lockedStudentId = await getStudentId(db);

    const { data: before } = await db
      .from('profiles')
      .select('failed_login_attempts, locked_until')
      .eq('id', lockedStudentId)
      .single();
    originalState = before;

    const lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await db
      .from('profiles')
      .update({ failed_login_attempts: 5, locked_until: lockedUntil })
      .eq('id', lockedStudentId);
  });

  test.afterAll(async () => {
    if (!lockedStudentId) return;
    const db = adminClient();
    await db
      .from('profiles')
      .update({
        failed_login_attempts: originalState?.failed_login_attempts ?? 0,
        locked_until: originalState?.locked_until ?? null,
      })
      .eq('id', lockedStudentId);
  });

  test('admin dashboard lists the locked account and Unlock clears it', async ({
    page,
    loginAs,
  }) => {
    test.skip(!lockedStudentId, 'Seed not created in beforeAll');
    await loginAs('admin');

    await page.goto('/dashboard?view=admin');
    await page.waitForLoadState('networkidle');

    const row = page.getByTestId(`locked-account-${lockedStudentId}`);
    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(row).toContainText('5 failed attempts');

    await page.getByTestId(`unlock-account-${lockedStudentId}`).click();
    await expect(row).not.toBeVisible({ timeout: 10_000 });

    const db = adminClient();
    await expect
      .poll(
        async () => {
          const { data } = await db
            .from('profiles')
            .select('failed_login_attempts, locked_until')
            .eq('id', lockedStudentId as string)
            .single();
          return data;
        },
        { timeout: 10_000 }
      )
      .toMatchObject({ failed_login_attempts: 0, locked_until: null });
  });

  test('non-admin dashboard has no locked-accounts widget', async ({ page, loginAs }) => {
    await loginAs('teacher');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('locked-accounts-list')).toHaveCount(0);
  });
});
