import { test, expect } from '../../fixtures';
import { adminClient, getStudentId, getTeacherId } from '../../helpers/seed-ids';

/**
 * LES-3 — "repeat weekly for N weeks" on lesson creation.
 * Targets LessonFormEditorial's create-mode-only recurring option, which
 * calls generateRecurringLessons instead of a single createLessonAction.
 *
 * The #lesson-student select is RLS-scoped via the teacher_students view,
 * which is derived from `lessons` itself: "a student appears here once
 * they have at least one lesson with a teacher" (see
 * supabase/migrations/20260617000000_teacher_students_security_invoker.sql).
 * A brand-new teacher/student pairing with zero prior lessons therefore
 * won't show up in the dropdown at all — seed one throwaway lesson first
 * so the E2E student is selectable, matching lesson-song-status.spec.ts's
 * pattern.
 */
test.describe('Lesson repeat-weekly', { tag: ['@teacher', '@lessons'] }, () => {
  let studentId: string;
  let seedLessonId: string | null = null;

  test.beforeAll(async () => {
    const db = adminClient();
    studentId = await getStudentId(db);
    const teacherId = await getTeacherId(db);

    const { data: seedLesson } = await db
      .from('lessons')
      .insert({
        teacher_id: teacherId,
        student_id: studentId,
        title: 'E2E repeat-weekly seed lesson (unlocks student in dropdown)',
        scheduled_at: '2026-01-01T10:00:00Z',
        status: 'SCHEDULED',
      })
      .select('id')
      .single();
    seedLessonId = seedLesson?.id ?? null;
  });

  test.afterAll(async () => {
    const db = adminClient();
    if (seedLessonId) await db.from('lessons').delete().eq('id', seedLessonId);
    await db.from('lessons').delete().ilike('title', 'E2E repeat-weekly%');
  });

  test.beforeEach(async ({ loginAs }) => {
    await loginAs('teacher');
  });

  test('unchecked box behaves exactly as a normal single-lesson create', async ({ page }) => {
    await page.goto('/dashboard/lessons/new');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('lesson-repeat-weekly-checkbox')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('lesson-repeat-weekly-checkbox')).not.toBeChecked();
    await expect(page.getByTestId('lesson-repeat-weeks-select')).not.toBeVisible();

    await page.locator('#lesson-student').selectOption(studentId);
    await page.locator('#lesson-title').fill(`E2E repeat-weekly unchecked ${Date.now()}`);
    await page.locator('#lesson-when').fill('2026-09-01T10:00');
    await page.getByRole('button', { name: 'Create lesson' }).click();

    // Single create still redirects to the one lesson's detail page.
    await page.waitForURL(/\/dashboard\/lessons\/[0-9a-f-]{36}$/, { timeout: 20_000 });
  });

  test('checking repeat weekly creates N lessons, 7 days apart, and returns to the list', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.goto('/dashboard/lessons/new');
    await page.waitForLoadState('networkidle');

    const title = `E2E repeat-weekly checked ${Date.now()}`;
    await page.locator('#lesson-student').selectOption(studentId);
    await page.locator('#lesson-title').fill(title);
    await page.locator('#lesson-when').fill('2026-09-08T15:00');

    await page.getByTestId('lesson-repeat-weekly-checkbox').check();
    await expect(page.getByTestId('lesson-repeat-weeks-select')).toBeVisible();
    await page.getByTestId('lesson-repeat-weeks-select').selectOption('4');

    await page.getByRole('button', { name: 'Create lesson' }).click();

    // Recurring create has no single lessonId to land on — back to the list.
    await page.waitForURL(/\/dashboard\/lessons$/, { timeout: 20_000 });

    const db = adminClient();
    const { data: lessons } = await db
      .from('lessons')
      .select('scheduled_at, lesson_teacher_number')
      .eq('title', title)
      .order('scheduled_at', { ascending: true });

    expect(lessons).toHaveLength(4);
    const rows = lessons!;
    const numbers = rows.map((r) => r.lesson_teacher_number);
    // Sequential and strictly increasing (base+1..base+4), not necessarily 1..4
    // if this teacher/student pair already has prior lessons.
    for (let i = 1; i < numbers.length; i++) {
      expect(numbers[i]).toBe(numbers[i - 1] + 1);
    }
    for (let i = 1; i < rows.length; i++) {
      const gapMs =
        new Date(rows[i].scheduled_at).getTime() - new Date(rows[i - 1].scheduled_at).getTime();
      expect(gapMs).toBe(7 * 24 * 60 * 60 * 1000);
    }
  });
});
