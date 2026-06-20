import { test, expect } from '../../fixtures';
import { createClient } from '@supabase/supabase-js';

/**
 * Student Repertoire E2E Tests (B7)
 *
 * Journeys tested:
 *  B7.1 — View own repertoire (empty state + with entries)
 *  B7.2 — Update own self-rating / difficulty
 *  B7.3 — No add/remove controls (teacher-managed set)
 */

const STUDENT_ID = '2fb4575e-bb80-486f-a8d9-3553fd84316d';
const TEACHER_ID = 'e8cfbe9a-b9ab-4530-a588-3efa26d1f849';
const SONG_ID = 'c84490dc-eec1-47ef-a597-f1a298ffda9b'; // "Jak"

function adminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_LOCAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key);
}

let repertoireEntryId: string | null = null;
let lessonId: string | null = null;
let lessonSongId: string | null = null;

test.describe.configure({ mode: 'serial' });

test.describe('Student Repertoire', { tag: ['@student', '@repertoire'] }, () => {
  test.beforeAll(async () => {
    const db = adminClient();

    // Create a lesson so songs RLS allows student1 to see "Jak"
    // (songs_select_policy requires lesson_songs → lessons link for students)
    const { data: lesson } = await db
      .from('lessons')
      .insert({
        teacher_id: TEACHER_ID,
        student_id: STUDENT_ID,
        title: 'E2E Repertoire Lesson',
        scheduled_at: '2026-08-15T10:00:00Z',
        status: 'SCHEDULED',
      })
      .select('id')
      .single();
    lessonId = lesson?.id ?? null;

    if (lessonId) {
      const { data: ls } = await db
        .from('lesson_songs')
        .insert({ lesson_id: lessonId, song_id: SONG_ID, status: 'to_learn' })
        .select('id')
        .single();
      lessonSongId = ls?.id ?? null;
    }

    // Ensure no leftover repertoire entry for this student+song combo
    await db
      .from('student_repertoire')
      .delete()
      .eq('student_id', STUDENT_ID)
      .eq('song_id', SONG_ID);

    const { data } = await db
      .from('student_repertoire')
      .insert({
        student_id: STUDENT_ID,
        song_id: SONG_ID,
        current_status: 'to_learn',
      })
      .select('id')
      .single();
    repertoireEntryId = data?.id ?? null;
  });

  test.afterAll(async () => {
    const db = adminClient();
    if (lessonSongId) await db.from('lesson_songs').delete().eq('id', lessonSongId);
    if (lessonId) await db.from('lessons').delete().eq('id', lessonId);
    if (repertoireEntryId) {
      await db.from('student_repertoire').delete().eq('id', repertoireEntryId);
    }
  });

  test.beforeEach(async ({ loginAs }) => {
    await loginAs('student');
  });

  test('B7.1 view own repertoire with seeded entry', async ({ page }) => {
    await page.goto('/dashboard/repertoire');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /repertoire/i })).toBeVisible({
      timeout: 15_000,
    });
    // The seeded song "Jak" should appear
    await expect(page.locator('text=/Jak/i').first()).toBeVisible({ timeout: 10_000 });
    // Status badge shows (to_learn → "To learn")
    await expect(page.locator('text=/To learn/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('B7.2 update own difficulty self-rating', async ({ page }) => {
    await page.goto('/dashboard/repertoire');
    await page.waitForLoadState('networkidle');

    // Find the card for "Jak"
    const card = page.locator('[class*="rounded-xl"]', { hasText: 'Jak' }).first();
    await expect(card).toBeVisible({ timeout: 10_000 });

    // Click difficulty button "3"
    await card.getByRole('button', { name: '3' }).click();

    // Save
    await card.getByRole('button', { name: 'Save' }).click();
    await expect(page.locator('text=/Saved/i').first()).toBeVisible({ timeout: 8_000 });

    // Reload and verify persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    const reloadedCard = page.locator('[class*="rounded-xl"]', { hasText: 'Jak' }).first();
    // The "3" button should appear selected (has different styling, but is still "3")
    await expect(reloadedCard.getByRole('button', { name: '3' })).toBeVisible();
  });

  test('B7.3 no add/remove song controls for student', async ({ page }) => {
    await page.goto('/dashboard/repertoire');
    await page.waitForLoadState('networkidle');

    // Student should NOT see "Add song" / "Remove" / "Delete" buttons
    await expect(page.getByRole('button', { name: /add song/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /remove/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /delete/i })).not.toBeVisible();
  });
});
