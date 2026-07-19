import { test, expect } from '../../fixtures';
import { adminClient, getStudentId } from '../../helpers/seed-ids';

/**
 * IDA-4 (docs/app-blueprint/01-identity-access.md, Tranche 3) — surface
 * onboarding user_preferences to the teacher.
 */

let studentId: string;

test.describe('Student detail — About this student', { tag: ['@teacher'] }, () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('teacher');
  });

  test('a student who completed onboarding shows their skill level + goals', async ({ page }) => {
    const db = adminClient();
    studentId = await getStudentId(db);

    await db.from('user_preferences').delete().eq('user_id', studentId);
    const { error } = await db.from('user_preferences').insert({
      user_id: studentId,
      skill_level: 'advanced',
      goals: ['play_songs', 'learn_theory'],
      learning_style: ['visual'],
    });
    expect(error).toBeNull();

    await page.goto(`/dashboard/users/${studentId}`);
    await page.waitForLoadState('networkidle');

    const aboutLine = page.getByTestId('student-about-line');
    await expect(aboutLine).toBeVisible({ timeout: 15_000 });
    await expect(aboutLine).toContainText('advanced');
    await expect(aboutLine).toContainText('play_songs');
    await expect(aboutLine).toContainText('learn_theory');

    await db.from('user_preferences').delete().eq('user_id', studentId);
  });

  test('a student without a preferences row renders no empty section', async ({ page }) => {
    const db = adminClient();
    studentId = await getStudentId(db);
    await db.from('user_preferences').delete().eq('user_id', studentId);

    await page.goto(`/dashboard/users/${studentId}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('student-about-line')).toHaveCount(0);
  });
});
