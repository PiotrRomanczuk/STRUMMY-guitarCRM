import { test, expect } from '@playwright/test';
import { loginAs, type DashboardRole } from '../../helpers/dashboard';

/**
 * DASH-004 - Loading / Empty / Error state primitives.
 *
 * The primitives are purely presentational and not yet mounted on any page,
 * so this spec only smoke-tests that adding the module does not break the
 * existing `/dashboard` route for any of the three roles.
 */
test.describe('DASH-004 states primitives smoke', () => {
  const roles: readonly DashboardRole[] = ['admin', 'teacher', 'student'] as const;

  for (const role of roles) {
    test(`${role} dashboard still renders after adding states module`, async ({ page }) => {
      await loginAs(page, role);
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.getByText(/Welcome/i).first()).toBeVisible();
    });
  }
});
