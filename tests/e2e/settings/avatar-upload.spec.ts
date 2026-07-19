import { test, expect } from '../../fixtures';

/**
 * IDA-2 (docs/app-blueprint/01-identity-access.md, Tranche 5) — avatar
 * upload. Only the client-side validation path is verified here: this dev
 * stack has no Supabase Storage service running at all (confirmed —
 * storage.buckets doesn't exist), so a real upload cannot be exercised.
 * Validation happens entirely client-side before any network call, so it's
 * fully testable regardless. See the migration's own note for the
 * infra-gap explanation.
 */
test.describe('Settings — avatar upload validation', { tag: ['@teacher'] }, () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('teacher');
  });

  test('a non-image file is rejected with a visible error, no network call made', async ({
    page,
  }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');

    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toHaveCount(1);

    await fileInput.setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 not a real pdf but has the right mime type'),
    });

    await expect(page.getByTestId('avatar-upload-error')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId('avatar-upload-error')).toContainText(/PNG, JPEG, WebP, or GIF/i);
  });

  test('an oversized image is rejected with a visible error', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');

    const fileInput = page.locator('input[type="file"]');
    const oversized = Buffer.alloc(2 * 1024 * 1024 + 1, 1);

    await fileInput.setInputFiles({
      name: 'huge.png',
      mimeType: 'image/png',
      buffer: oversized,
    });

    await expect(page.getByTestId('avatar-upload-error')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId('avatar-upload-error')).toContainText(/2 MB/);
  });
});
