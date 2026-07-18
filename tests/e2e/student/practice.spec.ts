import { test, expect } from '../../fixtures';
import { adminClient, getStudentId } from '../../helpers/seed-ids';

/**
 * Student Practice Log E2E Tests (B6)
 *
 * Journeys tested:
 *  B6.1 — Log a practice session
 *  B6.2 — Delete same-day entry (undo), incl. a song-linked session (PRA-1)
 *  B6.3 — Past sessions have no Remove button (immutability)
 *  B6.4 — Page loads for student, only own sessions visible
 *
 * The E2E student fixture has is_development=false in the local test DB so
 * the mutation guard never fires — no toggle needed.
 */

let STUDENT_ID: string;
let SONG_ID: string;
let repertoireId: string | null = null;
let pastSessionId: string | null = null;

test.describe.configure({ mode: 'serial' });

test.describe('Student Practice Log', { tag: ['@student', '@practice'] }, () => {
  test.beforeAll(async () => {
    const db = adminClient();
    STUDENT_ID = await getStudentId(db);

    // Wipe any E2E sessions left from earlier runs (idempotent)
    await db.from('practice_sessions').delete().eq('student_id', STUDENT_ID).like('notes', 'E2E%');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data } = await db
      .from('practice_sessions')
      .insert({
        student_id: STUDENT_ID,
        duration_minutes: 30,
        notes: 'E2E past session',
        created_at: yesterday.toISOString(),
      })
      .select('id')
      .single();
    pastSessionId = data?.id ?? null;

    // Seed one repertoire song so the practice-log form's song select (and
    // the PRA-1 song-linked undo test below) has something to pick from.
    const { data: song } = await db.from('songs').select('id').limit(1).single();
    if (song) {
      SONG_ID = song.id;
      const { data: rep } = await db
        .from('student_repertoire')
        .upsert(
          {
            student_id: STUDENT_ID,
            song_id: SONG_ID,
            total_practice_minutes: 0,
            practice_session_count: 0,
          },
          { onConflict: 'student_id,song_id' }
        )
        .select('id')
        .single();
      repertoireId = rep?.id ?? null;
    }
  });

  test.afterAll(async () => {
    const db = adminClient();
    if (pastSessionId) await db.from('practice_sessions').delete().eq('id', pastSessionId);
    await db.from('practice_sessions').delete().eq('student_id', STUDENT_ID).like('notes', 'E2E%');
    if (repertoireId) {
      await db
        .from('student_repertoire')
        .update({ total_practice_minutes: 0, practice_session_count: 0, last_practiced_at: null })
        .eq('id', repertoireId);
    }
  });

  test.beforeEach(async ({ loginAs }) => {
    await loginAs('student');
  });

  test('B6.4 practice page loads for student', async ({ page }) => {
    await page.goto('/dashboard/practice');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /practice/i })).toBeVisible({ timeout: 15_000 });
    // Log form is visible for own practice page
    await expect(page.getByRole('button', { name: 'Log practice' })).toBeVisible();
  });

  test('B6.3 past sessions have no Remove button', async ({ page }) => {
    await page.goto('/dashboard/practice');
    await page.waitForLoadState('networkidle');

    // Scope to the History card to avoid matching sidebar li elements
    const historySection = page.locator('[data-slot="card"]', { hasText: /History/ }).first();
    await expect(historySection).toBeVisible({ timeout: 10_000 });

    const pastRow = historySection.locator('li', { hasText: 'E2E past session' }).first();
    await expect(pastRow).toBeVisible({ timeout: 10_000 });
    // canUndo = false for yesterday's session — Remove button must not appear
    await expect(pastRow.getByRole('button', { name: 'Remove' })).not.toBeVisible();
  });

  test('B6.1 log a practice session', async ({ page }) => {
    await page.goto('/dashboard/practice');
    await page.waitForLoadState('networkidle');

    // Select duration preset
    await page.locator('button:has-text("15m")').click();
    // Add notes
    await page.locator('textarea#practice-notes').fill('E2E log test session');
    // Submit
    await page.getByRole('button', { name: 'Log practice' }).click();
    // Success toast
    await expect(page.locator('text=/Practice logged/i').first()).toBeVisible({ timeout: 10_000 });
  });

  test('B6.2 delete same-day entry (undo)', async ({ page }) => {
    await page.goto('/dashboard/practice');
    await page.waitForLoadState('networkidle');

    // Log a fresh session
    await page.locator('button:has-text("10m")').click();
    await page.locator('textarea#practice-notes').fill('E2E undo test session');
    await page.getByRole('button', { name: 'Log practice' }).click();
    await expect(page.locator('text=/Practice logged/i').first()).toBeVisible({ timeout: 10_000 });
    await page.waitForLoadState('networkidle');

    // Scope to History card and find the newly logged session
    const historySection = page.locator('[data-slot="card"]', { hasText: /History/ }).first();
    const newRow = historySection.locator('li', { hasText: 'E2E undo test session' }).first();
    const removeBtn = newRow.getByRole('button', { name: 'Remove' });
    await expect(removeBtn).toBeVisible({ timeout: 8_000 });
    await removeBtn.click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Remove' }).click();
    await expect(page.locator('text=/Practice session removed/i').first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('B6.2 PRA-1 undo a song-linked session (previously raised 42703)', async ({ page }) => {
    test.skip(!repertoireId, 'No song seeded in beforeAll');
    await page.goto('/dashboard/practice');
    await page.waitForLoadState('networkidle');

    await page.locator('button:has-text("10m")').click();
    await page.locator('#practice-song').selectOption(SONG_ID);
    await page.locator('textarea#practice-notes').fill('E2E song-linked undo session');
    await page.getByRole('button', { name: 'Log practice' }).click();
    await expect(page.locator('text=/Practice logged/i').first()).toBeVisible({ timeout: 10_000 });
    await page.waitForLoadState('networkidle');

    // The trigger fired on insert: repertoire aggregates incremented.
    const db = adminClient();
    await expect
      .poll(
        async () => {
          const { data } = await db
            .from('student_repertoire')
            .select('total_practice_minutes, practice_session_count')
            .eq('id', repertoireId as string)
            .single();
          return data;
        },
        { timeout: 10_000 }
      )
      .toMatchObject({ total_practice_minutes: 10, practice_session_count: 1 });

    // The regression this fixes: undoing a song-linked session used to raise
    // 42703 (wrong table/column) and the delete silently failed in the UI.
    const historySection = page.locator('[data-slot="card"]', { hasText: /History/ }).first();
    const newRow = historySection
      .locator('li', { hasText: 'E2E song-linked undo session' })
      .first();
    const removeBtn = newRow.getByRole('button', { name: 'Remove' });
    await expect(removeBtn).toBeVisible({ timeout: 8_000 });
    await removeBtn.click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Remove' }).click();
    await expect(page.locator('text=/Practice session removed/i').first()).toBeVisible({
      timeout: 10_000,
    });

    await expect
      .poll(
        async () => {
          const { data } = await db
            .from('student_repertoire')
            .select('total_practice_minutes, practice_session_count')
            .eq('id', repertoireId as string)
            .single();
          return data;
        },
        { timeout: 10_000 }
      )
      .toMatchObject({ total_practice_minutes: 0, practice_session_count: 0 });
  });
});
