import { expect, type Page } from '@playwright/test';
import { loginAsAdmin, loginAsStudent, loginAsTeacher } from './auth';

export type DashboardRole = 'admin' | 'teacher' | 'student';

/**
 * Logs into the dashboard as the given role.
 * Uses the existing role-specific helpers in `tests/helpers/auth.ts`.
 */
export async function loginAs(page: Page, role: DashboardRole): Promise<void> {
  if (role === 'admin') return loginAsAdmin(page);
  if (role === 'teacher') return loginAsTeacher(page);
  return loginAsStudent(page);
}

/**
 * Asserts that a nav item with the given label is visible somewhere on
 * the page. The Sidebar tags each link with `data-nav-item="<name>"`.
 *
 * On desktop the link is in the persistent aside; on mobile we open the
 * Sheet drawer first.
 */
export async function expectNavItemVisible(page: Page, name: string): Promise<void> {
  const viewport = page.viewportSize();
  const isMobile = viewport ? viewport.width < 768 : false;
  if (isMobile) {
    await page.getByTestId('sidebar-mobile-trigger').click();
  }
  const item = page.locator(`[data-nav-item="${name}"]`).first();
  await expect(item).toBeVisible();
}

/**
 * Asserts that no nav item with the given label exists on the page.
 * Opens the mobile drawer first on small viewports so we check the full
 * rendered nav, not just the desktop aside.
 */
export async function expectNavItemHidden(page: Page, name: string): Promise<void> {
  const viewport = page.viewportSize();
  const isMobile = viewport ? viewport.width < 768 : false;
  if (isMobile) {
    await page.getByTestId('sidebar-mobile-trigger').click();
  }
  const item = page.locator(`[data-nav-item="${name}"]`);
  await expect(item).toHaveCount(0);
}
