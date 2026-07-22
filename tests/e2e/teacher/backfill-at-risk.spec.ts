import { test, expect } from '../../fixtures';
import { adminClient, getStudentId, getTeacherId } from '../../helpers/seed-ids';

/**
 * Teacher Dashboard — "Needs attention" (at-risk students) backfill card
 * (docs/app-blueprint/93-design-mockup-audit.md — "Strummy - Student Detail
 * -At Risk-.html"). The mockup depicts an at-risk *state on the Student
 * Detail page*, but per the audit that visual treatment was never built —
 * the real at-risk signal (`getAtRiskStudents`) only ever surfaces as the
 * "Needs attention" card on the Teacher Dashboard
 * (`components/dashboard/editorial/teacher/BackfillCards.tsx`). This spec
 * tests the real surface, not the literal mockup screen.
 *
 * `getAtRiskStudents(teacherId, now)` only considers students who have a
 * (non-deleted) lesson with this teacher, then — per student — takes the
 * MOST RECENT `last_practiced_at` across ALL of their `student_repertoire`
 * rows and flags them if that single most-recent date is >= 7 days old (or
 * null). It is not a per-song check: seeding one additional stale song is a
 * no-op if the student already has any fresher row elsewhere in their
 * catalog. The shared `student@dev.local` fixture used here has its own
 * ambient repertoire data (from other specs / dev seed generation) that can
 * legitimately sit anywhere relative to the 7-day boundary, so to keep this
 * deterministic we temporarily push ALL of that student's existing rows
 * stale too (restored in `afterAll`), not just our own dedicated marker row.
 */

const LESSON_TITLE = 'E2E At-Risk Backfill Lesson';
const SONG_TITLE = 'E2E At-Risk Backfill Song';
const STALE_DAYS = 10;

let teacherId = '';
let studentId = '';
let lessonId: string | null = null;
let songId: string | null = null;
let repertoireId: string | null = null;
let otherRepertoireBackup: { id: string; last_practiced_at: string | null }[] = [];

test.describe.configure({ mode: 'serial' });

test.describe(
  'Teacher dashboard — Needs attention card (at-risk)',
  { tag: ['@teacher', '@dashboard'] },
  () => {
    test.beforeAll(async () => {
      const db = adminClient();
      [teacherId, studentId] = await Promise.all([getTeacherId(db), getStudentId(db)]);

      // Wipe any leftovers from a prior incomplete run (idempotent, scoped by
      // our own marker titles so we never touch unrelated fixture data).
      const { data: staleSongs } = await db.from('songs').select('id').eq('title', SONG_TITLE);
      for (const s of staleSongs ?? []) {
        await db.from('student_repertoire').delete().eq('song_id', s.id);
        await db.from('songs').delete().eq('id', s.id);
      }
      await db
        .from('lessons')
        .delete()
        .eq('teacher_id', teacherId)
        .eq('student_id', studentId)
        .eq('title', LESSON_TITLE);

      // Lesson establishes the teacher↔student relationship getAtRiskStudents
      // requires. Scheduled far outside the current week so it doesn't leak
      // into "today's lessons" or the Week Density card.
      const { data: lesson, error: lessonError } = await db
        .from('lessons')
        .insert({
          teacher_id: teacherId,
          student_id: studentId,
          title: LESSON_TITLE,
          scheduled_at: '2026-09-15T10:00:00Z',
          status: 'SCHEDULED',
        })
        .select('id')
        .single();
      if (lessonError || !lesson) throw new Error(`seed lesson failed: ${lessonError?.message}`);
      lessonId = lesson.id;

      // Dedicated song, not a shared/"first" one, so we never clobber another
      // spec's student_repertoire row for the same student.
      const { data: song, error: songError } = await db
        .from('songs')
        .insert({ title: SONG_TITLE })
        .select('id')
        .single();
      if (songError || !song) throw new Error(`seed song failed: ${songError?.message}`);
      songId = song.id;

      const stale = new Date();
      stale.setDate(stale.getDate() - STALE_DAYS);

      const { data: rep, error: repError } = await db
        .from('student_repertoire')
        .insert({
          student_id: studentId,
          song_id: songId,
          last_practiced_at: stale.toISOString(),
        })
        .select('id')
        .single();
      if (repError || !rep) throw new Error(`seed repertoire failed: ${repError?.message}`);
      repertoireId = rep.id;

      // getAtRiskStudents flags a student by their single MOST RECENT
      // last_practiced_at across every song, not per-song — so any fresher
      // pre-existing row for this shared fixture student would mask the one
      // we just seeded. Back up and stale-out everything else too.
      const { data: otherRows } = await db
        .from('student_repertoire')
        .select('id, last_practiced_at')
        .eq('student_id', studentId)
        .neq('id', repertoireId);
      otherRepertoireBackup = otherRows ?? [];
      for (const row of otherRepertoireBackup) {
        await db
          .from('student_repertoire')
          .update({ last_practiced_at: stale.toISOString() })
          .eq('id', row.id);
      }
    });

    test.afterAll(async () => {
      const db = adminClient();
      for (const row of otherRepertoireBackup) {
        await db
          .from('student_repertoire')
          .update({ last_practiced_at: row.last_practiced_at })
          .eq('id', row.id);
      }
      if (repertoireId) await db.from('student_repertoire').delete().eq('id', repertoireId);
      if (songId) await db.from('songs').delete().eq('id', songId);
      if (lessonId) await db.from('lessons').delete().eq('id', lessonId);
    });

    test.beforeEach(async ({ loginAs }) => {
      await loginAs('teacher');
    });

    test('renders the at-risk student with a plausible days badge and a working profile link', async ({
      page,
    }) => {
      test.skip(!repertoireId, 'Seed data not created in beforeAll');

      const db = adminClient();
      const { data: profile } = await db
        .from('profiles')
        .select('full_name, email')
        .eq('id', studentId)
        .single();
      const identifier = profile?.full_name || profile?.email || studentId;

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      await expect(page.getByText('Needs attention', { exact: true })).toBeVisible({
        timeout: 15_000,
      });

      // "last practiced" text is unique to Needs Attention rows (the Roster
      // card links to the same student href but without that copy), so this
      // scopes precisely to our seeded row even if the student also appears
      // elsewhere on the dashboard (e.g. the roster list).
      const row = page
        .locator(`a[href="/dashboard/users/${studentId}"]`)
        .filter({ hasText: 'last practiced' });
      await expect(row).toBeVisible({ timeout: 15_000 });
      await expect(row).toContainText(identifier);

      const badge = row.getByText(/^\d+d$/);
      await expect(badge).toBeVisible();
      const days = parseInt((await badge.textContent()) ?? '0', 10);
      // Allow a couple of days of drift for slow CI clocks / late runs.
      expect(days).toBeGreaterThanOrEqual(STALE_DAYS);
      expect(days).toBeLessThanOrEqual(STALE_DAYS + 2);

      await row.click();
      // Longer timeout: first navigation to this route triggers a cold
      // Turbopack compile in dev mode (same rationale as the login redirect
      // wait in auth.fixture.ts).
      await expect(page).toHaveURL(new RegExp(`/dashboard/users/${studentId}$`), {
        timeout: 45_000,
      });
      await expect(page.getByText(identifier).first()).toBeVisible({ timeout: 15_000 });
    });

    test('drops out of the card once the student has practiced recently', async ({ page }) => {
      test.skip(!repertoireId, 'Seed data not created in beforeAll');

      const db = adminClient();
      await db
        .from('student_repertoire')
        .update({ last_practiced_at: new Date().toISOString() })
        .eq('id', repertoireId as string);

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const row = page
        .locator(`a[href="/dashboard/users/${studentId}"]`)
        .filter({ hasText: 'last practiced' });
      await expect(row).toHaveCount(0);

      // Best-effort check of the literal empty-state copy: this teacher
      // account is shared across the whole E2E suite, so we only assert the
      // canonical "Everyone's on track" copy when a live, scoped re-check of
      // the same at-risk logic confirms no *other* student is currently
      // flagged for this teacher. This keeps the primary assertion above
      // (our seeded row disappears once recently practiced) deterministic
      // while still covering the empty-state copy whenever the shared fixture
      // data happens to allow it.
      const { data: lessons } = await db
        .from('lessons')
        .select('student_id')
        .eq('teacher_id', teacherId)
        .is('deleted_at', null);
      const studentIds = Array.from(new Set((lessons ?? []).map((l) => l.student_id as string)));
      const { data: repertoireRows } = await db
        .from('student_repertoire')
        .select('last_practiced_at')
        .in(
          'student_id',
          studentIds.length > 0 ? studentIds : ['00000000-0000-0000-0000-000000000000']
        );
      const now = Date.now();
      const stillAtRisk = (repertoireRows ?? []).some((r) => {
        const days = r.last_practiced_at
          ? Math.floor((now - new Date(r.last_practiced_at as string).getTime()) / 86_400_000)
          : 999;
        return days >= 7;
      });

      test.skip(stillAtRisk, 'Other shared fixture data is still at-risk for this teacher');
      // Component text uses a curly apostrophe ("Everyone’s"), not a straight one.
      await expect(page.getByText('Everyone’s on track this week.', { exact: true })).toBeVisible({
        timeout: 10_000,
      });
    });
  }
);
