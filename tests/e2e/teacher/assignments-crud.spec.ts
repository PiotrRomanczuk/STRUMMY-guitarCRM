import { test, expect } from '../../fixtures';

/**
 * Teacher Assignments CRUD E2E Tests
 *
 * Tests the complete assignment lifecycle for a teacher:
 * list, create (step wizard), view detail, edit, status change, delete.
 *
 * Uses a single long-running test for the CRUD lifecycle
 * (create -> view -> edit -> status change -> delete) to share browser context,
 * plus standalone tests for list loading and full-field creation.
 */

const timestamp = Date.now();
const TEST_ASSIGNMENT_TITLE = `E2E Assignment ${timestamp}`;
const TEST_ASSIGNMENT_EDITED = `E2E Assignment ${timestamp} Edited`;
const TEST_ASSIGNMENT_DESCRIPTION = 'Practice fingerpicking pattern for 15 minutes daily';

test.describe('Teacher Assignments CRUD', { tag: ['@teacher', '@assignments'] }, () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('teacher');
  });

  test('assignments list loads @mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard/assignments');
    await page.waitForLoadState('networkidle');

    // Verify heading
    const heading = page
      .locator('h1, h2')
      .filter({ hasText: /assignment/i })
      .first();
    await expect(heading).toBeVisible({ timeout: 15_000 });

    // Verify list or table is visible
    const list = page.locator(
      '[data-testid="assignment-table"], [data-testid="assignment-list-mobile"], .space-y-3'
    );
    await expect(list.first()).toBeVisible({ timeout: 15_000 });

    // Verify New Assignment action exists
    const newAction = page
      .locator('a[href="/dashboard/assignments/new"], button[aria-label="Create assignment"]')
      .first();
    await expect(newAction).toBeVisible({ timeout: 10_000 });
  });

  test('assignment CRUD lifecycle: create -> view -> edit -> status change -> delete', async ({
    page,
  }) => {
    test.setTimeout(120_000);

    // -- CREATE (mobile) --
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard/assignments/new');
    await page.waitForLoadState('networkidle');

    const form = page.locator('[data-testid="assignment-form"]');
    await expect(form).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid="step-wizard-progress"]')).toBeVisible();

    // Step 1: Student -- click shadcn Select trigger, pick first option
    await page.locator('[data-testid="field-student"]').click();
    await page.waitForTimeout(300);
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(300);

    // Step 2: Content
    await page.locator('[data-testid="step-wizard-next"]').click();
    await page.waitForTimeout(500);

    await page.locator('[data-testid="field-title"]').fill(TEST_ASSIGNMENT_TITLE);

    // Step 3: Song (skip)
    await page.locator('[data-testid="step-wizard-next"]').click();
    await page.waitForTimeout(500);

    // Step 4: Schedule (skip)
    await page.locator('[data-testid="step-wizard-next"]').click();
    await page.waitForTimeout(500);

    // Submit
    await page.locator('[data-testid="step-wizard-submit"]').click();
    await expect(page).not.toHaveURL(/\/new/, { timeout: 20_000 });

    // Verify assignment appears in list -- hard-reload to bypass RSC cache
    await page.waitForURL(/\/dashboard\/assignments/, { timeout: 20_000 });
    await page.reload({ waitUntil: 'networkidle' });

    const assignmentLink = page.locator(`a:has-text("${TEST_ASSIGNMENT_TITLE}")`).first();
    await expect(assignmentLink).toBeVisible({ timeout: 15_000 });

    // -- VIEW DETAIL (mobile) --
    await assignmentLink.click();
    await expect(page).toHaveURL(/\/dashboard\/assignments\/[a-zA-Z0-9-]+/, { timeout: 10_000 });
    await page.waitForLoadState('networkidle');

    const detail = page.locator('[data-testid="assignment-detail"]');
    await expect(detail).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(TEST_ASSIGNMENT_TITLE).first()).toBeVisible();

    // -- EDIT (via direct navigation to avoid useAuth race condition) --
    const assignmentUrl = page.url();
    await page.goto(assignmentUrl + '/edit');
    await page.waitForLoadState('networkidle');

    // The edit form may start on Step 1 (Student), navigate to Content step with title field
    const titleField = page.locator('[data-testid="field-title"]');

    if (!(await titleField.isVisible({ timeout: 2_000 }))) {
      const nextBtn = page.locator('[data-testid="step-wizard-next"]');
      for (let i = 0; i < 3; i++) {
        if (await nextBtn.isVisible()) {
          await nextBtn.click();
          await page.waitForTimeout(300);
          if (await titleField.isVisible({ timeout: 500 })) break;
        }
      }
    }

    await expect(titleField).toBeVisible({ timeout: 5_000 });
    await titleField.clear();
    await titleField.fill(TEST_ASSIGNMENT_EDITED);

    // Skip through remaining wizard steps to submit
    const nextBtn = page.locator('[data-testid="step-wizard-next"]');
    while (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(300);
    }
    await page.locator('[data-testid="step-wizard-submit"]').click();
    await expect(page).not.toHaveURL(/\/edit/, { timeout: 20_000 });

    // Verify edit took effect on list
    await page.goto('/dashboard/assignments');
    await page.reload({ waitUntil: 'networkidle' });
    const editedLink = page.locator(`a:has-text("${TEST_ASSIGNMENT_EDITED}")`).first();
    await expect(editedLink).toBeVisible({ timeout: 15_000 });

    // -- STATUS CHANGE (click Start button on detail) --
    await editedLink.click();
    await expect(page).toHaveURL(/\/dashboard\/assignments\/[a-zA-Z0-9-]+/, { timeout: 10_000 });
    await page.waitForLoadState('networkidle');

    const startButton = page.locator('[data-testid="assignment-start-button"]');
    if (await startButton.isVisible({ timeout: 5_000 })) {
      await startButton.click();
      await expect(page.getByText(/in progress/i).first()).toBeVisible({ timeout: 10_000 });
    }

    // -- DELETE (via API) --
    const assignmentId = assignmentUrl.split('/').pop();
    expect(assignmentId).toBeTruthy();

    const response = await page.request.delete(`/api/assignments/${assignmentId}`);
    expect(response.status()).toBeLessThan(400);

    // Verify assignment is gone from list
    await page.goto('/dashboard/assignments');
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator(`a:has-text("${TEST_ASSIGNMENT_EDITED}")`)).toHaveCount(0, {
      timeout: 10_000,
    });
  });

  test('create assignment with all fields @mobile', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard/assignments/new');
    await page.waitForLoadState('networkidle');

    const form = page.locator('[data-testid="assignment-form"]');
    await expect(form).toBeVisible({ timeout: 15_000 });

    // Step 1: Student
    await page.locator('[data-testid="field-student"]').click();
    await page.waitForTimeout(300);
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(300);

    // Step 2: Content
    await page.locator('[data-testid="step-wizard-next"]').click();
    await page.waitForTimeout(500);

    const fullTitle = `E2E Full Assignment ${timestamp}`;
    await page.locator('[data-testid="field-title"]').fill(fullTitle);
    await page.locator('[data-testid="field-description"]').fill(TEST_ASSIGNMENT_DESCRIPTION);

    // Step 3: Song (skip)
    await page.locator('[data-testid="step-wizard-next"]').click();
    await page.waitForTimeout(500);

    // Step 4: Schedule -- fill due date
    await page.locator('[data-testid="step-wizard-next"]').click();
    await page.waitForTimeout(500);

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    const dueDateStr = dueDate.toISOString().slice(0, 10);
    await page.locator('[data-testid="field-due_date"]').fill(dueDateStr);

    // Submit
    await page.locator('[data-testid="step-wizard-submit"]').click();
    await expect(page).not.toHaveURL(/\/new/, { timeout: 20_000 });

    // Verify on list
    await page.goto('/dashboard/assignments');
    await page.reload({ waitUntil: 'networkidle' });
    const createdLink = page.locator(`a:has-text("${fullTitle}")`).first();
    await expect(createdLink).toBeVisible({ timeout: 15_000 });

    // Cleanup via API: navigate to detail to get assignment ID, then delete
    await createdLink.click();
    await expect(page).toHaveURL(/\/dashboard\/assignments\/[a-zA-Z0-9-]+/, { timeout: 10_000 });
    const cleanupId = page.url().split('/').pop();
    if (cleanupId) {
      await page.request.delete(`/api/assignments/${cleanupId}`);
    }
  });
});
