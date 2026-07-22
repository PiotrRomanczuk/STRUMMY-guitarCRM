import { test, expect } from '../../fixtures';
import { adminClient, getAdminId } from '../../helpers/seed-ids';

/**
 * Notifications Inbox E2E Tests (A10.1 / B8.4)
 *
 * Journeys tested:
 *  A10.1/B8.4 — View inbox, mark single read, mark all read
 */

const insertedIds: string[] = [];

test.describe.configure({ mode: 'serial' });

test.describe('Notifications Inbox', { tag: ['@admin', '@notifications'] }, () => {
  test.beforeAll(async () => {
    const db = adminClient();
    // Resolved at runtime from TEST_ADMIN_EMAIL, not hard-coded — a stale
    // hard-coded profile UUID here previously seeded notifications for a
    // different admin account than whichever one loginAs('admin') actually
    // signs in as, silently hiding these seeded rows from the test.
    const adminProfileId = await getAdminId(db);
    // Seed 2 unread notifications for the admin
    const { data } = await db
      .from('in_app_notifications')
      .insert([
        {
          user_id: adminProfileId,
          notification_type: 'assignment_created',
          title: 'E2E Notification 1',
          body: 'Test notification body one',
          is_read: false,
        },
        {
          user_id: adminProfileId,
          notification_type: 'lesson_reminder_24h',
          title: 'E2E Notification 2',
          body: 'Test notification body two',
          is_read: false,
        },
      ])
      .select('id');
    if (data) insertedIds.push(...data.map((r) => r.id));
  });

  test.afterAll(async () => {
    const db = adminClient();
    if (insertedIds.length) {
      await db.from('in_app_notifications').delete().in('id', insertedIds);
    }
  });

  test.beforeEach(async ({ loginAs }) => {
    await loginAs('admin');
  });

  test('A10.1 notifications inbox renders with unread entries', async ({ page }) => {
    await page.goto('/dashboard/notifications');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /notifications/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('text=/E2E Notification 1/i').first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('A10.1 mark single notification as read', async ({ page }) => {
    await page.goto('/dashboard/notifications');
    await page.waitForLoadState('networkidle');

    // Find the first "Mark read" button and click it
    const markReadBtn = page.getByRole('button', { name: /Mark read/i }).first();
    await expect(markReadBtn).toBeVisible({ timeout: 10_000 });
    // Record how many unread buttons exist before clicking
    const countBefore = await page.getByRole('button', { name: /Mark read/i }).count();

    await markReadBtn.click();

    // Confirm the server action actually persisted the change (avoids racing
    // reload against revalidation timing — assert the source of truth first).
    const db = adminClient();
    await expect
      .poll(
        async () => {
          const { data } = await db
            .from('in_app_notifications')
            .select('id')
            .in('id', insertedIds)
            .eq('is_read', false);
          return data?.length ?? -1;
        },
        { timeout: 15_000 }
      )
      .toBe(countBefore - 1);

    await page.reload();
    await page.waitForLoadState('networkidle');

    // After reload, there should be one fewer "Mark read" button than before
    const remaining = page.getByRole('button', { name: /Mark read/i });
    await expect(remaining).toHaveCount(countBefore - 1, { timeout: 10_000 });
  });

  test('A10.1 mark all notifications as read', async ({ page }) => {
    // Re-seed to ensure both are unread for this test
    const db = adminClient();
    if (insertedIds.length) {
      await db.from('in_app_notifications').update({ is_read: false }).in('id', insertedIds);
    }

    await page.goto('/dashboard/notifications');
    await page.waitForLoadState('networkidle');

    const markAllBtn = page.getByRole('button', { name: /Mark all read/i }).first();
    await expect(markAllBtn).toBeVisible({ timeout: 10_000 });
    await markAllBtn.click();

    // After marking all, the "Mark all read" button should disappear
    await expect(page.getByRole('button', { name: /Mark all read/i })).not.toBeVisible({
      timeout: 8_000,
    });
  });

  test('A10.1 notifications inbox is usable at mobile viewport @mobile', async ({ page }) => {
    // Re-seed unread so the "Mark read" tap target is present, regardless of
    // what earlier tests in this serial suite left behind.
    const db = adminClient();
    if (insertedIds.length) {
      await db.from('in_app_notifications').update({ is_read: false }).in('id', insertedIds);
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard/notifications');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /notifications/i })).toBeVisible({
      timeout: 15_000,
    });

    // Notification rows render and are readable at mobile width
    await expect(page.locator('text=/E2E Notification 1/i').first()).toBeVisible({
      timeout: 10_000,
    });

    // No horizontal overflow at mobile viewport
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(390 + 5);

    // "Mark read" control is present with an actually tappable target
    const markReadBtn = page.getByRole('button', { name: /Mark read/i }).first();
    await expect(markReadBtn).toBeVisible({ timeout: 10_000 });
    const box = await markReadBtn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });
});
