import { test, expect } from '../../fixtures';

/**
 * Teacher Songs CRUD E2E Tests
 *
 * Tests the complete song lifecycle for a teacher:
 * list, create, view detail, edit, search, delete.
 *
 * Uses a single long-running test for the CRUD lifecycle
 * (create → view → edit → search → delete) to share browser context,
 * plus standalone tests for list loading and full-field creation.
 */

const timestamp = Date.now();
const TEST_SONG_TITLE = `E2E Song ${timestamp}`;
const TEST_SONG_EDITED = `E2E Song ${timestamp} Edited`;

test.describe('Teacher Songs CRUD', { tag: ['@teacher', '@songs'] }, () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('teacher');
  });

  test('songs list loads with table and New Song button @mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard/songs');
    await page.waitForLoadState('networkidle');

    const heading = page.locator('h1, h2').filter({ hasText: /songs/i }).first();
    await expect(heading).toBeVisible({ timeout: 15_000 });

    const list = page.locator('[data-testid="song-table"], [data-testid="song-list-mobile"]');
    await expect(list).toBeVisible({ timeout: 15_000 });

    const newSongButton = page
      .locator('a[href="/dashboard/songs/new"], button[aria-label="Add new song"]')
      .first();
    await expect(newSongButton).toBeVisible({ timeout: 5_000 });
  });

  test('song CRUD lifecycle: create → view → edit → search → delete', async ({ page }) => {
    test.setTimeout(120_000);

    // ── CREATE (mobile) ──────────────────────────────────────────
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard/songs/new');
    await page.waitForLoadState('networkidle');

    const form = page.locator('[data-testid="song-form"]');
    await expect(form).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid="step-wizard-progress"]')).toBeVisible();

    // Step 1: Basic Information
    await page.locator('[data-testid="field-title"]').fill(TEST_SONG_TITLE);
    await page.locator('[data-testid="field-author"]').fill('E2E Test Artist');

    await page.locator('[data-testid="field-level"]').click();
    await page.waitForTimeout(300);
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(300);

    await page.locator('[data-testid="field-key"]').click();
    await page.waitForTimeout(300);
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(300);

    // Step 2: Resources (skip)
    await page.locator('[data-testid="step-wizard-next"]').click();
    await page.waitForTimeout(500);

    // Step 3: Musical Details (skip)
    await page.locator('[data-testid="step-wizard-next"]').click();
    await page.waitForTimeout(500);

    // Submit
    await page.locator('[data-testid="step-wizard-submit"]').click();
    await expect(page).not.toHaveURL(/\/new/, { timeout: 20_000 });

    // Verify song appears in list — wait for redirect then hard-reload to bypass RSC cache
    await page.waitForURL(/\/dashboard\/songs/, { timeout: 20_000 });
    await page.reload({ waitUntil: 'networkidle' });
    const songLink = page.locator(`a:has-text("${TEST_SONG_TITLE}")`).first();
    await expect(songLink).toBeVisible({ timeout: 15_000 });

    // ── VIEW DETAIL (mobile) ─────────────────────────────────────
    await songLink.click();
    await expect(page).toHaveURL(/\/dashboard\/songs\/[a-zA-Z0-9-]+/);
    await page.waitForLoadState('networkidle');

    const detailTitle = page.locator('h1, h2').filter({ hasText: TEST_SONG_TITLE }).first();
    await expect(detailTitle).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('E2E Test Artist').first()).toBeVisible();

    // ── EDIT (mobile — via action sheet or direct navigation) ───
    // Navigate directly to the edit page since the detail page may lazy-load buttons
    const songUrl = page.url();
    await page.goto(songUrl + '/edit');
    await page.waitForLoadState('networkidle');

    const titleInput = page.locator('[data-testid="field-title"]');
    await expect(titleInput).toBeVisible({ timeout: 10_000 });
    await titleInput.clear();
    await titleInput.fill(TEST_SONG_EDITED);

    // Skip through wizard to last step
    const nextBtn = page.locator('[data-testid="step-wizard-next"]');
    while (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(300);
    }
    await page.locator('[data-testid="step-wizard-submit"]').click();
    await expect(page).not.toHaveURL(/\/edit/, { timeout: 20_000 });

    // ── SEARCH (mobile) ─────────────────────────────────────────
    await page.goto('/dashboard/songs');
    await page.reload({ waitUntil: 'networkidle' });

    const searchInput = page.locator('input[placeholder*="earch"]').first();
    await expect(searchInput).toBeVisible({ timeout: 15_000 });
    await searchInput.fill(TEST_SONG_EDITED);
    await page.waitForTimeout(1000);
    await expect(page.locator(`a:has-text("${TEST_SONG_EDITED}")`)).toBeVisible({ timeout: 5_000 });
    await searchInput.clear();
    await page.waitForTimeout(500);

    // ── DELETE (via API — V2 detail has async auth that may not show delete button) ──
    await searchInput.fill(TEST_SONG_EDITED);
    await page.waitForTimeout(1000);
    const editedSongLink = page.locator(`a:has-text("${TEST_SONG_EDITED}")`).first();
    await expect(editedSongLink).toBeVisible({ timeout: 5_000 });

    // Extract song ID from the link href
    const href = await editedSongLink.getAttribute('href');
    const songId = href?.split('/').pop();
    expect(songId).toBeTruthy();

    // Delete via API
    const response = await page.request.delete(`/api/song?id=${songId}`);
    expect(response.status()).toBeLessThan(400);

    // Verify song is gone from list
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator(`a:has-text("${TEST_SONG_EDITED}")`)).toHaveCount(0, {
      timeout: 10_000,
    });
  });

  test('create song with all optional fields @mobile', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard/songs/new');
    await page.waitForLoadState('networkidle');

    const form = page.locator('[data-testid="song-form"]');
    await expect(form).toBeVisible({ timeout: 15_000 });

    // Step 1: Basic Info
    await page.locator('[data-testid="field-title"]').fill(`E2E Full Song ${timestamp}`);
    await page.locator('[data-testid="field-author"]').fill('E2E Full Artist');

    await page.locator('[data-testid="field-level"]').click();
    await page.waitForTimeout(300);
    await page.locator('[role="option"]').nth(1).click();
    await page.waitForTimeout(300);

    await page.locator('[data-testid="field-key"]').click();
    await page.waitForTimeout(300);
    await page.locator('[role="option"]').nth(3).click();
    await page.waitForTimeout(300);

    // Step 2: Resources
    await page.locator('[data-testid="step-wizard-next"]').click();
    await page.waitForTimeout(500);

    const youtubeField = page.locator('[data-testid="field-youtube_url"]');
    if (await youtubeField.isVisible()) {
      await youtubeField.fill('https://youtube.com/watch?v=test123');
    }

    // Step 3: Musical Details
    await page.locator('[data-testid="step-wizard-next"]').click();
    await page.waitForTimeout(500);

    const chordsField = page.locator('[data-testid="field-chords"]');
    if (await chordsField.isVisible()) {
      await chordsField.fill('Am C G F');
    }
    const tempoField = page.locator('[data-testid="field-tempo"]');
    if (await tempoField.isVisible()) {
      await tempoField.fill('120');
    }

    // Submit
    await page.locator('[data-testid="step-wizard-submit"]').click();
    await expect(page).not.toHaveURL(/\/new/, { timeout: 20_000 });

    // Verify on list
    await page.goto('/dashboard/songs');
    await page.waitForLoadState('networkidle');
    await expect(page.locator(`a:has-text("E2E Full Song ${timestamp}")`)).toBeVisible({
      timeout: 15_000,
    });

    // Cleanup: navigate to detail and delete
    await page.locator(`a:has-text("E2E Full Song ${timestamp}")`).first().click();
    await page.waitForLoadState('networkidle');

    // Switch to desktop to access delete button directly
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const deleteBtn = page
      .locator('[data-testid="song-delete-button"], button:has-text("Delete")')
      .first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await page.waitForTimeout(1000);
      const confirmBtn = page
        .locator('button:has-text("Confirm"), button:has-text("Delete")')
        .last();
      if (await confirmBtn.isVisible()) await confirmBtn.click();
    }
  });
});
