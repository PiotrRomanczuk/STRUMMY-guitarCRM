import { test } from '@playwright/test';
import { expectNavItemHidden, expectNavItemVisible, loginAs } from '../../helpers/dashboard';

/**
 * DASH-002 sidebar — minimal core-loop scope.
 * The sidebar is trimmed (menuConfig.ts CORE_LOOP_HIDDEN_ITEMS) to the core loop:
 * Dashboard, Lessons, Songs, Assignments, Students (+ Settings). Every other
 * feature is hidden from nav until individually proven.
 */
test.describe('DASH-002 sidebar (minimal core loop)', () => {
  test('admin sees only the core teaching + students links', async ({ page }) => {
    await loginAs(page, 'admin');
    await expectNavItemVisible(page, 'Dashboard');
    await expectNavItemVisible(page, 'Lessons');
    await expectNavItemVisible(page, 'Songs');
    await expectNavItemVisible(page, 'Assignments');
    await expectNavItemVisible(page, 'Students');
    await expectNavItemVisible(page, 'Settings');
    // Non-core features hidden from nav
    await expectNavItemHidden(page, 'Theory');
    await expectNavItemHidden(page, 'Health Monitor');
    await expectNavItemHidden(page, 'AI Assistant');
    await expectNavItemHidden(page, 'Fretboard');
    await expectNavItemHidden(page, 'Calendar');
    await expectNavItemHidden(page, 'Song Stats');
  });

  test('teacher sees the same core set, no non-core tools', async ({ page }) => {
    await loginAs(page, 'teacher');
    await expectNavItemVisible(page, 'Lessons');
    await expectNavItemVisible(page, 'Songs');
    await expectNavItemVisible(page, 'Assignments');
    await expectNavItemVisible(page, 'Students');
    await expectNavItemHidden(page, 'Theory');
    await expectNavItemHidden(page, 'Skills');
    await expectNavItemHidden(page, 'Logs');
  });

  test('student sees only the core learning links', async ({ page }) => {
    await loginAs(page, 'student');
    await expectNavItemVisible(page, 'My Lessons');
    await expectNavItemVisible(page, 'My Songs');
    await expectNavItemVisible(page, 'My Assignments');
    await expectNavItemVisible(page, 'Settings');
    // Hidden for student
    await expectNavItemHidden(page, 'Students');
    await expectNavItemHidden(page, 'My Stats');
    await expectNavItemHidden(page, 'My Repertoire');
    await expectNavItemHidden(page, 'Theory');
  });
});
