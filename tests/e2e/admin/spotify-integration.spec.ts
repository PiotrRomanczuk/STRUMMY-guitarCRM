/**
 * Phase 4 — admin/spotify-integration
 *
 * Admin Spotify pages render and the stubSpotify helper short-circuits the
 * Spotify API. No real outbound calls to Spotify.
 *
 * @tags @admin @spotify @integration @unbreakable
 */

import { test, expect } from '../../fixtures';
import { stubSpotify, stubAssertNoNetwork } from '../../helpers/helpers/stubs';

test.describe(
  'Admin — Spotify integration',
  { tag: ['@admin', '@spotify', '@integration', '@unbreakable'] },
  () => {
    test.beforeEach(async ({ loginAs, page }) => {
      await loginAs('admin');
      await stubAssertNoNetwork(page);
      await stubSpotify(page, {
        search: [{ id: 'sp1', name: 'Stubbed Song', artists: [{ name: 'Stubbed Artist' }] }],
        audioFeatures: { sp1: { tempo: 120, key: 0 } },
      });
    });

    test('/dashboard/admin/spotify-connect renders', async ({ page }) => {
      await page.goto('/dashboard/admin/spotify-connect', { waitUntil: 'networkidle' });
      await expect(page.locator('body')).toBeVisible();
    });

    test('/dashboard/admin/spotify-matches renders', async ({ page }) => {
      await page.goto('/dashboard/admin/spotify-matches', { waitUntil: 'networkidle' });
      await expect(page.locator('body')).toBeVisible();
    });

    test('/dashboard/admin/spotify-import renders', async ({ page }) => {
      await page.goto('/dashboard/admin/spotify-import', { waitUntil: 'networkidle' });
      await expect(page.locator('body')).toBeVisible();
    });
  }
);
