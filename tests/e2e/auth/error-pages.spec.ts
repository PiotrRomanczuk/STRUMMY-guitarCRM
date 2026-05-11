/**
 * Phase 1 — auth/error-pages
 *
 * Renders the two non-happy auth pages: `/auth/auth-code-error` (bad magic
 * link / OAuth callback) and `/auth/verify-email-success` (the destination
 * after clicking the verify-email link).
 *
 * @tags @auth @unbreakable
 */

import { test, expect } from '../../fixtures';

test.describe('Auth error pages', { tag: ['@auth', '@unbreakable'] }, () => {
  test('/auth/auth-code-error renders with a retry CTA', async ({ page }) => {
    await page.goto('/auth/auth-code-error', { waitUntil: 'networkidle' });
    await expect(page.getByText(/error|invalid|expired|sign in|try again/i).first()).toBeVisible();
  });

  test('/auth/verify-email-success renders a clear success message', async ({ page }) => {
    await page.goto('/auth/verify-email-success', { waitUntil: 'networkidle' });
    await expect(page.getByText(/verified|confirmed|signed in/i).first()).toBeVisible();
  });
});
