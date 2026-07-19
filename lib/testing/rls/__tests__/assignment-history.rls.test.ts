/**
 * RLS acceptance test for `assignment_history` (ASG-2,
 * docs/app-blueprint/06-assignments.md).
 *
 * assignment_history did not exist on this stack before this migration
 * (20260719000004) — only documented in the baseline schema dump, never
 * captured as an incremental migration. Its SELECT policy is written fresh
 * against this codebase's actual role convention (profiles booleans), not
 * copied from the baseline's user_roles-based policy. Proves the trigger
 * populates it and that a student can only ever see their own assignment's
 * timeline.
 */

import { describeIfRls, seedTwoTeachers, type TwoTeacherFixture } from '../index';

type SeededAssignment = { id: string };

describeIfRls('assignment_history RLS — trigger population + student scope', () => {
  let fx: TwoTeacherFixture;
  let assignmentA: SeededAssignment;
  let assignmentB: SeededAssignment;

  const insertAssignment = async (
    teacherId: string,
    studentId: string
  ): Promise<SeededAssignment> => {
    const { data, error } = await fx.service
      .from('assignments')
      .insert({
        teacher_id: teacherId,
        student_id: studentId,
        title: 'ASG-2 history fixture assignment',
        status: 'not_started',
      })
      .select('id')
      .single();
    if (error || !data) throw new Error(`insertAssignment failed: ${error?.message ?? 'no row'}`);
    return data as SeededAssignment;
  };

  beforeAll(async () => {
    fx = await seedTwoTeachers();
    assignmentA = await insertAssignment(fx.teacherA.id, fx.studentA1.id);
    assignmentB = await insertAssignment(fx.teacherB.id, fx.studentB1.id);
  }, 30_000);

  afterAll(async () => {
    await fx?.cleanup();
  });

  it('the trigger logs a "created" entry on insert', async () => {
    const { data, error } = await fx.service
      .from('assignment_history')
      .select('change_type')
      .eq('assignment_id', assignmentA.id);
    expect(error).toBeNull();
    expect(data?.some((r) => r.change_type === 'created')).toBe(true);
  });

  it('create → start → complete produces a 3-entry timeline', async () => {
    const { error: rpcError } = await fx.studentA1.client.rpc('student_update_assignment_status', {
      p_assignment_id: assignmentA.id,
      p_new_status: 'in_progress',
    });
    expect(rpcError).toBeNull();

    await fx.teacherA.client
      .from('assignments')
      .update({ status: 'completed' })
      .eq('id', assignmentA.id);

    const { data } = await fx.service
      .from('assignment_history')
      .select('change_type')
      .eq('assignment_id', assignmentA.id)
      .order('changed_at', { ascending: true });

    expect(data).toHaveLength(3);
    expect(data?.map((r) => r.change_type)).toEqual([
      'created',
      'status_changed',
      'status_changed',
    ]);
  });

  it("student sees only their own assignment's history", async () => {
    const own = await fx.studentA1.client
      .from('assignment_history')
      .select('id')
      .eq('assignment_id', assignmentA.id);
    expect(own.error).toBeNull();
    expect(own.data?.length ?? 0).toBeGreaterThan(0);

    const other = await fx.studentA1.client
      .from('assignment_history')
      .select('id')
      .eq('assignment_id', assignmentB.id);
    expect(other.error).toBeNull();
    expect(other.data ?? []).toHaveLength(0);
  });

  it("a teacher sees only their own student's assignment history", async () => {
    const own = await fx.teacherA.client
      .from('assignment_history')
      .select('id')
      .eq('assignment_id', assignmentA.id);
    expect(own.error).toBeNull();
    expect(own.data?.length ?? 0).toBeGreaterThan(0);

    const other = await fx.teacherA.client
      .from('assignment_history')
      .select('id')
      .eq('assignment_id', assignmentB.id);
    expect(other.error).toBeNull();
    expect(other.data ?? []).toHaveLength(0);
  });
});
