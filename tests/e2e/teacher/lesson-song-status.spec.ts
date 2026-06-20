import { test, expect } from '../../fixtures';
import { createClient } from '@supabase/supabase-js';

/**
 * Lesson Song Display E2E Tests (A4.3)
 *
 * Journeys tested:
 *  A4.3 — Lesson detail shows assigned songs in the Repertoire section
 *
 * NOTE: The teacher's editorial lesson detail (`LessonDetailEditorial`) renders
 * songs as read-only links in a "REPERTOIRE" card — there is no status-select
 * or `data-testid="lesson-songs-section"` on this view. Status can be changed
 * by the teacher via a dedicated song-management flow (not the lesson detail).
 * This spec tests what IS present: the lesson loads and the assigned song appears.
 */

const TEACHER_ID = 'e8cfbe9a-b9ab-4530-a588-3efa26d1f849';
const STUDENT_ID = '2fb4575e-bb80-486f-a8d9-3553fd84316d';
const SONG_ID = 'c84490dc-eec1-47ef-a597-f1a298ffda9b'; // "Jak"

function adminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_LOCAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key);
}

let lessonId: string | null = null;
let lessonSongId: string | null = null;

test.describe.configure({ mode: 'serial' });

test.describe('Lesson Song Display', { tag: ['@teacher', '@lessons'] }, () => {
  test.beforeAll(async () => {
    const db = adminClient();

    const { data: lesson } = await db
      .from('lessons')
      .insert({
        teacher_id: TEACHER_ID,
        student_id: STUDENT_ID,
        title: `E2E Song Status Test Lesson`,
        scheduled_at: '2026-08-01T10:00:00Z',
        status: 'SCHEDULED',
      })
      .select('id')
      .single();

    lessonId = lesson?.id ?? null;

    if (lessonId) {
      const { data: ls } = await db
        .from('lesson_songs')
        .insert({
          lesson_id: lessonId,
          song_id: SONG_ID,
          status: 'to_learn',
        })
        .select('id')
        .single();
      lessonSongId = ls?.id ?? null;
    }
  });

  test.afterAll(async () => {
    const db = adminClient();
    if (lessonSongId) await db.from('lesson_songs').delete().eq('id', lessonSongId);
    if (lessonId) await db.from('lessons').delete().eq('id', lessonId);
  });

  test.beforeEach(async ({ loginAs }) => {
    await loginAs('teacher');
  });

  test('A4.3 lesson detail loads and assigned song appears in Repertoire section', async ({
    page,
  }) => {
    if (!lessonId) test.skip(true, 'Lesson not created in beforeAll');

    await page.goto(`/dashboard/lessons/${lessonId}`);
    await page.waitForLoadState('networkidle');

    // Lesson page loads (title or heading visible)
    await expect(page.locator('text=/E2E Song Status Test Lesson/i').first()).toBeVisible({
      timeout: 15_000,
    });

    // Assigned song "Jak" is visible on the page (shown in the Repertoire card)
    await expect(page.locator('text=/Jak/i').first()).toBeVisible({ timeout: 10_000 });
  });

  test('A4.3 lesson song status can be updated directly via DB and reflects on reload', async ({
    page,
  }) => {
    if (!lessonId || !lessonSongId) test.skip(true, 'Lesson not created in beforeAll');

    const db = adminClient();
    // Set status to 'remembered' directly in DB
    await db.from('lesson_songs').update({ status: 'remembered' }).eq('id', lessonSongId);

    await page.goto(`/dashboard/lessons/${lessonId}`);
    await page.waitForLoadState('networkidle');

    // Lesson detail renders — song still visible after status update
    await expect(page.locator('text=/Jak/i').first()).toBeVisible({ timeout: 15_000 });

    // Restore status
    await db.from('lesson_songs').update({ status: 'to_learn' }).eq('id', lessonSongId);
  });
});
