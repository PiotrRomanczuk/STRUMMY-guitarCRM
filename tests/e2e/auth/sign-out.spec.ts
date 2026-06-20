import { test, expect } from '../../fixtures';

/**
 * Sign-out E2E Tests (A1.2)
 *
 * Journeys tested:
 *  A1.2 — Sign out from topbar user menu → redirected to /sign-in, session cleared
 */

test.describe('Sign-out', { tag: ['@auth', '@sign-out'] }, () => {
  test('A1.2 admin signs out via topbar and lands on sign-in', async ({ page, loginAs }) => {
    await loginAs('admin');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Open topbar user menu
    await page.click('[data-testid="topbar-user-menu-trigger"]');
    // Click sign-out
    await page.click('[data-testid="topbar-signout"]');

    // Should redirect to sign-in
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });
    // Dashboard is no longer accessible without re-login
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });
  });

  test('A1.2 student signs out via topbar and lands on sign-in', async ({ page, loginAs }) => {
    await loginAs('student');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await page.click('[data-testid="topbar-user-menu-trigger"]');
    await page.click('[data-testid="topbar-signout"]');

    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });
  });
});
