import { test, expect } from '../../fixtures';

/**
 * API Keys E2E Tests (A10.3 / B8.3)
 *
 * Journeys tested:
 *  A10.3 / B8.3 — Create gcrm_ API key → visible in table → delete
 *
 * UI: inline form (no dialog), "Create API Key" submit button.
 * Deletion uses browser confirm() — handled via page.once('dialog').
 * Success/error messages are inline (not toasts).
 */

test.describe.configure({ mode: 'serial' });

test.describe('API Keys', { tag: ['@settings', '@api-keys'] }, () => {
  test('A10.3 create an API key, see it in the table, then delete it', async ({
    page,
    loginAs,
  }) => {
    test.setTimeout(60_000);
    await loginAs('admin');

    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');

    // "Create New API Key" section heading
    await expect(page.locator('text=/Create New API Key/i').first()).toBeVisible({
      timeout: 15_000,
    });

    const keyName = `E2E Test Key ${Date.now()}`;

    // Fill the inline form and submit
    await page.locator('#name').fill(keyName);
    await page.getByRole('button', { name: 'Create API Key' }).click();

    // After creation: "API Key Created" section appears with a <code> element
    await expect(page.locator('text=/API Key Created/i').first()).toBeVisible({ timeout: 15_000 });
    const keyCode = page.locator('code').first();
    await expect(keyCode).toBeVisible({ timeout: 10_000 });
    const keyValue = (await keyCode.textContent()) ?? '';
    expect(keyValue).toMatch(/^gcrm_/);

    // Close the new-key panel
    await page.getByRole('button', { name: 'Close' }).click();

    // Key name appears in the table
    await expect(page.locator(`text=${keyName}`).first()).toBeVisible({ timeout: 10_000 });

    // Delete — accept the native browser confirm() dialog
    const keyRow = page.locator('tr', { hasText: keyName });
    page.once('dialog', (dialog) => dialog.accept());
    await keyRow.getByRole('button', { name: 'Delete' }).click();

    // Inline success message
    await expect(page.locator('text=/API key deleted successfully/i').first()).toBeVisible({
      timeout: 10_000,
    });

    // Key no longer in the table
    await expect(page.locator(`text=${keyName}`)).not.toBeVisible({ timeout: 8_000 });
  });

  test('B8.3 student can create and delete their own API key', async ({ page, loginAs }) => {
    test.setTimeout(60_000);
    await loginAs('student');

    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=/Create New API Key/i').first()).toBeVisible({
      timeout: 15_000,
    });

    const keyName = `E2E Student Key ${Date.now()}`;
    await page.locator('#name').fill(keyName);
    await page.getByRole('button', { name: 'Create API Key' }).click();

    await expect(page.locator('text=/API Key Created/i').first()).toBeVisible({ timeout: 15_000 });
    const keyCode = page.locator('code').first();
    await expect(keyCode).toBeVisible({ timeout: 10_000 });
    const keyValue = (await keyCode.textContent()) ?? '';
    expect(keyValue).toMatch(/^gcrm_/);

    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.locator(`text=${keyName}`).first()).toBeVisible({ timeout: 10_000 });

    const keyRow = page.locator('tr', { hasText: keyName });
    page.once('dialog', (dialog) => dialog.accept());
    await keyRow.getByRole('button', { name: 'Delete' }).click();

    await expect(page.locator('text=/API key deleted successfully/i').first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator(`text=${keyName}`)).not.toBeVisible({ timeout: 8_000 });
  });
});
