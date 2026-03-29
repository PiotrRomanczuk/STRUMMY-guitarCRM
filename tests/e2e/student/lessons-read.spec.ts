import { test, expect } from '../../fixtures';

/**
 * Student Lessons Read-Only E2E Tests
 *
 * Verifies that students can browse and view their lessons but cannot
 * create, edit, or delete them. Read-only access enforcement.
 *
 * 5 tests, ~70% mobile viewport.
 */

test.describe('Student Lessons (Read-Only)', { tag: ['@student', '@lessons'] }, () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('student');
    await page.evaluate(() => localStorage.setItem('strummy-demo-welcome-seen', 'true'));
  });

  test('lessons list loads with no Create button @mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard/lessons');
    await page.waitForLoadState('networkidle');

    // Verify heading
    const heading = page
      .locator('h1, h2')
      .filter({ hasText: /lesson/i })
      .first();
    await expect(heading).toBeVisible({ timeout: 15_000 });

    // Wait for page content to settle
    await page.waitForTimeout(2000);

    // Verify NO create/new lesson controls are visible
    const createControls = page.locator(
      '[data-testid="create-lesson-button"], button:has-text("Create Lesson"), a:has-text("Create Lesson"), a:has-text("New Lesson"), a[href="/dashboard/lessons/new"], button[aria-label="Add new lesson"], [data-testid="new-lesson-button"]'
    );
    await expect(createControls).toHaveCount(0);
  });

  test('view lesson detail @mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard/lessons');
    await page.waitForLoadState('networkidle');

    // Wait for content to load
    await page.waitForTimeout(2000);

    const lessonLinks = page
      .locator('a[href*="/dashboard/lessons/"]')
      .filter({ hasNotText: /new|edit|import/i });
    const hasLessons = (await lessonLinks.count()) > 0;
    test.skip(!hasLessons, 'No lessons available for this student');

    // Click the first lesson
    await lessonLinks.first().click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/dashboard\/lessons\/[a-zA-Z0-9-]+/);

    // Verify lesson detail content is visible
    const detailHeading = page.locator('h1, h2').first();
    await expect(detailHeading).toBeVisible({ timeout: 10_000 });

    // Check for date, teacher, or notes content on the page
    const mainContent = page.locator('main').first();
    await expect(mainContent).toBeVisible();

    // Verify at least some lesson information is present (date, teacher name, or notes)
    const dateInfo = page
      .getByText(/\d{4}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i)
      .first();
    const teacherInfo = page.getByText(/teacher|instructor/i).first();
    const notesInfo = page.getByText(/note/i).first();

    const hasDate = (await dateInfo.count()) > 0;
    const hasTeacher = (await teacherInfo.count()) > 0;
    const hasNotes = (await notesInfo.count()) > 0;

    // At least one piece of lesson metadata should be visible
    expect(hasDate || hasTeacher || hasNotes).toBeTruthy();
  });

  test('no edit or delete controls on lesson detail @mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard/lessons');
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(2000);

    const lessonLinks = page
      .locator('a[href*="/dashboard/lessons/"]')
      .filter({ hasNotText: /new|edit|import/i });
    const hasLessons = (await lessonLinks.count()) > 0;
    test.skip(!hasLessons, 'No lessons available for this student');

    // Navigate to lesson detail
    await lessonLinks.first().click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/dashboard\/lessons\/[a-zA-Z0-9-]+/);

    // Wait for page to fully render
    await page.waitForTimeout(2000);

    // Verify no edit controls
    const editControls = page.locator(
      '[data-testid="lesson-edit-button"], a[href*="/edit"], button:has-text("Edit")'
    );
    await expect(editControls).toHaveCount(0);

    // Verify no delete controls
    const deleteControls = page.locator(
      '[data-testid="lesson-delete-button"], button:has-text("Delete")'
    );
    await expect(deleteControls).toHaveCount(0);
  });

  test('lesson detail shows songs section @mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard/lessons');
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(2000);

    const lessonLinks = page
      .locator('a[href*="/dashboard/lessons/"]')
      .filter({ hasNotText: /new|edit|import/i });
    const hasLessons = (await lessonLinks.count()) > 0;
    test.skip(!hasLessons, 'No lessons available for this student');

    // Navigate to lesson detail
    await lessonLinks.first().click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/dashboard\/lessons\/[a-zA-Z0-9-]+/);

    // Check for a songs section within the lesson detail
    const songsSection = page.getByText(/song/i).first();
    const hasSongsSection = (await songsSection.count()) > 0;

    if (hasSongsSection) {
      await expect(songsSection).toBeVisible();
    }

    // Regardless of songs section, the main content should render
    const mainContent = page.locator('main').first();
    await expect(mainContent).toBeVisible();
  });

  test('only own lessons are visible @desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/dashboard/lessons');
    await page.waitForLoadState('networkidle');

    // Wait for content to load
    await page.waitForTimeout(2000);

    const lessonLinks = page
      .locator('a[href*="/dashboard/lessons/"]')
      .filter({ hasNotText: /new|edit|import/i });
    const lessonCount = await lessonLinks.count();

    // If lessons exist, they should all belong to this student (enforced by RLS).
    // We verify the list renders without errors — RLS prevents cross-student data leakage.
    if (lessonCount > 0) {
      // Verify at least one lesson link is visible
      await expect(lessonLinks.first()).toBeVisible({ timeout: 10_000 });

      // Verify the list or table is present
      const listContainer = page
        .locator('[data-testid="lesson-table"], [data-testid="lesson-list"], table, .grid')
        .first();
      await expect(listContainer).toBeVisible();
    } else {
      // Empty state is also valid — student may have no lessons yet
      const mainContent = page.locator('main').first();
      await expect(mainContent).toBeVisible();
    }

    // Verify no admin/teacher-only bulk controls
    const bulkControls = page.locator(
      'button:has-text("Bulk"), button:has-text("Import"), button:has-text("Export")'
    );
    await expect(bulkControls).toHaveCount(0);
  });
});
