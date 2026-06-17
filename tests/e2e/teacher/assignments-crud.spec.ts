import { test, expect } from '../../fixtures';
import type { Page } from '@playwright/test';

/**
 * Teacher Assignments CRUD E2E Tests
 *
 * Targets the editorial UI:
 *  - List `/dashboard/assignments` — heading + "New assignment" affordance.
 *  - Create/Edit `AssignmentCreateEditorial` — single-page form with
 *    `#assignment-student` (select), `#assignment-title`, `#assignment-due`.
 *    Submit "Create assignment" / "Save changes"; on success router.push → the
 *    assignment's detail page (`/dashboard/assignments/[id]`).
 */

const timestamp = Date.now();
const TEST_ASSIGNMENT_TITLE = `E2E Assignment ${timestamp}`;
const TEST_ASSIGNMENT_EDITED = `E2E Assignment ${timestamp} Edited`;

async function fillAssignmentForm(page: Page, title: string) {
  await expect(page.locator('#assignment-title')).toBeVisible({ timeout: 15_000 });
  // Required: a student. Pick the first real option in the select.
  await page.locator('#assignment-student').selectOption({ index: 1 });
  await page.locator('#assignment-title').fill(title);
}

test.describe('Teacher Assignments CRUD', { tag: ['@teacher', '@assignments'] }, () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('teacher');
  });

  test('assignments list loads with heading and New Assignment button @mobile', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard/assignments');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /assignments/i }).first()).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.locator('a[href="/dashboard/assignments/new"]').first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('assignment CRUD lifecycle: create → view → edit → delete', async ({ page }) => {
    test.setTimeout(120_000);

    // ── CREATE ───────────────────────────────────────────────────
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard/assignments/new');
    await page.waitForLoadState('networkidle');

    await fillAssignmentForm(page, TEST_ASSIGNMENT_TITLE);
    await page.getByRole('button', { name: 'Create assignment' }).click();

    await page.waitForURL(/\/dashboard\/assignments\/[0-9a-f-]{36}$/, { timeout: 20_000 });
    const assignmentUrl = page.url();

    // ── VIEW DETAIL ──────────────────────────────────────────────
    await expect(page.getByText(TEST_ASSIGNMENT_TITLE).first()).toBeVisible({ timeout: 10_000 });

    // ── EDIT ─────────────────────────────────────────────────────
    await page.goto(assignmentUrl + '/edit');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#assignment-title')).toBeVisible({ timeout: 10_000 });
    await page.locator('#assignment-title').fill(TEST_ASSIGNMENT_EDITED);
    await page.getByRole('button', { name: 'Save changes' }).click();
    await page.waitForURL(/\/dashboard\/assignments\/[0-9a-f-]{36}$/, { timeout: 20_000 });
    await expect(page).not.toHaveURL(/\/edit/);
    await expect(page.getByText(TEST_ASSIGNMENT_EDITED).first()).toBeVisible({ timeout: 10_000 });

    // ── DELETE (via API) ─────────────────────────────────────────
    const assignmentId = assignmentUrl.split('/').pop();
    expect(assignmentId).toBeTruthy();
    const response = await page.request.delete(`/api/assignments/${assignmentId}`);
    expect(response.status()).toBeLessThan(400);

    await page.goto(assignmentUrl);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(TEST_ASSIGNMENT_EDITED)).toHaveCount(0, { timeout: 10_000 });
  });
});
