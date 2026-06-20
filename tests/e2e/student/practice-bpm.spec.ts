import { test, expect } from '../../fixtures';
import { createClient } from '@supabase/supabase-js';

/**
 * BPM Tempo Tracking E2E Tests
 *
 * Journeys tested:
 *  B7.1 — BPM input hidden when no song is selected (general technique)
 *  B7.2 — BPM input appears when a song is selected from dropdown
 *  B7.3 — Seeded session with BPM shows badge in history
 *  B7.4 — Student logs new session with BPM, badge visible in history
 *  B7.5 — Admin can view student practice page (teacher read path)
 */

const STUDENT_ID = '2fb4575e-bb80-486f-a8d9-3553fd84316d';
// teacher@example.com in the local test DB
const TEACHER_ID = 'e8cfbe9a-b9ab-4530-a588-3efa26d1f849';

function adminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_LOCAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key);
}

test.describe.configure({ mode: 'serial' });

test.describe('Practice Session BPM Tracking', { tag: ['@student', '@practice', '@bpm'] }, () => {
  let seededSessionId: string | null = null;
  let seededSongId: string | null = null;
  let seededRepertoireId: string | null = null;
  let seededLessonId: string | null = null;

  test.beforeAll(async () => {
    const db = adminClient();
    // Clean up any leftover data from prior runs
    await db
      .from('practice_sessions')
      .delete()
      .eq('student_id', STUDENT_ID)
      .like('notes', 'E2E-BPM%');

    const { data: song } = await db
      .from('songs')
      .insert({ title: 'E2E BPM Test Song', author: 'Test Artist' })
      .select('id')
      .single();
    seededSongId = song?.id ?? null;

    if (seededSongId) {
      // Add to repertoire
      const { data: rep } = await db
        .from('student_repertoire')
        .insert({ student_id: STUDENT_ID, song_id: seededSongId, is_active: true })
        .select('id')
        .single();
      seededRepertoireId = rep?.id ?? null;

      // Add to a lesson so the student RLS policy allows reading the song
      const { data: lesson } = await db
        .from('lessons')
        .insert({
          teacher_id: TEACHER_ID,
          student_id: STUDENT_ID,
          scheduled_at: new Date().toISOString(),
          status: 'SCHEDULED',
        })
        .select('id')
        .single();
      seededLessonId = lesson?.id ?? null;

      if (seededLessonId) {
        await db.from('lesson_songs').insert({ lesson_id: seededLessonId, song_id: seededSongId });
      }

      // Seed a past session with BPM so history badge is testable
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const { data: session } = await db
        .from('practice_sessions')
        .insert({
          student_id: STUDENT_ID,
          song_id: seededSongId,
          duration_minutes: 20,
          bpm_practiced: 80,
          notes: 'E2E-BPM past session',
          created_at: yesterday.toISOString(),
        })
        .select('id')
        .single();
      seededSessionId = session?.id ?? null;
    }
  });

  test.afterAll(async () => {
    const db = adminClient();
    if (seededSessionId) await db.from('practice_sessions').delete().eq('id', seededSessionId);
    await db
      .from('practice_sessions')
      .delete()
      .eq('student_id', STUDENT_ID)
      .like('notes', 'E2E-BPM%');
    if (seededLessonId) {
      await db.from('lesson_songs').delete().eq('lesson_id', seededLessonId);
      await db.from('lessons').delete().eq('id', seededLessonId);
    }
    if (seededRepertoireId)
      await db.from('student_repertoire').delete().eq('id', seededRepertoireId);
    if (seededSongId) await db.from('songs').delete().eq('id', seededSongId);
  });

  test.describe('Student role', () => {
    test.beforeEach(async ({ loginAs }) => {
      await loginAs('student');
    });

    test('B7.1 BPM input hidden when no song selected', async ({ page }) => {
      await page.goto('/dashboard/practice');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('label:has-text("BPM practiced")')).not.toBeVisible();
    });

    test('B7.2 BPM input appears after selecting a song', async ({ page }) => {
      await page.goto('/dashboard/practice');
      await page.waitForLoadState('networkidle');

      await page.selectOption('#practice-song', seededSongId!);
      await expect(page.locator('label:has-text("BPM practiced")')).toBeVisible({ timeout: 5_000 });
      await expect(page.locator('#practice-bpm')).toBeVisible();
    });

    test('B7.3 seeded session with BPM shows badge in history', async ({ page }) => {
      await page.goto('/dashboard/practice');
      await page.waitForLoadState('networkidle');

      const historySection = page.locator('[data-slot="card"]', { hasText: /History/ }).first();
      await expect(historySection).toBeVisible({ timeout: 10_000 });
      const bpmRow = historySection.locator('li', { hasText: 'E2E-BPM past session' }).first();
      await expect(bpmRow).toBeVisible({ timeout: 10_000 });
      await expect(bpmRow.locator('text=/80 BPM/')).toBeVisible();
    });

    test('B7.4 log session with BPM, badge visible in history', async ({ page }) => {
      await page.goto('/dashboard/practice');
      await page.waitForLoadState('networkidle');

      await page.selectOption('#practice-song', seededSongId!);
      await page.fill('#practice-bpm', '90');
      await page.locator('button:has-text("15m")').click();
      await page.locator('textarea#practice-notes').fill('E2E-BPM new session');
      await page.getByRole('button', { name: 'Log practice' }).click();

      await expect(page.locator('text=/Practice logged/i').first()).toBeVisible({
        timeout: 10_000,
      });
      await page.waitForLoadState('networkidle');

      const historySection = page.locator('[data-slot="card"]', { hasText: /History/ }).first();
      const newRow = historySection.locator('li', { hasText: 'E2E-BPM new session' }).first();
      await expect(newRow.locator('text=/90 BPM/')).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe('Admin role', () => {
    test.beforeEach(async ({ loginAs }) => {
      await loginAs('admin');
    });

    test('B7.5 admin practice page loads correctly', async ({ page }) => {
      await page.goto('/dashboard/practice');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: /practice/i })).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByRole('button', { name: 'Log practice' })).toBeVisible();
    });
  });
});
