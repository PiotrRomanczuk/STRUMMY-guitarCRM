import { test } from '@playwright/test';
import { expectNavItemHidden, expectNavItemVisible, loginAs } from '../../helpers/dashboard';

test.describe('DASH-002 sidebar', () => {
  test('admin sees admin-only links', async ({ page }) => {
    await loginAs(page, 'admin');
    await expectNavItemVisible(page, 'Users');
    await expectNavItemVisible(page, 'Health');
    await expectNavItemVisible(page, 'AI');
    await expectNavItemVisible(page, 'Settings');
  });

  test('teacher sees teaching links, not admin-only', async ({ page }) => {
    await loginAs(page, 'teacher');
    await expectNavItemVisible(page, 'Students');
    await expectNavItemVisible(page, 'Lessons');
    await expectNavItemHidden(page, 'Users');
    await expectNavItemHidden(page, 'Health');
  });

  test('student sees student links only', async ({ page }) => {
    await loginAs(page, 'student');
    await expectNavItemVisible(page, 'Lessons');
    await expectNavItemVisible(page, 'Practice');
    await expectNavItemHidden(page, 'Students');
    await expectNavItemHidden(page, 'Users');
  });
});
