/**
 * Phase 2 — teacher/repertoire-crud
 *
 * Teacher manages a student's repertoire: add a song, set capo + preferred
 * key, mark mastered (triggers the `mastered_at` auto-set), reorder via the
 * new `reorderRepertoireAction`, archive.
 *
 * @tags @teacher @repertoire @unbreakable
 */

import { test, expect } from '../../fixtures';

test.describe(
  'Teacher — repertoire CRUD',
  { tag: ['@teacher', '@repertoire', '@unbreakable'] },
  () => {
    test.beforeEach(async ({ loginAs }) => {
      await loginAs('teacher');
    });

    test('repertoire page loads from a student detail view', async ({ page }) => {
      await page.goto('/dashboard/users', { waitUntil: 'networkidle' });
      const firstStudent = page.locator('a[href*="/dashboard/users/"]').first();
      const hasStudent = await firstStudent.isVisible().catch(() => false);
      test.skip(!hasStudent, 'No students seeded for the teacher');
      await firstStudent.click();
      await expect(page.getByText(/repertoire|songs|to learn/i).first()).toBeVisible({
        timeout: 10000,
      });
    });

    test.skip('add song → set capo/key → mark mastered → mastered_at populated', async () => {
      // Depends on a seeded song catalogue; flip on once seed is stable.
    });

    test.skip('reorder via drag-and-drop persists sort_order (uses reorderRepertoireAction)', async () => {
      // Drag the second item above the first, reload, expect the new order.
    });
  }
);
