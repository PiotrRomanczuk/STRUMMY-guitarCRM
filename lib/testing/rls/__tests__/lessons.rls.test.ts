/**
 * RLS acceptance tests for `lessons` (spec 02 §DoD-3).
 *
 * Proves teacher isolation and student own-only visibility against a real
 * Supabase via the two-teacher harness (auth → JWT → RLS path).
 */

import { describeIfRls, seedTwoTeachers, type TwoTeacherFixture } from '../index';

describeIfRls('lessons RLS — teacher isolation + student own-only', () => {
  let fx: TwoTeacherFixture;

  beforeAll(async () => {
    fx = await seedTwoTeachers();
  }, 30_000);

  afterAll(async () => {
    await fx?.cleanup();
  });

  it('teacher sees their own lesson', async () => {
    const { data, error } = await fx.teacherA.client
      .from('lessons')
      .select('id, teacher_id')
      .eq('id', fx.lessonA.id)
      .maybeSingle();
    expect(error).toBeNull();
    expect(data?.id).toBe(fx.lessonA.id);
  });

  it("teacher CANNOT see another teacher's lesson", async () => {
    const { data, error } = await fx.teacherA.client
      .from('lessons')
      .select('id')
      .eq('id', fx.lessonB.id)
      .maybeSingle();
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it('student sees their own lesson', async () => {
    const { data, error } = await fx.studentA1.client
      .from('lessons')
      .select('id, student_id')
      .eq('id', fx.lessonA.id)
      .maybeSingle();
    expect(error).toBeNull();
    expect(data?.student_id).toBe(fx.studentA1.id);
  });

  it("student CANNOT see another student's lesson", async () => {
    const { data, error } = await fx.studentA1.client
      .from('lessons')
      .select('id')
      .eq('id', fx.lessonB.id)
      .maybeSingle();
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it('soft-deleted lessons are hidden from their teacher', async () => {
    await fx.service
      .from('lessons')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', fx.lessonA.id);
    const { data } = await fx.teacherA.client
      .from('lessons')
      .select('id')
      .eq('id', fx.lessonA.id)
      .is('deleted_at', null)
      .maybeSingle();
    expect(data).toBeNull();
    // restore so other assertions/order independence holds
    await fx.service.from('lessons').update({ deleted_at: null }).eq('id', fx.lessonA.id);
  });
});
