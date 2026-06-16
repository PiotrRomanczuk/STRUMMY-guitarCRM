/**
 * RLS acceptance tests for `assignments` (spec 03 §DoD-3).
 *
 * Covers teacher isolation, student own-only SELECT, the NEW student
 * status-only UPDATE policy (migration 20260616120000), and the cross-owner
 * UPDATE rejection — all against a real Supabase via the two-teacher harness.
 */

import { describeIfRls, seedTwoTeachers, type TwoTeacherFixture } from '../index';

type SeededAssignment = { id: string };

describeIfRls('assignments RLS — isolation + student status update', () => {
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
        title: 'RLS fixture assignment',
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

  it("teacher sees their own student's assignment", async () => {
    const { data, error } = await fx.teacherA.client
      .from('assignments')
      .select('id, teacher_id')
      .eq('id', assignmentA.id)
      .maybeSingle();
    expect(error).toBeNull();
    expect(data?.id).toBe(assignmentA.id);
  });

  it("teacher CANNOT see another teacher's assignment", async () => {
    const { data, error } = await fx.teacherA.client
      .from('assignments')
      .select('id')
      .eq('id', assignmentB.id)
      .maybeSingle();
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it('student sees only their own assignment', async () => {
    const own = await fx.studentA1.client
      .from('assignments')
      .select('id')
      .eq('id', assignmentA.id)
      .maybeSingle();
    expect(own.error).toBeNull();
    expect(own.data?.id).toBe(assignmentA.id);

    const other = await fx.studentA1.client
      .from('assignments')
      .select('id')
      .eq('id', assignmentB.id)
      .maybeSingle();
    expect(other.error).toBeNull();
    expect(other.data).toBeNull();
  });

  it('student CAN update the status of their own assignment (new RLS policy)', async () => {
    const { error } = await fx.studentA1.client
      .from('assignments')
      .update({ status: 'in_progress' })
      .eq('id', assignmentA.id);
    expect(error).toBeNull();

    const { data } = await fx.service
      .from('assignments')
      .select('status')
      .eq('id', assignmentA.id)
      .single();
    expect(data?.status).toBe('in_progress');
  });

  it('student CANNOT update an assignment that is not theirs', async () => {
    await fx.studentA1.client
      .from('assignments')
      .update({ status: 'completed' })
      .eq('id', assignmentB.id);

    const { data } = await fx.service
      .from('assignments')
      .select('status')
      .eq('id', assignmentB.id)
      .single();
    expect(data?.status).toBe('not_started');
  });
});
