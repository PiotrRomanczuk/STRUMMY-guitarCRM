/**
 * RLS acceptance tests for the assignment checklist (PR B).
 *
 * A student's ONLY checklist write path is the `student_toggle_checklist_item`
 * SECURITY DEFINER RPC (migration 20260720000001), which flips exactly one
 * existing item's `done` flag. Students have no direct UPDATE policy, so a
 * direct PostgREST UPDATE of `checklist` (to rewrite text, add or remove items)
 * is rejected by RLS — the DB is the boundary (ADR-0001), mirroring ASG-3.
 */

import { describeIfRls, seedTwoTeachers, type TwoTeacherFixture } from '../index';

type SeededAssignment = { id: string };

const CHECKLIST = [
  { id: 'a', text: 'Learn the intro', done: false },
  { id: 'b', text: 'Play at 80 bpm', done: false },
];

describeIfRls('assignment checklist RLS — student toggle vs direct write', () => {
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
        title: 'RLS checklist fixture',
        status: 'not_started',
        checklist: CHECKLIST,
      })
      .select('id')
      .single();
    if (error || !data) throw new Error(`insertAssignment failed: ${error?.message ?? 'no row'}`);
    return data as SeededAssignment;
  };

  const readChecklist = async (id: string) => {
    const { data } = await fx.service.from('assignments').select('checklist').eq('id', id).single();
    return (data?.checklist ?? []) as typeof CHECKLIST;
  };

  beforeAll(async () => {
    fx = await seedTwoTeachers();
    assignmentA = await insertAssignment(fx.teacherA.id, fx.studentA1.id);
    assignmentB = await insertAssignment(fx.teacherB.id, fx.studentB1.id);
  }, 30_000);

  afterAll(async () => {
    await fx?.cleanup();
  });

  it('student CAN toggle an item on their own assignment via the RPC', async () => {
    const { error } = await fx.studentA1.client.rpc('student_toggle_checklist_item', {
      p_assignment_id: assignmentA.id,
      p_item_id: 'a',
      p_done: true,
    });
    expect(error).toBeNull();

    const checklist = await readChecklist(assignmentA.id);
    expect(checklist.find((i) => i.id === 'a')?.done).toBe(true);
    expect(checklist.find((i) => i.id === 'b')?.done).toBe(false);
    expect(checklist).toHaveLength(2);
  });

  it("student CANNOT toggle another student's assignment via the RPC", async () => {
    const { error } = await fx.studentA1.client.rpc('student_toggle_checklist_item', {
      p_assignment_id: assignmentB.id,
      p_item_id: 'a',
      p_done: true,
    });
    expect(error).not.toBeNull();

    const checklist = await readChecklist(assignmentB.id);
    expect(checklist.find((i) => i.id === 'a')?.done).toBe(false);
  });

  it('student CANNOT toggle a non-existent item via the RPC', async () => {
    const { error } = await fx.studentA1.client.rpc('student_toggle_checklist_item', {
      p_assignment_id: assignmentA.id,
      p_item_id: 'ghost',
      p_done: true,
    });
    expect(error).not.toBeNull();
  });

  it('student CANNOT rewrite the checklist with a direct UPDATE (core proof)', async () => {
    await fx.studentA1.client
      .from('assignments')
      .update({ checklist: [{ id: 'a', text: 'hacked', done: true }] })
      .eq('id', assignmentA.id);

    const checklist = await readChecklist(assignmentA.id);
    // Untouched: still two items with original text.
    expect(checklist).toHaveLength(2);
    expect(checklist.find((i) => i.id === 'a')?.text).toBe('Learn the intro');
  });

  it('teacher CAN edit the checklist via a plain UPDATE', async () => {
    const next = [
      { id: 'a', text: 'Learn the intro', done: true },
      { id: 'b', text: 'Play at 80 bpm', done: false },
      { id: 'c', text: 'Record yourself', done: false },
    ];
    const { error } = await fx.teacherA.client
      .from('assignments')
      .update({ checklist: next })
      .eq('id', assignmentA.id);
    expect(error).toBeNull();

    const checklist = await readChecklist(assignmentA.id);
    expect(checklist).toHaveLength(3);
    expect(checklist.find((i) => i.id === 'c')?.text).toBe('Record yourself');
  });
});
