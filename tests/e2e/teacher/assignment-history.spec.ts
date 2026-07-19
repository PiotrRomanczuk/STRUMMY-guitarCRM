import { test, expect } from '../../fixtures';
import { adminClient, getStudentId, getTeacherId } from '../../helpers/seed-ids';

/**
 * ASG-2 (docs/app-blueprint/06-assignments.md, Tranche 5) — assignment
 * history timeline. Proves the tr_assignment_history_status trigger +
 * getAssignmentHistory() + the "History" card in AssignmentDetailEditorial
 * end to end, against the real local DB.
 */

let assignmentId: string | null = null;

test.describe('Assignment detail — History timeline', { tag: ['@teacher', '@assignments'] }, () => {
  test.beforeAll(async () => {
    const db = adminClient();
    const [teacherId, studentId] = await Promise.all([getTeacherId(db), getStudentId(db)]);

    const { data, error } = await db
      .from('assignments')
      .insert({
        teacher_id: teacherId,
        student_id: studentId,
        title: 'ASG-2 E2E history assignment',
        status: 'not_started',
      })
      .select('id')
      .single();
    if (error) throw new Error(`seed assignment failed: ${error.message}`);
    assignmentId = data?.id ?? null;

    // Advance twice so the timeline has all 3 entries by the time the test loads it.
    await db.from('assignments').update({ status: 'in_progress' }).eq('id', assignmentId);
    await db.from('assignments').update({ status: 'completed' }).eq('id', assignmentId);
  });

  test.afterAll(async () => {
    if (assignmentId) {
      const db = adminClient();
      await db.from('assignments').delete().eq('id', assignmentId);
    }
  });

  test.beforeEach(async ({ loginAs }) => {
    await loginAs('teacher');
  });

  test('teacher sees a 3-entry history timeline: created, then two status changes', async ({
    page,
  }) => {
    test.skip(!assignmentId, 'Seed not created in beforeAll');

    await page.goto(`/dashboard/assignments/${assignmentId}`);
    await page.waitForLoadState('networkidle');

    const timeline = page.getByTestId('assignment-history-timeline');
    await expect(timeline).toBeVisible({ timeout: 15_000 });
    await expect(timeline.locator('> div')).toHaveCount(3);
    await expect(timeline).toContainText('Created');
    await expect(timeline).toContainText('in progress');
    await expect(timeline).toContainText('completed');
  });
});
