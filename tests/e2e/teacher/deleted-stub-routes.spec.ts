import { test, expect } from '../../fixtures';

/**
 * LES-1 / LES-2 / IDA-5 / ASG-1 (docs/app-blueprint 90-roadmap.md, Tranche 2)
 *
 * Verifies the deleted "Coming soon" stub routes genuinely render the app's
 * not-found UI for an authenticated user.
 *
 * Note: HTTP status is NOT asserted here. This app streams these pages (a
 * `loading.tsx` boundary flushes a 200 before the async Server Component
 * resolves and calls `notFound()`), so the wire-level status is 200 even
 * though the rendered content is the not-found page — confirmed the same is
 * true for genuinely-nonexistent record ids on unrelated, pre-existing
 * `[id]` routes (e.g. `/dashboard/lessons/<random-uuid>`). That's an
 * app-wide, pre-existing Next.js streaming characteristic, not something
 * this deletion introduced, so it's out of scope here.
 */
test.describe('Deleted stub routes render not-found', { tag: ['@teacher'] }, () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('teacher');
  });

  for (const path of [
    '/dashboard/assignments/templates',
    '/dashboard/assignments/templates/new',
    '/dashboard/lessons/import',
    '/dashboard/users/invite',
  ]) {
    test(`${path} renders not-found`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByText('Page not found')).toBeVisible({ timeout: 15_000 });
    });
  }

  test('/dashboard/lessons/<id>/live renders not-found', async ({ page }) => {
    await page.goto('/dashboard/lessons/00000000-0000-0000-0000-000000000000/live');
    await expect(page.getByText('Page not found')).toBeVisible({ timeout: 15_000 });
  });
});
