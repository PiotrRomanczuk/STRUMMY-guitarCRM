/**
 * RLS acceptance tests for `assignments` (spec 03 §DoD-3, ASG-3).
 *
 * Covers teacher isolation, student own-only SELECT, and the ASG-3
 * column-scoped student write (migration 20260719000001): a student's ONLY
 * write path is the `student_update_assignment_status` SECURITY DEFINER RPC
 * — the broad `assignments_student_status_update` policy is gone, so a
 * direct PostgREST UPDATE from a student (status or any other column) is now
 * rejected by RLS with no matching policy, not merely discouraged by app code.
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

  it('student CAN advance the status of their own assignment via the RPC (ASG-3)', async () => {
    const { error } = await fx.studentA1.client.rpc('student_update_assignment_status', {
      p_assignment_id: assignmentA.id,
      p_new_status: 'in_progress',
    });
    expect(error).toBeNull();

    const { data } = await fx.service
      .from('assignments')
      .select('status')
      .eq('id', assignmentA.id)
      .single();
    expect(data?.status).toBe('in_progress');
  });

  it('student CANNOT advance an assignment that is not theirs, via the RPC', async () => {
    const { error } = await fx.studentA1.client.rpc('student_update_assignment_status', {
      p_assignment_id: assignmentB.id,
      p_new_status: 'in_progress',
    });
    expect(error).not.toBeNull();

    const { data } = await fx.service
      .from('assignments')
      .select('status')
      .eq('id', assignmentB.id)
      .single();
    expect(data?.status).toBe('not_started');
  });

  it('student CANNOT make an illegal status transition via the RPC', async () => {
    // assignmentA is now 'in_progress' (previous test) — in_progress cannot
    // jump straight back to not_started, and not_started isn't even a
    // student-reachable target.
    const { error } = await fx.studentA1.client.rpc('student_update_assignment_status', {
      p_assignment_id: assignmentA.id,
      p_new_status: 'not_started',
    });
    expect(error).not.toBeNull();

    const { data } = await fx.service
      .from('assignments')
      .select('status')
      .eq('id', assignmentA.id)
      .single();
    expect(data?.status).toBe('in_progress');
  });

  it('student CANNOT bypass the RPC with a direct UPDATE — status column (ASG-3 core proof)', async () => {
    const { error } = await fx.studentA1.client
      .from('assignments')
      .update({ status: 'completed' })
      .eq('id', assignmentA.id);
    // RLS rejects it silently (0 rows matched a write policy) rather than a
    // Postgres-level error — assert the row is actually untouched.
    void error;

    const { data } = await fx.service
      .from('assignments')
      .select('status')
      .eq('id', assignmentA.id)
      .single();
    expect(data?.status).toBe('in_progress');
  });

  it('student CANNOT bypass the RPC with a direct UPDATE — non-status column (ASG-3 core proof)', async () => {
    const { error } = await fx.studentA1.client
      .from('assignments')
      .update({ title: 'hacked via curl' })
      .eq('id', assignmentA.id);
    void error;

    const { data } = await fx.service
      .from('assignments')
      .select('title')
      .eq('id', assignmentA.id)
      .single();
    expect(data?.title).toBe('RLS fixture assignment');
  });

  it('teacher status update is unaffected — still a plain table UPDATE', async () => {
    const { error } = await fx.teacherA.client
      .from('assignments')
      .update({ status: 'completed' })
      .eq('id', assignmentA.id);
    expect(error).toBeNull();

    const { data } = await fx.service
      .from('assignments')
      .select('status')
      .eq('id', assignmentA.id)
      .single();
    expect(data?.status).toBe('completed');
  });
});
