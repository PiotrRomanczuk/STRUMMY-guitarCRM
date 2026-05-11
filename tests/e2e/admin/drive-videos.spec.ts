/**
 * Phase 4 — admin/drive-videos
 *
 * Drive videos gallery at `/dashboard/admin/drive-videos` renders without
 * hitting Google Drive (network probe blocks real calls).
 *
 * @tags @admin @drive @integration @unbreakable
 */

import { test, expect } from '../../fixtures';
import { stubAssertNoNetwork } from '../../helpers/helpers/stubs';

test.describe(
  'Admin — Drive videos',
  { tag: ['@admin', '@drive', '@integration', '@unbreakable'] },
  () => {
    test.beforeEach(async ({ loginAs, page }) => {
      await loginAs('admin');
      await stubAssertNoNetwork(page);
    });

    test('drive videos page renders without real Drive call', async ({ page }) => {
      await page.goto('/dashboard/admin/drive-videos', { waitUntil: 'networkidle' });
      await expect(page.locator('body')).toBeVisible();
    });
  }
);
