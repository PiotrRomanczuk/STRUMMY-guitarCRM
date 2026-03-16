/**
 * Admin/Teacher Journey -- v2 Visual Verification Tests
 *
 * LOCAL ONLY: These tests capture screenshots and video for manual visual review.
 * They are NOT run in CI. Run with:
 *
 *   npx playwright test --config playwright.visual.config.ts tests/v2-visual/admin-journey.spec.ts
 *
 * The admin user (p.romanczuk@gmail.com) has all roles and sees all v2 features.
 * Each test sets the v2 cookie, logs in, navigates to a route, verifies key
 * elements are present, and captures a screenshot.
 */

import { test, expect } from '@playwright/test';
import { setV2Cookie, waitForV2Content, screenshotPage } from './helpers';
import { loginAsAdmin } from '../helpers/auth';

// -------------------------------------------------------------------
// Shared setup: set v2 cookie and log in before each test
// -------------------------------------------------------------------
test.beforeEach(async ({ page }) => {
  await setV2Cookie(page);
  await loginAsAdmin(page);
});

// -------------------------------------------------------------------
// 1. Dashboard
// -------------------------------------------------------------------
test.describe('Feature: Dashboard', () => {
  test('admin sees v2 teacher dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForV2Content(page);

    // The teacher dashboard renders a greeting and stats widget
    // MobilePageShell uses an h1 for the title; the greeting is dynamic
    await expect(
      page.locator('h1').filter({ hasText: /good (morning|afternoon|evening)/i })
    ).toBeVisible({ timeout: 15_000 });

    await screenshotPage(page, 'admin-dashboard', { fullPage: true });
  });
});

// -------------------------------------------------------------------
// 2. Lessons
// -------------------------------------------------------------------
test.describe('Feature: Lessons', () => {
  test('admin sees v2 lesson list', async ({ page }) => {
    await page.goto('/dashboard/lessons');
    await waitForV2Content(page, 'h1:has-text("Lessons")');

    await expect(page.locator('h1').filter({ hasText: 'Lessons' })).toBeVisible();

    await screenshotPage(page, 'admin-lessons-list', { fullPage: true });
  });

  test('admin sees v2 lesson detail', async ({ page }) => {
    test.slow();
    await page.goto('/dashboard/lessons');
    await waitForV2Content(page, 'h1:has-text("Lessons")');

    // Click the first lesson card (button element inside the card list)
    const firstLesson = page.locator('button').filter({ hasText: /lesson|untitled/i }).first();
    const hasLesson = await firstLesson.isVisible().catch(() => false);

    if (hasLesson) {
      await firstLesson.click();
      await page.waitForURL('**/dashboard/lessons/**');
      await waitForV2Content(page);
      await screenshotPage(page, 'admin-lesson-detail');
    } else {
      // No lessons available -- screenshot the empty state
      await screenshotPage(page, 'admin-lesson-detail-empty');
    }
  });
});

// -------------------------------------------------------------------
// 3. Songs
// -------------------------------------------------------------------
test.describe('Feature: Songs', () => {
  test('admin sees v2 song list', async ({ page }) => {
    await page.goto('/dashboard/songs');
    await waitForV2Content(page);

    // SongList renders song cards or an empty state
    await expect(page.locator('body')).toBeVisible();

    await screenshotPage(page, 'admin-songs-list', { fullPage: true });
  });

  test('admin sees v2 song detail with tabs', async ({ page }) => {
    test.slow();
    await page.goto('/dashboard/songs');
    await waitForV2Content(page);

    // Navigate to the first song
    const firstSong = page.locator('a[href*="/dashboard/songs/"]').first();
    const hasSong = await firstSong.isVisible().catch(() => false);

    if (hasSong) {
      await firstSong.click();
      await page.waitForURL('**/dashboard/songs/**');
      await waitForV2Content(page);
      await screenshotPage(page, 'admin-song-detail');
    } else {
      await screenshotPage(page, 'admin-song-detail-empty');
    }
  });
});

// -------------------------------------------------------------------
// 4. Assignments
// -------------------------------------------------------------------
test.describe('Feature: Assignments', () => {
  test('admin sees v2 assignment list', async ({ page }) => {
    await page.goto('/dashboard/assignments');
    await waitForV2Content(page);

    // v2 assignment list renders either cards or "No assignments yet" empty state
    await expect(
      page.getByText(/assignment/i).first()
    ).toBeVisible({ timeout: 15_000 });

    await screenshotPage(page, 'admin-assignments-list', { fullPage: true });
  });
});

// -------------------------------------------------------------------
// 5. Repertoire
// -------------------------------------------------------------------
test.describe('Feature: Repertoire', () => {
  test('admin sees v2 repertoire page', async ({ page }) => {
    await page.goto('/dashboard/repertoire');
    await waitForV2Content(page);

    // MobilePageShell renders title "Student Repertoire" or "My Repertoire"
    await expect(
      page.locator('h1').filter({ hasText: /repertoire/i })
    ).toBeVisible({ timeout: 15_000 });

    await screenshotPage(page, 'admin-repertoire', { fullPage: true });
  });
});

// -------------------------------------------------------------------
// 6. Users
// -------------------------------------------------------------------
test.describe('Feature: Users', () => {
  test('admin sees v2 user list', async ({ page }) => {
    await page.goto('/dashboard/users');
    await waitForV2Content(page);

    // UserList renders user cards/rows
    await expect(page.locator('body')).toBeVisible();

    await screenshotPage(page, 'admin-users-list', { fullPage: true });
  });

  test('admin sees v2 user detail', async ({ page }) => {
    test.slow();
    await page.goto('/dashboard/users');
    await waitForV2Content(page);

    // Navigate to the first user
    const firstUser = page.locator('a[href*="/dashboard/users/"]').first();
    const hasUser = await firstUser.isVisible().catch(() => false);

    if (hasUser) {
      await firstUser.click();
      await page.waitForURL('**/dashboard/users/**');
      await waitForV2Content(page);
      await screenshotPage(page, 'admin-user-detail');
    } else {
      await screenshotPage(page, 'admin-user-detail-empty');
    }
  });
});

// -------------------------------------------------------------------
// 7. Calendar
// -------------------------------------------------------------------
test.describe('Feature: Calendar', () => {
  test('admin sees v2 calendar', async ({ page }) => {
    await page.goto('/dashboard/calendar');
    await waitForV2Content(page);

    // Calendar renders either the WeekStrip or the "not connected" state
    // Both are valid v2 states worth capturing
    await expect(page.locator('body')).toBeVisible();

    await screenshotPage(page, 'admin-calendar', { fullPage: true });
  });
});

// -------------------------------------------------------------------
// 8. Notifications
// -------------------------------------------------------------------
test.describe('Feature: Notifications', () => {
  test('admin sees v2 notification center', async ({ page }) => {
    await page.goto('/dashboard/notifications');
    await waitForV2Content(page);

    // v2 NotificationCenter has an h1 "Notifications" on mobile
    await expect(
      page.locator('h1').filter({ hasText: /notification/i })
    ).toBeVisible({ timeout: 15_000 });

    await screenshotPage(page, 'admin-notifications', { fullPage: true });
  });
});

// -------------------------------------------------------------------
// 9. Settings
// -------------------------------------------------------------------
test.describe('Feature: Settings', () => {
  test('admin sees v2 settings page', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await waitForV2Content(page, 'h1:has-text("Settings")');

    await expect(page.locator('h1').filter({ hasText: 'Settings' })).toBeVisible();

    await screenshotPage(page, 'admin-settings', { fullPage: true });
  });
});

// -------------------------------------------------------------------
// 10. Theory
// -------------------------------------------------------------------
test.describe('Feature: Theory', () => {
  test('admin sees v2 theory course list', async ({ page }) => {
    await page.goto('/dashboard/theory');
    await waitForV2Content(page);

    // v2 CourseList inside MobilePageShell or desktop grid -- content varies
    await expect(page.locator('body')).toBeVisible();

    await screenshotPage(page, 'admin-theory-list', { fullPage: true });
  });
});

// -------------------------------------------------------------------
// 11. Stats
// -------------------------------------------------------------------
test.describe('Feature: Stats', () => {
  test('admin sees v2 stats overview', async ({ page }) => {
    await page.goto('/dashboard/admin/stats/lessons');
    await waitForV2Content(page);

    // StatsOverview uses MobilePageShell with title "Statistics"
    await expect(
      page.locator('h1').filter({ hasText: /statistic/i })
    ).toBeVisible({ timeout: 15_000 });

    await screenshotPage(page, 'admin-stats-overview', { fullPage: true });
  });
});

// -------------------------------------------------------------------
// 12. Health Check (admin-only debug route)
// -------------------------------------------------------------------
test.describe('Feature: Health Check', () => {
  test('admin sees v2 health check page', async ({ page }) => {
    await page.goto('/dashboard/admin/debug');
    await waitForV2Content(page, 'h1:has-text("Health Check")');

    await expect(
      page.locator('h1').filter({ hasText: /health check/i })
    ).toBeVisible({ timeout: 15_000 });

    await screenshotPage(page, 'admin-health-check', { fullPage: true });
  });
});

// -------------------------------------------------------------------
// 13. Cohorts
// -------------------------------------------------------------------
test.describe('Feature: Cohorts', () => {
  test('admin sees v2 cohort dashboard', async ({ page }) => {
    await page.goto('/dashboard/cohorts');
    await waitForV2Content(page);

    // CohortDashboard uses MobilePageShell with title "Cohorts"
    await expect(
      page.locator('h1').filter({ hasText: /cohort/i })
    ).toBeVisible({ timeout: 15_000 });

    await screenshotPage(page, 'admin-cohorts', { fullPage: true });
  });
});

// -------------------------------------------------------------------
// 14. Assignment Templates
// -------------------------------------------------------------------
test.describe('Feature: Assignment Templates', () => {
  test('admin sees v2 assignment templates page', async ({ page }) => {
    await page.goto('/dashboard/assignments/templates');
    await waitForV2Content(page);

    await expect(page.locator('body')).toBeVisible();

    await screenshotPage(page, 'admin-assignment-templates', { fullPage: true });
  });
});
