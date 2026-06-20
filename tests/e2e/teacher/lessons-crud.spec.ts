import { test, expect } from '../../fixtures';
import type { Page } from '@playwright/test';

/**
 * Teacher Lessons CRUD E2E Tests
 *
 * Targets the editorial UI:
 *  - List `/dashboard/lessons` — heading + lesson links + "New lesson" affordance.
 *  - Create/Edit `LessonFormEditorial` — single-page form with `#lesson-student`
 *    (select), `#lesson-title`, `#lesson-when` (datetime-local). Submit
 *    "Create lesson" / "Save changes"; on success router.push → the lesson's
 *    detail page (`/dashboard/lessons/[id]`).
 */

const timestamp = Date.now();
const TEST_LESSON_TITLE = `E2E Lesson ${timestamp}`;
const TEST_LESSON_EDITED = `E2E Lesson ${timestamp} Edited`;

async function fillLessonForm(page: Page, title: string) {
  await expect(page.locator('#lesson-title')).toBeVisible({ timeout: 15_000 });
  // Required: a student. Pick the first real option in the select.
  await page.locator('#lesson-student').selectOption({ index: 1 });
  await page.locator('#lesson-title').fill(title);
  await page.locator('#lesson-when').fill('2026-04-15T10:00');
}

test.describe('Teacher Lessons CRUD', { tag: ['@teacher', '@lessons'] }, () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ loginAs }) => {
    await loginAs('teacher');
  });

  test('lessons list loads with heading and New Lesson button @mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard/lessons');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /lessons/i }).first()).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.locator('a[href="/dashboard/lessons/new"]').first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('lesson CRUD lifecycle: create → view → edit → delete', async ({ page }) => {
    test.setTimeout(120_000);

    // ── CREATE ───────────────────────────────────────────────────
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard/lessons/new');
    await page.waitForLoadState('networkidle');

    await fillLessonForm(page, TEST_LESSON_TITLE);
    await page.getByRole('button', { name: 'Create lesson' }).click();

    await page.waitForURL(/\/dashboard\/lessons\/[0-9a-f-]{36}$/, { timeout: 20_000 });
    const lessonUrl = page.url();

    // ── VIEW DETAIL ──────────────────────────────────────────────
    await expect(page.getByText(TEST_LESSON_TITLE).first()).toBeVisible({ timeout: 10_000 });

    // ── EDIT ─────────────────────────────────────────────────────
    await page.goto(lessonUrl + '/edit', { timeout: 45_000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#lesson-title')).toBeVisible({ timeout: 10_000 });
    await page.locator('#lesson-title').fill(TEST_LESSON_EDITED);
    await page.getByRole('button', { name: 'Save changes' }).click();
    await page.waitForURL(/\/dashboard\/lessons\/[0-9a-f-]{36}$/, { timeout: 20_000 });
    await expect(page).not.toHaveURL(/\/edit/);
    await expect(page.getByText(TEST_LESSON_EDITED).first()).toBeVisible({ timeout: 10_000 });

    // ── DELETE (via API) ─────────────────────────────────────────
    const lessonId = lessonUrl.split('/').pop();
    expect(lessonId).toBeTruthy();
    const response = await page.request.delete(`/api/lessons/${lessonId}`);
    expect(response.status()).toBeLessThan(400);

    // Detail page should no longer resolve to the lesson.
    await page.goto(lessonUrl);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(TEST_LESSON_EDITED)).toHaveCount(0, { timeout: 10_000 });
  });
});
