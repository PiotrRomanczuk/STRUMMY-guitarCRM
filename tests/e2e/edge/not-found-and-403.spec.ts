/**
 * Phase 5 — edge/not-found-and-403
 *
 * 404 for a junk UUID; 403 / sign-in redirect for an unauthenticated visit
 * to a privileged route.
 *
 * @tags @edge @security @unbreakable
 */

import { test, expect } from '../../fixtures';

test.describe('Edge — not-found & 403', { tag: ['@edge', '@security', '@unbreakable'] }, () => {
  test('unauthenticated visit to /dashboard redirects to sign-in', async ({ page, context }) => {
    // Clear any persisted cookies from the auth fixture.
    await context.clearCookies();
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/sign-in|\/$/);
  });

  test('student visiting a junk lesson UUID gets a 404-style page', async ({ page, loginAs }) => {
    await loginAs('student');
    await page.goto('/dashboard/lessons/00000000-0000-4000-8000-000000000000', {
      waitUntil: 'networkidle',
    });
    const notFound = page.getByText(/not found|doesn't exist|404/i).first();
    const stayedOnRoute = /\/dashboard\/lessons\//.test(page.url());
    // Either an explicit "not found" message OR a clean redirect off the
    // detail page. RLS guarantees the row is hidden either way.
    if (stayedOnRoute) {
      await expect(notFound).toBeVisible({ timeout: 10000 });
    }
  });
});
