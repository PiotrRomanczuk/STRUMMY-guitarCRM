import { test, expect, type Page } from '../../fixtures';

/**
 * Assignment AI
 *
 * The assignment form was rebuilt as AssignmentCreateEditorial: native <select>/<input>
 * controls (#assignment-student, #assignment-title, #assignment-notes) and the AI action
 * wrapped in [data-testid="assignment-notes-ai"]. The AI button is always rendered but
 * stays disabled until a student + title are set (duration is fixed at "1 week").
 *
 * Generation needs a reachable AI provider. Without one, the stream errors and the handler
 * writes a fallback string into the brief — so the *wiring* is verifiable with just the DB;
 * only the "meaningful content" assertion is gated behind E2E_AI_PROVIDER.
 */

const AI_ERROR_FALLBACK = 'Error generating assignment. Please try again.';

/** Select the first real student in the native select. Returns false when none are seeded. */
async function selectFirstStudent(page: Page): Promise<boolean> {
  const options = page.locator('#assignment-student option');
  await options.first().waitFor({ state: 'attached' });
  if ((await options.count()) <= 1) return false; // only the "Select a student…" placeholder
  const value = await options.nth(1).getAttribute('value');
  if (!value) return false;
  await page.selectOption('#assignment-student', value);
  return true;
}

test.describe('Assignment AI', { tag: ['@ai', '@assignments'] }, () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('admin');
    await page.goto('/dashboard/assignments/new');
    await page.waitForLoadState('networkidle');
  });

  test('AI button is disabled before a student and title are provided', async ({ page }) => {
    const aiBtn = page.getByTestId('assignment-notes-ai').getByRole('button');
    await expect(aiBtn).toBeVisible();
    await expect(aiBtn).toBeDisabled();
  });

  test('AI button becomes enabled after selecting a student and entering a title', async ({
    page,
  }) => {
    if (!(await selectFirstStudent(page))) {
      test.skip(true, 'No seeded students available');
      return;
    }
    await page.fill('#assignment-title', 'Barre Chord Practice');

    const aiBtn = page.getByTestId('assignment-notes-ai').getByRole('button');
    await expect(aiBtn).toBeEnabled({ timeout: 5_000 });
  });

  test('AI button triggers generation', async ({ page }) => {
    test.slow();

    if (!(await selectFirstStudent(page))) {
      test.skip(true, 'No seeded students available');
      return;
    }
    await page.fill('#assignment-title', 'Scale Exercises');

    const aiBtn = page.getByTestId('assignment-notes-ai').getByRole('button');
    await expect(aiBtn).toBeEnabled({ timeout: 5_000 });
    await aiBtn.click();

    // Clicking wires into the brief field: it ends non-empty whether generation succeeds
    // (real content) or fails (error fallback). Either proves the handler fired.
    const brief = page.locator('#assignment-notes');
    await expect(async () => {
      expect((await brief.inputValue()).trim().length).toBeGreaterThan(0);
    }).toPass({ timeout: 30_000 });
  });

  test('generated content populates the brief field', async ({ page }) => {
    test.slow();

    if (!(await selectFirstStudent(page))) {
      test.skip(true, 'No seeded students available');
      return;
    }
    await page.fill('#assignment-title', 'Rhythm Training');

    const aiBtn = page.getByTestId('assignment-notes-ai').getByRole('button');
    await expect(aiBtn).toBeEnabled({ timeout: 5_000 });
    await aiBtn.click();

    const brief = page.locator('#assignment-notes');
    await expect(async () => {
      expect((await brief.inputValue()).trim().length).toBeGreaterThan(0);
    }).toPass({ timeout: 30_000 });

    // Real, non-error content only when a provider is configured.
    if (process.env.E2E_AI_PROVIDER) {
      expect((await brief.inputValue()).trim()).not.toBe(AI_ERROR_FALLBACK);
    }
  });
});
