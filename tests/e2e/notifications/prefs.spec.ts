import { test, expect } from '../../fixtures';
import { adminClient, getAdminId, getStudentId } from '../../helpers/seed-ids';

/**
 * Notification Preferences E2E Tests (A10.2 / B8.2)
 *
 * Journeys tested:
 *  A10.2/B8.2 — Toggle per-type notification preference off → on
 *
 * Per-type toggles only render when rows exist in notification_preferences.
 * We seed them in beforeAll and clean up in afterAll.
 */

let ADMIN_ID: string;
let STUDENT_ID: string;

const seededIds: string[] = [];

test.describe.configure({ mode: 'serial' });

test.describe(
  'Notification Preferences',
  { tag: ['@admin', '@notifications', '@settings'] },
  () => {
    test.beforeAll(async () => {
      const db = adminClient();
      [ADMIN_ID, STUDENT_ID] = await Promise.all([getAdminId(db), getStudentId(db)]);

      // Ensure admin has lesson_reminder_24h pref (upsert to avoid duplicate)
      const { data: adminData } = await db
        .from('notification_preferences')
        .upsert([{ user_id: ADMIN_ID, notification_type: 'lesson_reminder_24h', enabled: true }], {
          onConflict: 'user_id,notification_type',
          ignoreDuplicates: false,
        })
        .select('id');
      if (adminData) seededIds.push(...adminData.map((r) => r.id));

      // Ensure student has assignment_created pref
      const { data: studentData } = await db
        .from('notification_preferences')
        .upsert([{ user_id: STUDENT_ID, notification_type: 'assignment_created', enabled: true }], {
          onConflict: 'user_id,notification_type',
          ignoreDuplicates: false,
        })
        .select('id');
      if (studentData) seededIds.push(...studentData.map((r) => r.id));
    });

    test.afterAll(async () => {
      const db = adminClient();
      // Remove only rows we created (by user+type), leaving pre-existing ones
      await db
        .from('notification_preferences')
        .delete()
        .eq('user_id', STUDENT_ID)
        .eq('notification_type', 'assignment_created');
    });

    test('A10.2 toggle a notification preference off then back on', async ({ page, loginAs }) => {
      await loginAs('admin');
      // Navigate from settings page via the link so that the client-side auth
      // context from the dashboard is preserved (SPA nav keeps AuthProvider alive)
      await page.goto('/dashboard/settings');
      await page.waitForLoadState('networkidle');
      await page.click('a[href="/dashboard/settings/notifications"]');
      await page.waitForURL('**/settings/notifications');
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('heading', { name: /notification/i }).first()).toBeVisible({
        timeout: 15_000,
      });

      // Toggle the "lesson_reminder_24h" preference
      const prefToggle = page.locator('#pref-lesson_reminder_24h');
      await expect(prefToggle).toBeVisible({ timeout: 20_000 });

      const wasChecked = await prefToggle.isChecked();

      // Click to toggle off
      await prefToggle.click();
      // Wait until the element stabilises at !wasChecked — the optimistic update
      // fires immediately but we also need the server action to settle before the
      // second click, otherwise the action responses race and the state reverts.
      await expect(prefToggle).toBeChecked({ checked: !wasChecked, timeout: 8_000 });
      // Wait for all in-flight network requests (server action POST) to complete
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
      // Confirm state is still !wasChecked after network settles (rules out a
      // successful update that was immediately followed by a revalidation re-fetch)
      await expect(prefToggle).toBeChecked({ checked: !wasChecked, timeout: 5_000 });

      // Toggle back to original state
      await prefToggle.click();
      await expect(prefToggle).toBeChecked({ checked: wasChecked, timeout: 8_000 });
    });

    test('B8.2 student can toggle own notification preferences', async ({ page, loginAs }) => {
      await loginAs('student');
      // Navigate from settings page via link to preserve client-side auth context
      await page.goto('/dashboard/settings');
      await page.waitForLoadState('networkidle');
      await page.click('a[href="/dashboard/settings/notifications"]');
      await page.waitForURL('**/settings/notifications');
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('heading', { name: /notification/i }).first()).toBeVisible({
        timeout: 15_000,
      });

      // Toggle the "assignment_created" preference
      const prefToggle = page.locator('#pref-assignment_created');
      await expect(prefToggle).toBeVisible({ timeout: 20_000 });

      const wasChecked = await prefToggle.isChecked();
      await prefToggle.click();
      await expect(prefToggle).toBeChecked({ checked: !wasChecked, timeout: 8_000 });
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
      await expect(prefToggle).toBeChecked({ checked: !wasChecked, timeout: 5_000 });

      // Restore
      await prefToggle.click();
      await expect(prefToggle).toBeChecked({ checked: wasChecked, timeout: 8_000 });
    });
  }
);
