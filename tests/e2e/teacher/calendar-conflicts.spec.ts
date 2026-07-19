import { test, expect } from '../../fixtures';
import { adminClient, getTeacherId, getStudentId } from '../../helpers/seed-ids';

/**
 * Calendar Integration — A8.1 / A8.2 (docs/app-blueprint/02-lessons-calendar.md CAL-2)
 *
 * A8.1 — Calendar page renders the Google-connected/disconnected status that
 *        matches the teacher's actual `user_integrations` row.
 * A8.2 — A seeded `sync_conflicts` row (lesson vs. divergent Google event) is
 *        resolved through the real conflicts UI: the diff renders, "Keep
 *        local" resolves it, the row's card flips to "Resolved", and the DB
 *        row is `status='resolved', resolution='use_local'`. With the only
 *        pending conflict cleared, a reload shows the empty state.
 *
 * A8.3 (disconnect Google) needs live OAuth — stays integration-level per the brief.
 */

let lessonId: string | null = null;
let conflictId: string | null = null;

test.describe.configure({ mode: 'serial' });

test.describe('Calendar integration', { tag: ['@teacher', '@calendar'] }, () => {
  test.beforeAll(async () => {
    const db = adminClient();
    const [teacherId, studentId] = await Promise.all([getTeacherId(db), getStudentId(db)]);

    // Clear out any pending conflicts left behind by a prior incomplete run so
    // the empty-state assertion below is deterministic.
    const { data: existingPending } = await db
      .from('sync_conflicts')
      .select('id, lesson:lessons!sync_conflicts_lesson_id_fkey(teacher_id)')
      .eq('status', 'pending');
    const staleIds = (existingPending ?? [])
      .filter(
        (c) => (c.lesson as unknown as { teacher_id: string } | null)?.teacher_id === teacherId
      )
      .map((c) => c.id);
    if (staleIds.length > 0) {
      await db.from('sync_conflicts').delete().in('id', staleIds);
    }

    const { data: lesson, error: lessonError } = await db
      .from('lessons')
      .insert({
        teacher_id: teacherId,
        student_id: studentId,
        title: 'E2E Calendar Conflict Lesson',
        scheduled_at: '2026-09-01T10:00:00Z',
        notes: 'Local notes before sync',
        status: 'SCHEDULED',
      })
      .select('id')
      .single();
    if (lessonError || !lesson) throw new Error(`seed lesson failed: ${lessonError?.message}`);
    lessonId = lesson.id;

    const { data: conflict, error: conflictError } = await db
      .from('sync_conflicts')
      .insert({
        lesson_id: lessonId,
        google_event_id: 'e2e-google-event-conflict',
        conflict_data: {
          remote_title: 'E2E Calendar Conflict Lesson (Google)',
          remote_scheduled_at: '2026-09-01T11:00:00Z',
          remote_notes: 'Remote notes from Google',
          remote_updated: new Date().toISOString(),
        },
        status: 'pending',
      })
      .select('id')
      .single();
    if (conflictError || !conflict) {
      throw new Error(`seed sync_conflicts failed: ${conflictError?.message}`);
    }
    conflictId = conflict.id;
  });

  test.afterAll(async () => {
    const db = adminClient();
    if (conflictId) await db.from('sync_conflicts').delete().eq('id', conflictId);
    if (lessonId) await db.from('lessons').delete().eq('id', lessonId);
  });

  test.beforeEach(async ({ loginAs }) => {
    await loginAs('teacher');
  });

  test('A8.1 calendar page shows the Google connection status', async ({ page }) => {
    const db = adminClient();
    const teacherId = await getTeacherId(db);
    const { data: integration } = await db
      .from('user_integrations')
      .select('user_id')
      .eq('user_id', teacherId)
      .eq('provider', 'google')
      .maybeSingle();
    const isConnected = Boolean(integration);

    await page.goto('/dashboard/calendar');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({
      timeout: 15_000,
    });

    if (isConnected) {
      await expect(page.getByText('Connected', { exact: true })).toBeVisible({ timeout: 10_000 });
      await expect(page.getByRole('button', { name: 'Disconnect' })).toBeVisible();
    } else {
      await expect(page.getByText('Not connected', { exact: true })).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByRole('button', { name: 'Connect Google Calendar' })).toBeVisible();
    }

    // Calendar nav item is un-hidden (CAL-2).
    await expect(page.getByRole('link', { name: 'Calendar' }).first()).toBeVisible();
  });

  test('A8.2 resolve a seeded sync conflict (use_local)', async ({ page }) => {
    test.skip(!lessonId || !conflictId, 'Seed data not created in beforeAll');

    await page.goto('/dashboard/calendar/conflicts');
    await page.waitForLoadState('networkidle');

    // Local column shows the real lesson data (not just the Google fallback).
    await expect(
      page.getByText('E2E Calendar Conflict Lesson', { exact: true }).first()
    ).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByText('E2E Calendar Conflict Lesson (Google)', { exact: true })
    ).toBeVisible();
    await expect(page.getByText('Local notes before sync')).toBeVisible();
    await expect(page.getByText('Remote notes from Google')).toBeVisible();
    await expect(page.getByText('1 pending')).toBeVisible();

    await page.getByRole('button', { name: 'Keep local' }).click();

    await expect(page.getByText('Resolved — kept local version')).toBeVisible({
      timeout: 10_000,
    });

    const db = adminClient();
    await expect
      .poll(
        async () => {
          const { data } = await db
            .from('sync_conflicts')
            .select('status, resolution')
            .eq('id', conflictId as string)
            .single();
          return data;
        },
        { timeout: 10_000 }
      )
      .toMatchObject({ status: 'resolved', resolution: 'use_local' });

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('No pending conflicts — your calendar is in sync.')).toBeVisible({
      timeout: 10_000,
    });
  });
});
