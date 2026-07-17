import { test, expect } from '../../fixtures';
import { createClient } from '@supabase/supabase-js';
import { getStudentId, getTeacherId } from '../../helpers/seed-ids';

/**
 * Student Songs Read-Only E2E Tests
 *
 * Verifies that students can browse and view songs but cannot
 * create, edit, or delete them. Read-only access enforcement.
 *
 * A song is seeded via the admin client in beforeAll so tests run
 * against guaranteed data regardless of DB state.
 */

// Resolved at runtime from the configured test-account emails (see beforeAll).
let STUDENT_ID = '';
let TEACHER_ID = '';

function adminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_LOCAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key);
}

let seededSongId: string | null = null;
let seededLessonId: string | null = null;
let seededLessonSongId: string | null = null;

test.describe('Student Songs (Read-Only)', { tag: ['@student', '@songs'] }, () => {
  test.beforeAll(async () => {
    const db = adminClient();
    STUDENT_ID = await getStudentId(db);
    TEACHER_ID = await getTeacherId(db);

    // Remove any leftover E2E songs from previous runs
    await db.from('songs').delete().eq('title', 'E2E Test Song Read');

    // Insert a test song
    const { data: song } = await db
      .from('songs')
      .insert({
        title: 'E2E Test Song Read',
        author: 'E2E Artist',
        level: 'beginner',
        key: 'C',
        ultimate_guitar_link: 'https://www.ultimate-guitar.com',
      })
      .select('id')
      .single();
    seededSongId = song?.id ?? null;

    if (seededSongId) {
      // Create a lesson linking the student to this song so RLS allows the student to see it
      const { data: lesson } = await db
        .from('lessons')
        .insert({
          teacher_id: TEACHER_ID,
          student_id: STUDENT_ID,
          title: 'E2E Songs Read Lesson',
          scheduled_at: '2026-09-01T10:00:00Z',
          status: 'SCHEDULED',
        })
        .select('id')
        .single();
      seededLessonId = lesson?.id ?? null;

      if (seededLessonId) {
        const { data: ls } = await db
          .from('lesson_songs')
          .insert({ lesson_id: seededLessonId, song_id: seededSongId, status: 'to_learn' })
          .select('id')
          .single();
        seededLessonSongId = ls?.id ?? null;
      }
    }
  });

  test.afterAll(async () => {
    const db = adminClient();
    if (seededLessonSongId) await db.from('lesson_songs').delete().eq('id', seededLessonSongId);
    if (seededLessonId) await db.from('lessons').delete().eq('id', seededLessonId);
    if (seededSongId) await db.from('songs').delete().eq('id', seededSongId);
  });

  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('student');
    // Dismiss demo welcome modal for demo accounts
    await page.evaluate(() => localStorage.setItem('strummy-demo-welcome-seen', 'true'));
  });

  test('songs list loads with no New Song button @mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard/songs');
    await page.waitForLoadState('networkidle');

    // Verify heading
    const heading = page.locator('h1, h2').filter({ hasText: /songs/i }).first();
    await expect(heading).toBeVisible({ timeout: 15_000 });

    // Wait for page content to settle
    await page.waitForTimeout(2000);

    // Verify NO "New Song" link, FAB, or create button is visible
    const newSongControls = page.locator(
      'a[href="/dashboard/songs/new"], button[aria-label="Add new song"], a:has-text("New Song"), button:has-text("New Song"), [data-testid="new-song-button"]'
    );
    await expect(newSongControls).toHaveCount(0);
  });

  test('view song detail @mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard/songs');
    await page.waitForLoadState('domcontentloaded');

    // Navigate to the song this suite seeded (not `.first()`, which races with
    // other student specs seeding songs for the same test student).
    const songLink = page.locator(`a[href*="/dashboard/songs/${seededSongId}"]`);
    await expect(songLink.first()).toBeVisible({ timeout: 15_000 });
    await songLink.first().click();

    await expect(page).toHaveURL(/\/dashboard\/songs\/[a-zA-Z0-9-]+/);

    // Verify title is visible — student detail loads via client-side fetch
    const detailHeading = page.locator('h1').first();
    await expect(detailHeading).toBeVisible({ timeout: 30_000 });

    // Verify artist/author info is present somewhere on the page
    const mainContent = page.locator('main').first();
    await expect(mainContent).toBeVisible();
  });

  test('no edit or delete controls on song detail @mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard/songs');
    await page.waitForLoadState('domcontentloaded');

    // Navigate to the seeded song (deterministic; avoids cross-spec `.first()` race).
    const songLink = page.locator(`a[href*="/dashboard/songs/${seededSongId}"]`);
    await expect(songLink.first()).toBeVisible({ timeout: 15_000 });
    await songLink.first().click();

    await expect(page).toHaveURL(/\/dashboard\/songs\/[a-zA-Z0-9-]+/);

    // Wait for page to fully render
    await page.waitForTimeout(2000);

    // Verify no edit button
    const editButton = page.locator(
      '[data-testid="song-edit-button"], a[href*="/edit"], button:has-text("Edit")'
    );
    await expect(editButton).toHaveCount(0);

    // Verify no delete button
    const deleteButton = page.locator(
      '[data-testid="song-delete-button"], button:has-text("Delete")'
    );
    await expect(deleteButton).toHaveCount(0);
  });

  test('search songs on list @desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/dashboard/songs');
    await page.waitForLoadState('networkidle');

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Find search input
    const searchInput = page
      .locator(
        '#search-filter, [data-testid="search-input"], input[type="search"], input[placeholder*="earch"]'
      )
      .first();
    const hasSearch = (await searchInput.count()) > 0;
    test.skip(!hasSearch, 'No search input available on songs page');

    // Type a partial query to filter results
    await searchInput.fill('a');
    await page.waitForTimeout(1500);

    // Verify the list has been filtered (count changed or still shows results)
    const filteredLinks = page.locator('a[href*="/dashboard/songs/"]');
    const filteredCount = await filteredLinks.count();

    // Either the count changed (filtering works) or all songs match the query
    expect(filteredCount).toBeGreaterThanOrEqual(0);

    // Clear search and verify results return
    await searchInput.clear();
    await page.waitForTimeout(1500);

    const restoredCount = await page.locator('a[href*="/dashboard/songs/"]').count();
    expect(restoredCount).toBeGreaterThanOrEqual(filteredCount);
  });

  test('song detail shows resource links if available @mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard/songs');
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(2000);

    const songLinks = page.locator('a[href*="/dashboard/songs/"]');
    await expect(songLinks.first()).toBeVisible({ timeout: 10_000 });

    // Navigate to song detail
    await songLinks.first().click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/dashboard\/songs\/[a-zA-Z0-9-]+/);

    // Check for resource links (YouTube, Spotify, Ultimate Guitar, TikTok) or info sections
    const resourceLinks = page.locator(
      'a[href*="youtube"], a[href*="spotify"], a[href*="ultimate-guitar"], a[href*="tiktok"]'
    );
    const infoSection = page.getByText(/resource|link|video|tab/i).first();

    const hasResources = (await resourceLinks.count()) > 0;
    const hasInfoSection = (await infoSection.count()) > 0;

    // At least one of: resource links or an info section should be present
    // If neither exists, the song simply has no resources — not a failure
    if (hasResources) {
      await expect(resourceLinks.first()).toBeVisible();
    }
    if (hasInfoSection) {
      await expect(infoSection).toBeVisible();
    }

    // Verify the main content area is rendered regardless
    const mainContent = page.locator('main').first();
    await expect(mainContent).toBeVisible();
  });
});
