import { test, expect } from '@playwright/test';
import { loginAs } from '../../helpers/dashboard';

test.describe('DASH-003 topbar', { tag: '@dashboard' }, () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('admin sees topbar with user menu and role switcher (multi-role)', async ({ page }) => {
    await loginAs(page, 'admin');
    await expect(page.getByTestId('dashboard-topbar')).toBeVisible();
    await expect(page.getByTestId('topbar-user-menu-trigger')).toBeVisible();
    // The test admin (p.romanczuk@gmail.com) is also a teacher, so RoleSwitcher is shown.
    await expect(page.getByTestId('topbar-role-switcher')).toBeVisible();
  });

  test('teacher sees topbar with user menu, no role switcher (single role)', async ({ page }) => {
    await loginAs(page, 'teacher');
    await expect(page.getByTestId('dashboard-topbar')).toBeVisible();
    await expect(page.getByTestId('topbar-user-menu-trigger')).toBeVisible();
    await expect(page.getByTestId('topbar-role-switcher')).toHaveCount(0);
  });

  test('student sees topbar with user menu, no role switcher (single role)', async ({ page }) => {
    await loginAs(page, 'student');
    await expect(page.getByTestId('dashboard-topbar')).toBeVisible();
    await expect(page.getByTestId('topbar-user-menu-trigger')).toBeVisible();
    await expect(page.getByTestId('topbar-role-switcher')).toHaveCount(0);
  });

  test('user menu opens and exposes sign-out for each role', async ({ page }) => {
    for (const role of ['admin', 'teacher', 'student'] as const) {
      await page.context().clearCookies();
      await loginAs(page, role);
      await page.getByTestId('topbar-user-menu-trigger').click();
      await expect(page.getByTestId('topbar-signout')).toBeVisible();
      await expect(page.getByTestId('topbar-profile-link')).toBeVisible();
      await page.keyboard.press('Escape');
    }
  });
});
