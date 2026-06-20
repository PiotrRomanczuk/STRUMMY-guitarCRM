import { test, expect } from '../../fixtures';
import { createClient } from '@supabase/supabase-js';

/**
 * Chord Quiz with Spaced Repetition (SRS) E2E Tests
 *
 * Journeys tested:
 *  C1.1 — Quiz page loads with working quiz (not "Coming soon")
 *  C1.2 — Student can answer a question in random mode
 *  C1.3 — No review toggle when no SRS state exists
 *  C1.4 — Review toggle appears when chords are due
 *  C1.5 — Review mode limits session to due chords only
 *  C1.6 — Admin can access chord quiz page
 */

const STUDENT_ID = '2fb4575e-bb80-486f-a8d9-3553fd84316d';
const DUE_CHORD_IDS = ['C-open', 'Am-open', 'G-open', 'Em-open', 'D-open'];

function adminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_LOCAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key);
}

test.describe.configure({ mode: 'serial' });

test.describe('Chord Quiz — SRS', { tag: ['@student', '@skills', '@srs'] }, () => {
  test.beforeAll(async () => {
    const db = adminClient();
    await db.from('chord_srs').delete().eq('student_id', STUDENT_ID);
  });

  test.afterAll(async () => {
    const db = adminClient();
    await db.from('chord_srs').delete().eq('student_id', STUDENT_ID);
  });

  test.describe('Student role', () => {
    test.beforeEach(async ({ loginAs }) => {
      await loginAs('student');
    });

    test('C1.1 chord quiz page loads with quiz UI, not Coming Soon', async ({ page }) => {
      await page.goto('/dashboard/skills/chord-quiz');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: /chord quiz/i })).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.locator('text=/coming soon/i')).not.toBeVisible();
      await expect(page.locator('text=/Question 1 of/')).toBeVisible({ timeout: 10_000 });
    });

    test('C1.2 student can answer a question and advance', async ({ page }) => {
      await page.goto('/dashboard/skills/chord-quiz');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=/Question 1 of/')).toBeVisible({ timeout: 10_000 });

      // Click the first answer button
      const answerButtons = page.locator('button[aria-pressed]');
      await expect(answerButtons.first()).toBeVisible({ timeout: 10_000 });
      await answerButtons.first().click();

      // Correct or incorrect feedback appears
      await expect(page.locator('text=/Correct!|Correct answer:/').first()).toBeVisible({
        timeout: 5_000,
      });

      // Next question / See results button appears
      const advanceBtn = page.getByRole('button', { name: /next question|see results/i });
      await expect(advanceBtn).toBeVisible({ timeout: 5_000 });
    });

    test('C1.3 no review toggle when no SRS state exists for student', async ({ page }) => {
      await page.goto('/dashboard/skills/chord-quiz');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: /chord quiz/i })).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.locator('button:has-text("Review")')).not.toBeVisible();
    });

    test('C1.4 review toggle appears when chords are seeded as due', async ({ page }) => {
      const db = adminClient();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await db.from('chord_srs').upsert(
        DUE_CHORD_IDS.map((chordId) => ({
          student_id: STUDENT_ID,
          chord_id: chordId,
          repetitions: 0,
          interval_days: 1,
          ease_factor: 2.5,
          next_review_at: yesterday.toISOString(),
          last_reviewed_at: yesterday.toISOString(),
        })),
        { onConflict: 'student_id,chord_id' }
      );

      await page.goto('/dashboard/skills/chord-quiz');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: /chord quiz/i })).toBeVisible({
        timeout: 15_000,
      });

      // Both mode buttons should appear
      await expect(page.locator('button:has-text("Random")')).toBeVisible({ timeout: 10_000 });
      await expect(
        page.locator(`button:has-text("Review (${DUE_CHORD_IDS.length} due)")`)
      ).toBeVisible({ timeout: 10_000 });
    });

    test('C1.5 review mode limits quiz to the number of due chords', async ({ page }) => {
      await page.goto('/dashboard/skills/chord-quiz');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: /chord quiz/i })).toBeVisible({
        timeout: 15_000,
      });

      await page.locator(`button:has-text("Review (${DUE_CHORD_IDS.length} due)")`).click();

      const expectedCount = Math.min(DUE_CHORD_IDS.length, 10);
      await expect(page.locator(`text=/Question 1 of ${expectedCount}/`)).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  test.describe('Admin role', () => {
    test.beforeEach(async ({ loginAs }) => {
      await loginAs('admin');
    });

    test('C1.6 admin can access chord quiz page', async ({ page }) => {
      await page.goto('/dashboard/skills/chord-quiz');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: /chord quiz/i })).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.locator('text=/Question 1 of/')).toBeVisible({ timeout: 10_000 });
    });
  });
});
