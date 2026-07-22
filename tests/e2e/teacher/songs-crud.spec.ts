import { test, expect } from '../../fixtures';
import type { Page } from '@playwright/test';

/**
 * Teacher Songs CRUD E2E Tests
 *
 * Tests the complete song lifecycle for a teacher:
 * list, create, view detail, edit, search, delete.
 *
 * Targets the editorial UI:
 *  - List `SongsListEditorial` — server-rendered GET form, search submits on Enter.
 *  - Create `SongFormEditorial` — single-page form (`name=` fields, level/key
 *    selects default to beginner/C), submit "Add song", redirects to the new
 *    song's detail page (`/dashboard/songs/[id]`).
 *  - Edit `SongEditFormEditorial` — same shape, submit "Save changes".
 */

const timestamp = Date.now();
const TEST_SONG_TITLE = `E2E Song ${timestamp}`;
const TEST_SONG_EDITED = `E2E Song ${timestamp} Edited`;

/** Submit the editorial list search GET form and wait for the filtered render. */
async function searchSongs(page: Page, query: string) {
  const search = page.locator('input[name="search"]').first();
  await expect(search).toBeVisible({ timeout: 15_000 });
  await search.fill(query);
  await search.press('Enter');
  await page.waitForLoadState('networkidle');
}

test.describe('Teacher Songs CRUD', { tag: ['@teacher', '@songs'] }, () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('teacher');
  });

  test('songs list loads with heading and New Song button @mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard/songs');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /songs/i }).first()).toBeVisible({
      timeout: 15_000,
    });

    // At least one song row links to a detail page.
    await expect(
      page.locator('a[href^="/dashboard/songs/"]:not([href$="/new"])').first()
    ).toBeVisible({ timeout: 15_000 });

    // New Song affordance.
    await expect(page.locator('a[href="/dashboard/songs/new"]').first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test('song CRUD lifecycle: create → view → edit → search → delete', async ({ page }) => {
    test.setTimeout(120_000);

    // ── CREATE ───────────────────────────────────────────────────
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard/songs/new');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('input[name="title"]')).toBeVisible({ timeout: 15_000 });
    await page.locator('input[name="title"]').fill(TEST_SONG_TITLE);
    await page.locator('input[name="author"]').fill('E2E Test Artist');
    // level/key selects default to beginner/C (both required) — leave as-is.
    await page.getByRole('button', { name: 'Add song' }).click();

    // Server action redirects to the new song's detail page.
    await page.waitForURL(/\/dashboard\/songs\/[0-9a-f-]{36}$/, { timeout: 20_000 });
    const songUrl = page.url();

    // ── VIEW DETAIL ──────────────────────────────────────────────
    await expect(page.getByRole('heading', { name: TEST_SONG_TITLE }).first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('E2E Test Artist').first()).toBeVisible();

    // ── EDIT ─────────────────────────────────────────────────────
    await page.getByRole('link', { name: 'Edit song' }).click();
    await page.waitForURL(songUrl + '/edit', { timeout: 10_000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input[name="title"]')).toBeVisible({ timeout: 10_000 });
    await page.locator('input[name="title"]').fill(TEST_SONG_EDITED);
    await page.getByRole('button', { name: 'Save changes' }).click();
    await page.waitForURL(/\/dashboard\/songs\/[0-9a-f-]{36}$/, { timeout: 20_000 });
    await expect(page).not.toHaveURL(/\/edit/);
    await expect(page.getByRole('heading', { name: TEST_SONG_EDITED }).first()).toBeVisible({
      timeout: 10_000,
    });

    // ── SEARCH (list GET form) ───────────────────────────────────
    await page.goto('/dashboard/songs');
    await searchSongs(page, TEST_SONG_EDITED);
    const editedLink = page.locator(`a:has-text("${TEST_SONG_EDITED}")`).first();
    await expect(editedLink).toBeVisible({ timeout: 10_000 });

    // ── DELETE (via API — robust against detail-page lazy auth) ──
    const songId = (await editedLink.getAttribute('href'))?.split('/').pop();
    expect(songId).toBeTruthy();
    const response = await page.request.delete(`/api/song?id=${songId}`);
    expect(response.status()).toBeLessThan(400);

    await page.goto('/dashboard/songs');
    await searchSongs(page, TEST_SONG_EDITED);
    await expect(page.locator(`a:has-text("${TEST_SONG_EDITED}")`)).toHaveCount(0, {
      timeout: 10_000,
    });
  });

  test('create song with required fields @mobile', async ({ page }) => {
    test.setTimeout(90_000);
    const fullTitle = `E2E Full Song ${timestamp}`;

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard/songs/new');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('input[name="title"]')).toBeVisible({ timeout: 15_000 });
    await page.locator('input[name="title"]').fill(fullTitle);
    await page.locator('input[name="author"]').fill('E2E Full Artist');
    await page.getByRole('button', { name: 'Add song' }).click();

    await page.waitForURL(/\/dashboard\/songs\/[0-9a-f-]{36}$/, { timeout: 20_000 });
    await expect(page.getByRole('heading', { name: fullTitle }).first()).toBeVisible({
      timeout: 10_000,
    });

    // Clean up via API.
    const songId = page.url().split('/').pop();
    if (songId) await page.request.delete(`/api/song?id=${songId}`);
  });
});
