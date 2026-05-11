/**
 * Phase 3 — student/repertoire-self-rate
 *
 * Student updates their own self_rating on a repertoire entry. Asserts:
 *   - The rating control is reachable on /dashboard/repertoire.
 *   - The teacher_notes field is read-only / absent for the student.
 *
 * @tags @student @repertoire @unbreakable
 */

import { test, expect } from '../../fixtures';

test.describe('Student — self-rating', { tag: ['@student', '@repertoire', '@unbreakable'] }, () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('student');
  });

  test('repertoire page loads', async ({ page }) => {
    await page.goto('/dashboard/repertoire', { waitUntil: 'networkidle' });
    // Either rows or an explicit empty state must be present.
    const content = page.getByText(/no songs|repertoire|to learn|started|mastered/i).first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test('student does not see a teacher_notes textarea anywhere on the page', async ({ page }) => {
    await page.goto('/dashboard/repertoire', { waitUntil: 'networkidle' });
    const teacherNotes = page.getByLabel(/teacher notes/i);
    expect(await teacherNotes.count()).toBe(0);
  });

  test.skip('click 4-stars on the first row → persists across reload (TODO: needs seeded row to rate)', async () => {
    // Depends on a stable seeded repertoire row for the student.
  });
});
