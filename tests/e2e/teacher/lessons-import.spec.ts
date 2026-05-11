/**
 * Phase 2 — teacher/lessons-import
 *
 * CSV upload at `/dashboard/lessons/import` — happy path, schema-failure
 * surfaces row-level errors, rollback on bad row.
 *
 * @tags @teacher @lessons @import @unbreakable
 */

import { test, expect } from '../../fixtures';

test.describe(
  'Teacher — lessons CSV import',
  { tag: ['@teacher', '@lessons', '@import', '@unbreakable'] },
  () => {
    test.beforeEach(async ({ loginAs }) => {
      await loginAs('teacher');
    });

    test('import page renders the file-upload control', async ({ page }) => {
      await page.goto('/dashboard/lessons/import', { waitUntil: 'networkidle' });
      const fileInput = page.locator('input[type="file"]').first();
      await expect(fileInput).toBeAttached();
    });

    test.skip('happy path: valid CSV → rows created (TODO: needs deterministic seeded student to attach lessons to)', async () => {
      // Build a CSV string with 3 lessons, upload, click import, assert
      // 3 new rows appear on the lessons list with the expected titles.
    });

    test.skip('invalid CSV: row-level validation errors surface inline, no partial write', async () => {
      // Upload a CSV with 1 valid + 1 invalid row, click import, assert
      // the invalid row is flagged and the valid row is NOT inserted
      // (atomic import or clear partial-success indicator).
    });
  }
);
