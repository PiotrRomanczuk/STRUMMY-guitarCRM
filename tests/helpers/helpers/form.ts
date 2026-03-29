import { Page, expect } from '@playwright/test';

/**
 * Fill form field by data-testid
 */
export async function fillFormField(
  page: Page,
  testId: string,
  value: string
): Promise<void> {
  const field = page.locator(`[data-testid="${testId}"]`);
  await field.clear();
  await field.fill(value);
}

/**
 * Select option in shadcn/ui Select component
 */
export async function selectShadcnOption(
  page: Page,
  triggerTestId: string,
  optionIndex: number = 0
): Promise<void> {
  // Click the select trigger to open dropdown
  await page.locator(`[data-testid="${triggerTestId}"]`).click();

  // Wait for dropdown to open
  await page.waitForTimeout(500);

  // Click the option by index
  const options = page.locator('[role="option"]');
  await options.nth(optionIndex).click();

  // Wait for dropdown to close
  await page.waitForTimeout(500);
}

/**
 * Verify toast message appears
 */
export async function verifyToast(
  page: Page,
  message: string,
  type: 'success' | 'error' | 'info' = 'success'
): Promise<void> {
  const toast = page.locator('[data-testid="toast"], [role="status"], .toast');
  await expect(toast).toContainText(message, { timeout: 10000 });
}

/**
 * Fill complete lesson form
 */
export interface LessonFormData {
  title: string;
  studentIndex?: number;
  teacherIndex?: number;
  scheduledAt?: string;
  notes?: string;
  status?: string;
}

export async function fillLessonForm(
  page: Page,
  data: LessonFormData
): Promise<void> {
  // Wait for form to be visible
  await page.waitForSelector('[data-testid="lesson-student_id"]', { timeout: 10000 });

  // Select student
  if (data.studentIndex !== undefined) {
    await selectShadcnOption(page, 'lesson-student_id', data.studentIndex);
  }

  // Select teacher
  if (data.teacherIndex !== undefined) {
    await selectShadcnOption(page, 'lesson-teacher_id', data.teacherIndex);
  }

  // Fill title
  await fillFormField(page, 'lesson-title', data.title);

  // Fill scheduled date/time if provided
  if (data.scheduledAt) {
    await fillFormField(page, 'lesson-scheduled-at', data.scheduledAt);
  }

  // Fill notes if provided
  if (data.notes) {
    await fillFormField(page, 'lesson-notes', data.notes);
  }

  // Select status if provided
  if (data.status) {
    await selectShadcnOption(page, 'lesson-status', 0);
  }
}

/**
 * Submit form and wait for navigation
 */
export async function submitForm(
  page: Page,
  submitTestId: string = 'lesson-submit'
): Promise<void> {
  const submitButton = page.locator(`[data-testid="${submitTestId}"]`);
  await expect(submitButton).toBeVisible();
  await expect(submitButton).toBeEnabled();
  await submitButton.click();
}
