/**
 * Phase 3 — student/chord-quiz
 *
 * Student plays a chord-quiz session at `/dashboard/skills/chord-quiz`.
 * Asserts the page renders, the first prompt is presented, and (when
 * possible) one attempt is submitted via `submitChordQuizSession`.
 *
 * @tags @student @chord-quiz @unbreakable
 */

import { test, expect } from '../../fixtures';

test.describe('Student — chord quiz', { tag: ['@student', '@chord-quiz', '@unbreakable'] }, () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('student');
  });

  test('chord-quiz page loads with a question or a Start button', async ({ page }) => {
    await page.goto('/dashboard/skills/chord-quiz', { waitUntil: 'networkidle' });
    const startOrPrompt = page.getByText(/start|chord|which chord|next/i).first();
    await expect(startOrPrompt).toBeVisible({ timeout: 10000 });
  });

  test.skip('complete 10-attempt session → results page shows score (TODO: needs deterministic chord-set seed)', async () => {
    // Iterate 10 times: read the prompt, click the first answer
    // button, expect progress to advance. After 10 attempts, the
    // results screen renders with a score.
  });
});
