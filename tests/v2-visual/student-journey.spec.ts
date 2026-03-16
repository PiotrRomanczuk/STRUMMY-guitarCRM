/**
 * Student Journey — v2 Visual Regression Tests
 *
 * LOCAL ONLY — captures screenshots and video for visual verification.
 * Tests all v2 features visible to a student account.
 *
 * Run:
 *   npx playwright test --config playwright.visual.config.ts tests/v2-visual/student-journey.spec.ts
 *
 * Notes:
 * - Students see a DIFFERENT view than teachers/admins on several pages
 * - Songs list: students get v1 StudentSongsPageClient (regardless of v2 cookie)
 * - Lessons list: students get v1 StudentLessonsPageClient (regardless of v2 cookie)
 * - Dashboard, assignments, repertoire, calendar, notifications, settings, profile: v2 when cookie is set
 * - Students CANNOT create lessons, songs, users, or assignments
 * - Students CAN rate their own repertoire songs (self-rating)
 */
import { test, expect } from '@playwright/test';
import { setV2Cookie, waitForV2Content, screenshotPage } from './helpers';
import { loginAsStudent } from '../helpers/auth';

// ---------------------------------------------------------------------------
// Shared setup: set the v2 cookie and log in as student before each test
// ---------------------------------------------------------------------------
test.beforeEach(async ({ page }) => {
  await setV2Cookie(page);
  await loginAsStudent(page);
});

// ---------------------------------------------------------------------------
// 1. Student Dashboard
// ---------------------------------------------------------------------------
test.describe('Feature: Student Dashboard', () => {
  test('student sees v2 dashboard with greeting, stat pills, and practice songs', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await waitForV2Content(page, '[class*="space-y"]');

    // Verify student-specific widgets
    // Greeting contains time-based greeting ("Good morning/afternoon/evening")
    const greeting = page.locator('h1, [class*="MobilePageShell"] h1').first();
    await expect(greeting).toBeVisible({ timeout: 15_000 });
    const greetingText = await greeting.textContent();
    expect(
      greetingText?.match(/Good (morning|afternoon|evening)/i)
    ).toBeTruthy();

    // Stat pills section (songs count, lessons count, tasks count)
    const statPills = page.locator('.flex.gap-2').first();
    await expect(statPills).toBeVisible();

    // What's Next card
    const whatsNext = page.getByText("What's Next", { exact: false });
    await expect(whatsNext).toBeVisible();

    // Practice Songs section
    const practiceSongs = page.getByText('Practice Songs', { exact: false });
    await expect(practiceSongs).toBeVisible();

    // Quick Links section
    const quickLinks = page.getByText('Quick Links', { exact: false });
    await expect(quickLinks).toBeVisible();

    await screenshotPage(page, 'student-dashboard-mobile');
  });

  test('student dashboard shows full page with all sections', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await waitForV2Content(page, '[class*="space-y"]');

    await screenshotPage(page, 'student-dashboard-mobile-full', {
      fullPage: true,
    });
  });
});

// ---------------------------------------------------------------------------
// 2. Song of the Week
// ---------------------------------------------------------------------------
test.describe('Feature: Song of the Week', () => {
  test('student dashboard displays SOTW card if one is active', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await waitForV2Content(page);

    // The SOTW card shows "Song of the Week" heading with a star icon
    const sotwCard = page.getByText('Song of the Week', { exact: false });

    // SOTW may or may not be set — capture either state
    const isVisible = await sotwCard.isVisible().catch(() => false);

    if (isVisible) {
      // Verify student does NOT see admin controls (change/remove buttons)
      const changeSongBtn = page.getByLabel('Change song');
      await expect(changeSongBtn).not.toBeVisible();

      const removeSongBtn = page.getByLabel('Remove song of the week');
      await expect(removeSongBtn).not.toBeVisible();
    }

    await screenshotPage(page, 'student-sotw-mobile');
  });
});

// ---------------------------------------------------------------------------
// 3. Lessons (student view — read-only, v1 component for pure students)
// ---------------------------------------------------------------------------
test.describe('Feature: Lessons', () => {
  test('student sees lessons page (read-only, no create button)', async ({
    page,
  }) => {
    await page.goto('/dashboard/lessons');
    await waitForV2Content(page);

    // Students get the v1 StudentLessonsPageClient, not v2 LessonListV2.
    // The page should still load with lesson content or empty state.
    // Wait for either lesson cards or loading to finish.
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify no "New Lesson" or create button is visible (student cannot create)
    const createButton = page.getByRole('button', {
      name: /new lesson|create/i,
    });
    await expect(createButton).not.toBeVisible();

    await screenshotPage(page, 'student-lessons-mobile');
  });
});

// ---------------------------------------------------------------------------
// 4. Songs (student view — v1 component for pure students)
// ---------------------------------------------------------------------------
test.describe('Feature: Songs', () => {
  test('student sees songs page with song cards', async ({ page }) => {
    await page.goto('/dashboard/songs');
    await waitForV2Content(page);

    // Students get v1 StudentSongsPageClient. Wait for content to load.
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // No "Add song" FAB for students
    const addButton = page.getByRole('button', {
      name: /add.*song|new.*song/i,
    });
    await expect(addButton).not.toBeVisible();

    await screenshotPage(page, 'student-songs-mobile');
  });

  test('student can view a song detail page', async ({ page }) => {
    await page.goto('/dashboard/songs');
    await waitForV2Content(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Try to click the first song card/link
    const firstSong = page
      .locator('a[href*="/dashboard/songs/"]')
      .first();
    const hasSongs = await firstSong.isVisible().catch(() => false);

    if (hasSongs) {
      await firstSong.click();
      await page.waitForLoadState('networkidle');
      await waitForV2Content(page);

      // Verify we navigated to a song detail page
      await expect(page).toHaveURL(/\/dashboard\/songs\/.+/);

      await screenshotPage(page, 'student-song-detail-mobile');
    } else {
      // No songs available — screenshot empty state
      await screenshotPage(page, 'student-songs-empty-mobile');
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Assignments (v2 for students — read-only, no create)
// ---------------------------------------------------------------------------
test.describe('Feature: Assignments', () => {
  test('student sees assignments list without create button', async ({
    page,
  }) => {
    await page.goto('/dashboard/assignments');
    await waitForV2Content(page);

    // Wait for assignment list to load (may show empty state)
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Students should NOT see a create/FAB button
    const fab = page.getByRole('button', {
      name: /create.*assignment/i,
    });
    await expect(fab).not.toBeVisible();

    // Either assignment cards or empty state should be visible
    const content = page.locator(
      '.space-y-2, [class*="items-center"][class*="justify-center"]'
    );
    await expect(content.first()).toBeVisible();

    await screenshotPage(page, 'student-assignments-mobile');
  });
});

// ---------------------------------------------------------------------------
// 6. Repertoire (v2 for students — self-rating is key feature)
// ---------------------------------------------------------------------------
test.describe('Feature: Repertoire', () => {
  test('student sees repertoire page with self-rating capability', async ({
    page,
  }) => {
    await page.goto('/dashboard/repertoire');
    await waitForV2Content(page);

    // V2 repertoire page title
    const title = page.getByText('My Repertoire', { exact: false });
    await expect(title).toBeVisible({ timeout: 15_000 });

    // Subtitle mentioning self-rating
    const subtitle = page.getByText('Rate each song', { exact: false });
    await expect(subtitle).toBeVisible();

    // Either repertoire cards or empty state should be present
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await screenshotPage(page, 'student-repertoire-mobile');
  });

  test('student repertoire full page with all songs', async ({ page }) => {
    await page.goto('/dashboard/repertoire');
    await waitForV2Content(page);

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await screenshotPage(page, 'student-repertoire-mobile-full', {
      fullPage: true,
    });
  });
});

// ---------------------------------------------------------------------------
// 7. Calendar
// ---------------------------------------------------------------------------
test.describe('Feature: Calendar', () => {
  test('student sees calendar page', async ({ page }) => {
    await page.goto('/dashboard/calendar');
    await waitForV2Content(page);

    // Calendar page should load — may show Google connect prompt or events
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify page rendered (either v2 calendar or connect prompt)
    const pageContent = page.locator('main, [class*="container"], [class*="MobilePageShell"]').first();
    await expect(pageContent).toBeVisible();

    await screenshotPage(page, 'student-calendar-mobile');
  });
});

// ---------------------------------------------------------------------------
// 8. Notifications
// ---------------------------------------------------------------------------
test.describe('Feature: Notifications', () => {
  test('student sees notification center', async ({ page }) => {
    await page.goto('/dashboard/notifications');
    await waitForV2Content(page);

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // V2 notification center should render
    const pageContent = page.locator('main, [class*="container"], [class*="MobilePageShell"], [class*="space-y"]').first();
    await expect(pageContent).toBeVisible();

    await screenshotPage(page, 'student-notifications-mobile');
  });
});

// ---------------------------------------------------------------------------
// 9. Settings (v2 toggle is visible here)
// ---------------------------------------------------------------------------
test.describe('Feature: Settings', () => {
  test('student sees settings page with v2 toggle', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await waitForV2Content(page);

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Settings page should render
    const pageContent = page.locator('main, [class*="container"], [class*="MobilePageShell"], [class*="space-y"]').first();
    await expect(pageContent).toBeVisible();

    await screenshotPage(page, 'student-settings-mobile');
  });
});

// ---------------------------------------------------------------------------
// 10. Profile
// ---------------------------------------------------------------------------
test.describe('Feature: Profile', () => {
  test('student sees v2 profile editor', async ({ page }) => {
    await page.goto('/dashboard/profile');
    await waitForV2Content(page);

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Profile page should render
    const pageContent = page.locator('main, [class*="container"], [class*="MobilePageShell"], [class*="space-y"]').first();
    await expect(pageContent).toBeVisible();

    await screenshotPage(page, 'student-profile-mobile');
  });
});
