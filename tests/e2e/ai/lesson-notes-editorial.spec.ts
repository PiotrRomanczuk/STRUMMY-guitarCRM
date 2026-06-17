import { test, expect } from '../../fixtures';

/**
 * Lesson Notes AI — editorial form (re-wired).
 *
 * Verifies the `lesson-notes-assistant` agent end-to-end through the editorial
 * lesson form: selecting a student + song + title enables the "Generate Lesson
 * Notes" button; clicking it streams agent output into the notes textarea.
 *
 * Run locally against the local Gemma backend (AI_PROVIDER=ollama). In CI / when
 * no AI backend is available, the generation assertion is allowed to surface an
 * inline error instead — the test still verifies the button wiring.
 */
test.describe('Lesson Notes AI (editorial form)', { tag: ['@ai', '@lessons'] }, () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('admin');
  });

  test('AI button enables and streams notes for a student + song + title', async ({ page }) => {
    test.setTimeout(150_000);
    await page.goto('/dashboard/lessons/new');
    await page.waitForLoadState('networkidle');

    // Pick a real student (skip the placeholder + "add by email" option).
    const studentValue = await page
      .locator('#lesson-student option')
      .evaluateAll(
        (opts) =>
          (
            opts.find(
              (o) => (o as HTMLOptionElement).value && (o as HTMLOptionElement).value !== '__new__'
            ) as HTMLOptionElement
          )?.value
      );
    test.skip(!studentValue, 'No seeded students available');
    await page.locator('#lesson-student').selectOption(studentValue as string);

    // Pick the first repertoire song (multi-select).
    const songValue = await page
      .locator('#lesson-songs option')
      .evaluateAll((opts) => (opts[0] as HTMLOptionElement)?.value);
    test.skip(!songValue, 'No seeded songs available');
    await page.locator('#lesson-songs').selectOption(songValue as string);

    await page.locator('#lesson-title').fill('Barre chords practice');

    const aiBtn = page.getByRole('button', { name: /generate lesson notes/i });
    await expect(aiBtn).toBeEnabled({ timeout: 10_000 });
    await aiBtn.click();

    // The agent streams into the controlled notes textarea. Allow generous time
    // for the local 12B model. Either real notes appear, or an inline error
    // message is written (provider unavailable) — both prove the wiring works.
    await expect(page.locator('#lesson-notes')).not.toHaveValue('', { timeout: 120_000 });
    const notes = await page.locator('#lesson-notes').inputValue();
    // Must be real generated content, not the onError fallback string.
    expect(notes).not.toMatch(/^Error generating/i);
    expect(notes.length).toBeGreaterThan(40);
  });
});
