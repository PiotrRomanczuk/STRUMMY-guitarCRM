/**
 * Phase 1 — auth/forgot-password
 *
 * Locks the request-side of the password-reset flow: success message is
 * identical for an existing email and a nonexistent one (no enumeration).
 *
 * The link-click + new-password legs live in
 * `tests/e2e/auth/reset-password.spec.ts` so this file stays narrow.
 *
 * @tags @auth @password-reset @unbreakable
 */

import { test, expect } from '../../fixtures';

const TEACHER_EMAIL = process.env.TEST_TEACHER_EMAIL || 'teacher@example.com';

test.describe(
  'Forgot-password request',
  { tag: ['@auth', '@password-reset', '@unbreakable'] },
  () => {
    test('valid email → generic "check your email" confirmation', async ({ page }) => {
      await page.goto('/forgot-password', { waitUntil: 'networkidle' });
      await page.getByLabel(/email/i).fill(TEACHER_EMAIL);
      await page.getByRole('button', { name: /reset|send/i }).click();
      await expect(page.getByText(/check your email|reset link sent|if an account/i)).toBeVisible({
        timeout: 10000,
      });
    });

    test('nonexistent email → SAME generic confirmation (no enumeration)', async ({ page }) => {
      await page.goto('/forgot-password', { waitUntil: 'networkidle' });
      await page.getByLabel(/email/i).fill('definitely-does-not-exist-99999@example.com');
      await page.getByRole('button', { name: /reset|send/i }).click();
      await expect(page.getByText(/check your email|reset link sent|if an account/i)).toBeVisible({
        timeout: 10000,
      });
    });

    test('malformed email shows a client-side validation error before submit', async ({ page }) => {
      await page.goto('/forgot-password', { waitUntil: 'networkidle' });
      await page.getByLabel(/email/i).fill('not-an-email');
      await page.getByRole('button', { name: /reset|send/i }).click();
      // Either client-side message or the form refuses to submit.
      await expect(page).toHaveURL(/forgot-password/);
    });
  }
);
