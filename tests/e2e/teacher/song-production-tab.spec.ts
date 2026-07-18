import { test, expect } from '../../fixtures';
import { adminClient } from '../../helpers/seed-ids';

/**
 * CNT-1 (docs/app-blueprint/09-content-production.md, Tranche 5) —
 * re-enable the Production tab.
 *
 * The `{false && ...}` kill-switch is gone; the tab is teacher/admin-gated
 * one level up (SongDetailEditorial's canSeeProduction), and the
 * content_posts/content_post_metrics/hashtag_sets tables are live on this
 * stack. Proves against the real local DB + API (not StrummyProd — this
 * item's own "do after cutover" note is about the production database
 * specifically; the mechanism itself is verified here).
 */

let songId: string | null = null;

test.describe('Song detail — Production tab', { tag: ['@teacher', '@songs'] }, () => {
  test.beforeAll(async () => {
    const db = adminClient();
    const { data } = await db.from('songs').select('id').is('deleted_at', null).limit(1).single();
    songId = data?.id ?? null;
  });

  test.beforeEach(async ({ loginAs }) => {
    await loginAs('teacher');
  });

  test('Production tab renders and /api/content/posts round-trips without a 500', async ({
    page,
  }) => {
    test.skip(!songId, 'No song available to seed from');

    await page.goto(`/dashboard/songs/${songId}`);
    await page.waitForLoadState('networkidle');

    const productionTabBtn = page.getByRole('tab', { name: 'Production' });
    await expect(productionTabBtn).toBeVisible({ timeout: 15_000 });

    const [response] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/content/posts') && res.request().method() === 'GET'
      ),
      productionTabBtn.click(),
    ]);

    expect(response.status()).toBeLessThan(500);
    await expect(page.getByRole('tab', { name: 'Production', selected: true })).toBeVisible();
  });

  test('student does not see the Production tab', async ({ page, loginAs }) => {
    test.skip(!songId, 'No song available to seed from');
    await loginAs('student');

    await page.goto(`/dashboard/songs/${songId}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('tab', { name: 'Production' })).toHaveCount(0);
  });
});
