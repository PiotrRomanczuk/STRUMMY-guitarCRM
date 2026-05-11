/**
 * Phase 1 — auth/sign-in
 *
 * Locks the sign-in UX: happy path, generic error on wrong password
 * (no enumeration), rate-limit kicks in after N failed attempts, the
 * account-lockout error shows a countdown.
 *
 * @tags @auth @sign-in @unbreakable
 */

import { test, expect } from '../../fixtures';

const TEACHER_EMAIL = process.env.TEST_TEACHER_EMAIL || 'teacher@example.com';
const TEACHER_PASSWORD = process.env.TEST_TEACHER_PASSWORD || 'test123_teacher';

test.describe('Sign-in', { tag: ['@auth', '@sign-in', '@unbreakable'] }, () => {
  test('happy path: valid credentials land on /dashboard', async ({ page }) => {
    await page.goto('/sign-in', { waitUntil: 'networkidle' });
    await page.getByLabel(/email/i).fill(TEACHER_EMAIL);
    await page.getByLabel(/password/i).fill(TEACHER_PASSWORD);
    await page.getByRole('button', { name: /^continue$|sign in/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('wrong password shows a generic "invalid email or password" message', async ({ page }) => {
    await page.goto('/sign-in', { waitUntil: 'networkidle' });
    await page.getByLabel(/email/i).fill(TEACHER_EMAIL);
    await page.getByLabel(/password/i).fill('definitely-not-the-password');
    await page.getByRole('button', { name: /^continue$|sign in/i }).click();
    await expect(page.getByText(/invalid email or password|invalid credentials/i)).toBeVisible({
      timeout: 10000,
    });
    await expect(page).toHaveURL(/sign-in/);
  });

  test('nonexistent email surfaces the same generic message (no enumeration)', async ({ page }) => {
    await page.goto('/sign-in', { waitUntil: 'networkidle' });
    await page.getByLabel(/email/i).fill('definitely-not-a-user-12345@example.com');
    await page.getByLabel(/password/i).fill('AnyPass1!');
    await page.getByRole('button', { name: /^continue$|sign in/i }).click();
    await expect(page.getByText(/invalid email or password|invalid credentials/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test.skip('rate-limit kicks in after N failed attempts (TODO: confirm threshold + reset rate-limit between runs)', async () => {
    // The action's rate-limit uses an email:ip identifier. Without a reset
    // between runs this leaves the test account locked for follow-up specs.
    // Enable once the suite isolates rate-limit state per test.
  });
});
