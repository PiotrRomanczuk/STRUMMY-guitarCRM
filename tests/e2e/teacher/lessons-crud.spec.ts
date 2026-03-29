import { test, expect } from '../../fixtures';

/**
 * Teacher Lessons CRUD E2E Tests
 *
 * Tests the complete lesson lifecycle for a teacher:
 * list, create (step wizard with student picker), view detail, edit, delete.
 *
 * Uses a single long-running test for the CRUD lifecycle
 * (create -> view -> edit -> delete) to share browser context,
 * plus standalone tests for list loading and full-field creation.
 */

const timestamp = Date.now();
const TEST_LESSON_TITLE = `E2E Lesson ${timestamp}`;
const TEST_LESSON_EDITED = `E2E Lesson ${timestamp} Edited`;

test.describe('Teacher Lessons CRUD', { tag: ['@teacher', '@lessons'] }, () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('teacher');
  });

  test('lessons list loads with status filter @mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard/lessons');
    await page.waitForLoadState('networkidle');

    // Verify heading
    const heading = page
      .locator('h1, h2')
      .filter({ hasText: /lessons/i })
      .first();
    await expect(heading).toBeVisible({ timeout: 15_000 });

    // Verify lesson list is visible
    const list = page.locator('[data-testid="lesson-table"], [data-testid="lesson-list-mobile"]');
    await expect(list).toBeVisible({ timeout: 15_000 });

    // Verify status filter chips are visible (CollapsibleFilterBar)
    const filterBar = page.locator('button:has-text("All"), button:has-text("Scheduled")');
    await expect(filterBar.first()).toBeVisible({ timeout: 5_000 });
  });

  test('lesson CRUD lifecycle: create -> view -> edit -> delete', async ({ page }) => {
    test.setTimeout(120_000);

    // -- CREATE (mobile) --
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard/lessons/new');
    await page.waitForLoadState('networkidle');

    const form = page.locator('[data-testid="lesson-form"]');
    await expect(form).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid="step-wizard-progress"]')).toBeVisible();

    // Step 1: Student -- open FullScreenSearchPicker and select first student
    await page.locator('[data-testid="student-picker-button"]').click();
    await page.waitForTimeout(1000); // Wait for overlay animation + async student load

    const overlay = page.locator('.fixed.inset-0.z-50');
    await expect(overlay).toBeVisible({ timeout: 5_000 });

    // nth(0) is the X close button, nth(1) is the first student in the list
    const firstStudent = overlay.locator('button').nth(1);
    await expect(firstStudent).toBeVisible({ timeout: 5_000 });
    await firstStudent.click();
    await page.waitForTimeout(300);

    // Step 2: Songs (skip)
    await page.locator('[data-testid="step-wizard-next"]').click();
    await page.waitForTimeout(500);

    // Step 3: Schedule
    await page.locator('[data-testid="step-wizard-next"]').click();
    await page.waitForTimeout(500);

    await page.locator('[data-testid="field-scheduled_at"]').fill('2026-04-15T10:00');
    await page.waitForTimeout(300);

    // Step 4: Notes
    await page.locator('[data-testid="step-wizard-next"]').click();
    await page.waitForTimeout(500);

    // Fill title
    await page.locator('[data-testid="field-title"]').fill(TEST_LESSON_TITLE);

    // Submit
    await page.locator('[data-testid="step-wizard-submit"]').click();
    await expect(page).not.toHaveURL(/\/new/, { timeout: 20_000 });

    // Verify lesson appears in list -- hard-reload to bypass RSC cache
    await page.waitForURL(/\/dashboard\/lessons/, { timeout: 20_000 });
    await page.reload({ waitUntil: 'networkidle' });

    // Mobile list uses buttons (LessonCard), desktop uses links
    const lessonCard = page
      .locator(`button:has-text("${TEST_LESSON_TITLE}"), a:has-text("${TEST_LESSON_TITLE}")`)
      .first();
    await expect(lessonCard).toBeVisible({ timeout: 15_000 });

    // -- VIEW DETAIL (mobile) --
    await lessonCard.click();
    await expect(page).toHaveURL(/\/dashboard\/lessons\/[a-zA-Z0-9-]+/, { timeout: 10_000 });
    await page.waitForLoadState('networkidle');

    // Verify detail page content
    const detailTitle = page.locator('h1, h2').filter({ hasText: TEST_LESSON_TITLE }).first();
    await expect(detailTitle).toBeVisible({ timeout: 10_000 });

    // -- EDIT (via direct navigation to avoid useAuth race condition) --
    const lessonUrl = page.url();
    await page.goto(lessonUrl + '/edit');
    await page.waitForLoadState('networkidle');

    const titleInput = page.locator('[data-testid="field-title"]');
    await expect(titleInput).toBeVisible({ timeout: 10_000 });
    await titleInput.clear();
    await titleInput.fill(TEST_LESSON_EDITED);

    // Skip through wizard to submit
    const nextBtn = page.locator('[data-testid="step-wizard-next"]');
    while (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(300);
    }
    await page.locator('[data-testid="step-wizard-submit"]').click();
    await expect(page).not.toHaveURL(/\/edit/, { timeout: 20_000 });

    // Verify edit took effect on list
    await page.goto('/dashboard/lessons');
    await page.reload({ waitUntil: 'networkidle' });
    const editedCard = page
      .locator(`button:has-text("${TEST_LESSON_EDITED}"), a:has-text("${TEST_LESSON_EDITED}")`)
      .first();
    await expect(editedCard).toBeVisible({ timeout: 15_000 });

    // -- DELETE (via API) --
    // Extract lesson ID from the URL we saved earlier
    const lessonId = lessonUrl.split('/').pop();
    expect(lessonId).toBeTruthy();

    const response = await page.request.delete(`/api/lessons/${lessonId}`);
    expect(response.status()).toBeLessThan(400);

    // Verify lesson is gone from list
    await page.reload({ waitUntil: 'networkidle' });
    await expect(
      page.locator(`button:has-text("${TEST_LESSON_EDITED}"), a:has-text("${TEST_LESSON_EDITED}")`)
    ).toHaveCount(0, { timeout: 10_000 });
  });

  test('create lesson with title and notes @mobile', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard/lessons/new');
    await page.waitForLoadState('networkidle');

    const form = page.locator('[data-testid="lesson-form"]');
    await expect(form).toBeVisible({ timeout: 15_000 });

    // Step 1: Student -- open picker and select first student
    await page.locator('[data-testid="student-picker-button"]').click();
    await page.waitForTimeout(1000);

    const overlay = page.locator('.fixed.inset-0.z-50');
    await expect(overlay).toBeVisible({ timeout: 5_000 });
    const firstStudent = overlay.locator('button').nth(1);
    await expect(firstStudent).toBeVisible({ timeout: 5_000 });
    await firstStudent.click();
    await page.waitForTimeout(300);

    // Step 2: Songs (skip)
    await page.locator('[data-testid="step-wizard-next"]').click();
    await page.waitForTimeout(500);

    // Step 3: Schedule
    await page.locator('[data-testid="step-wizard-next"]').click();
    await page.waitForTimeout(500);
    await page.locator('[data-testid="field-scheduled_at"]').fill('2026-04-16T14:30');
    await page.waitForTimeout(300);

    // Step 4: Notes
    await page.locator('[data-testid="step-wizard-next"]').click();
    await page.waitForTimeout(500);

    const fullTitle = `E2E Full Lesson ${timestamp}`;
    await page.locator('[data-testid="field-title"]').fill(fullTitle);

    const notesField = page.locator('[data-testid="field-notes"]');
    if (await notesField.isVisible()) {
      await notesField.fill(`Notes for E2E lesson ${timestamp}`);
    }

    // Submit
    await page.locator('[data-testid="step-wizard-submit"]').click();
    await expect(page).not.toHaveURL(/\/new/, { timeout: 20_000 });

    // Verify on list
    await page.goto('/dashboard/lessons');
    await page.reload({ waitUntil: 'networkidle' });
    const createdCard = page
      .locator(`button:has-text("${fullTitle}"), a:has-text("${fullTitle}")`)
      .first();
    await expect(createdCard).toBeVisible({ timeout: 15_000 });

    // Cleanup via API: navigate to detail to get lesson ID, then delete
    await createdCard.click();
    await expect(page).toHaveURL(/\/dashboard\/lessons\/[a-zA-Z0-9-]+/, { timeout: 10_000 });
    const cleanupId = page.url().split('/').pop();
    if (cleanupId) {
      await page.request.delete(`/api/lessons/${cleanupId}`);
    }
  });
});
