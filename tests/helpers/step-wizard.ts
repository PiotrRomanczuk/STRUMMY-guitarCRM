import { Page, expect } from '@playwright/test';
import { fillFormField, selectShadcnOption } from './form';

// ---------------------------------------------------------------------------
// Core wizard navigation
// ---------------------------------------------------------------------------

/**
 * Click the "Next" button to advance to the next wizard step.
 * Waits for the step transition to settle before returning.
 */
export async function advanceStep(page: Page): Promise<void> {
  const nextButton = page.locator('[data-testid="step-wizard-next"]');
  await expect(nextButton).toBeVisible();
  await expect(nextButton).toBeEnabled();
  await nextButton.click();
  // Allow step transition animation / re-render to complete
  await page.waitForTimeout(300);
}

/**
 * Click the "Previous" button to go back one wizard step.
 * Waits for the step transition to settle before returning.
 */
export async function goBackStep(page: Page): Promise<void> {
  const previousButton = page.locator('[data-testid="step-wizard-previous"]');
  await expect(previousButton).toBeVisible();
  await previousButton.click();
  await page.waitForTimeout(300);
}

/**
 * Click the "Submit" button on the final wizard step.
 * Waits for the form submission network activity to finish.
 */
export async function submitWizard(page: Page): Promise<void> {
  const submitButton = page.locator('[data-testid="step-wizard-submit"]');
  await expect(submitButton).toBeVisible();
  await expect(submitButton).toBeEnabled();
  await submitButton.click();
}

// ---------------------------------------------------------------------------
// Song form wizard
// ---------------------------------------------------------------------------

interface SongWizardData {
  title: string;
  author: string;
  /** Index in the level select dropdown (default: 1 = beginner) */
  levelIndex?: number;
  /** Index in the key select dropdown (default: 2) */
  keyIndex?: number;
  youtubeUrl?: string;
  chords?: string;
}

/**
 * Fill all steps of the Song wizard form and submit.
 *
 * Song form steps:
 *   1. Basic Information — title, author, level (select), key (select)
 *   2. Resources & Media — youtube_url, spotify_link_url, ultimate_guitar_link, tiktok_short_url
 *   3. Musical Details — capo_fret, tempo, strumming_pattern, chords
 */
export async function fillSongWizard(page: Page, data: SongWizardData): Promise<void> {
  // Ensure the song form is visible
  await expect(page.locator('[data-testid="song-form"]')).toBeVisible({
    timeout: 10000,
  });

  // --- Step 1: Basic Information ---
  await fillFormField(page, 'field-title', data.title);
  await fillFormField(page, 'field-author', data.author);
  await selectShadcnOption(page, 'field-level', data.levelIndex ?? 1);
  await selectShadcnOption(page, 'field-key', data.keyIndex ?? 2);

  await advanceStep(page);

  // --- Step 2: Resources & Media ---
  if (data.youtubeUrl) {
    await fillFormField(page, 'field-youtube_url', data.youtubeUrl);
  }
  // Skip optional fields unless caller needs them — just advance
  await advanceStep(page);

  // --- Step 3: Musical Details ---
  if (data.chords) {
    await fillFormField(page, 'field-chords', data.chords);
  }

  // Submit from last step
  await submitWizard(page);
}

// ---------------------------------------------------------------------------
// Lesson form wizard
// ---------------------------------------------------------------------------

interface LessonWizardData {
  /** datetime-local format, e.g. "2026-04-01T10:00" */
  scheduledAt: string;
  title?: string;
  notes?: string;
  // Student and song selection are handled separately via picker modals
  // before or after calling this helper.
}

/**
 * Fill all steps of the Lesson wizard form and submit.
 *
 * Lesson form steps:
 *   1. Student — student-picker-button (must be selected before calling, or caller opens picker)
 *   2. Songs — song-picker-button (optional, caller handles)
 *   3. Schedule — field-scheduled_at (datetime-local)
 *   4. Notes — field-title, field-notes
 *
 * NOTE: This helper assumes Step 1 (Student) is already completed by the caller
 * (e.g. via the student picker modal). It starts by advancing past step 1.
 */
export async function fillLessonWizard(page: Page, data: LessonWizardData): Promise<void> {
  // Ensure the lesson form is visible
  await expect(page.locator('[data-testid="lesson-form"]')).toBeVisible({
    timeout: 10000,
  });

  // --- Step 1: Student (caller must have already selected) ---
  await advanceStep(page);

  // --- Step 2: Songs (optional — caller handles picker if needed) ---
  await advanceStep(page);

  // --- Step 3: Schedule ---
  const scheduledAtField = page.locator('[data-testid="field-scheduled_at"]');
  await scheduledAtField.fill(data.scheduledAt);
  await advanceStep(page);

  // --- Step 4: Notes ---
  if (data.title) {
    const titleField = page.locator('[data-testid="field-title"]');
    await titleField.clear();
    await titleField.fill(data.title);
  }

  if (data.notes) {
    const notesField = page.locator('[data-testid="field-notes"]');
    await notesField.clear();
    await notesField.fill(data.notes);
  }

  // Submit from last step
  await submitWizard(page);
}

// ---------------------------------------------------------------------------
// Assignment form wizard
// ---------------------------------------------------------------------------

interface AssignmentWizardData {
  title: string;
  description?: string;
  /** Date format, e.g. "2026-04-01" */
  dueDate?: string;
  // Student selection is on step 1 via a Select component (field-student).
  // Caller can either pre-select or use selectShadcnOption on field-student
  // before calling this helper.
}

/**
 * Fill all steps of the Assignment wizard form and submit.
 *
 * Assignment form steps:
 *   1. Student — field-student (Select trigger)
 *   2. Content — field-title, field-description
 *   3. Song — SongPicker (optional, caller handles)
 *   4. Schedule — field-due_date
 *
 * NOTE: This helper assumes Step 1 (Student) is already completed by the
 * caller. It starts by advancing past step 1.
 */
export async function fillAssignmentWizard(page: Page, data: AssignmentWizardData): Promise<void> {
  // Ensure the assignment form is visible
  await expect(page.locator('[data-testid="assignment-form"]')).toBeVisible({
    timeout: 10000,
  });

  // --- Step 1: Student (caller must have already selected) ---
  await advanceStep(page);

  // --- Step 2: Content ---
  const titleField = page.locator('[data-testid="field-title"]');
  await titleField.clear();
  await titleField.fill(data.title);

  if (data.description) {
    const descriptionField = page.locator('[data-testid="field-description"]');
    await descriptionField.clear();
    await descriptionField.fill(data.description);
  }

  await advanceStep(page);

  // --- Step 3: Song (optional — caller handles picker if needed) ---
  await advanceStep(page);

  // --- Step 4: Schedule ---
  if (data.dueDate) {
    const dueDateField = page.locator('[data-testid="field-due_date"]');
    await dueDateField.fill(data.dueDate);
  }

  // Submit from last step
  await submitWizard(page);
}
