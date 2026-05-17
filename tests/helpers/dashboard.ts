import { Page, expect } from '@playwright/test';
import { loginAsAdmin, loginAsTeacher, loginAsStudent } from './auth';

export type Role = 'admin' | 'teacher' | 'student';

export async function loginAs(page: Page, role: Role): Promise<void> {
  if (role === 'admin') return loginAsAdmin(page);
  if (role === 'teacher') return loginAsTeacher(page);
  return loginAsStudent(page);
}

export async function expectCardVisible(page: Page, testId: string): Promise<void> {
  await expect(page.getByTestId(testId)).toBeVisible({ timeout: 10_000 });
}

export async function expectCardHidden(page: Page, testId: string): Promise<void> {
  await expect(page.getByTestId(testId)).toHaveCount(0);
}

export async function expectForbidden(page: Page, route: string): Promise<void> {
  await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForLoadState('networkidle', { timeout: 30_000 });
  const url = page.url();
  const redirectedToSignIn = url.includes('/sign-in');
  const redirectedToDashboardRoot = new URL(url).pathname === '/dashboard';
  const has403 = (await page.getByText(/forbidden|not authorized|access denied/i).count()) > 0;
  expect(redirectedToSignIn || redirectedToDashboardRoot || has403).toBeTruthy();
}

export async function expectNavItemVisible(page: Page, label: string): Promise<void> {
  await expect(page.getByRole('link', { name: new RegExp(label, 'i') })).toBeVisible();
}

export async function expectNavItemHidden(page: Page, label: string): Promise<void> {
  await expect(page.getByRole('link', { name: new RegExp(label, 'i') })).toHaveCount(0);
}
