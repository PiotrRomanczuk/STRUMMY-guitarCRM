/**
 * Smoke test for the two-teacher RLS harness.
 *
 * Proves that `signInAs(...)` returns an RLS-real client by verifying that
 * Teacher A cannot SELECT Teacher B's lesson — `lessons_select_teacher`
 * already restricts SELECT to `teacher_id = auth.uid()`, so this exercises
 * the full auth → JWT → RLS path end to end.
 *
 * If this test fails, every later RLS test in Cluster E is suspect.
 */

import { describeIfRls, seedTwoTeachers, type TwoTeacherFixture } from '../index';

describeIfRls('two-teacher RLS harness — smoke', () => {
  let fx: TwoTeacherFixture;

  beforeAll(async () => {
    fx = await seedTwoTeachers();
  }, 30_000);

  afterAll(async () => {
    await fx?.cleanup();
  });

  it('seeds two distinct teachers with their own lessons', () => {
    expect(fx.teacherA.id).not.toBe(fx.teacherB.id);
    expect(fx.lessonA.teacher_id).toBe(fx.teacherA.id);
    expect(fx.lessonB.teacher_id).toBe(fx.teacherB.id);
  });

  it('teacher A can read their own lesson via RLS', async () => {
    const { data, error } = await fx.teacherA.client
      .from('lessons')
      .select('id, teacher_id')
      .eq('id', fx.lessonA.id)
      .maybeSingle();
    expect(error).toBeNull();
    expect(data?.id).toBe(fx.lessonA.id);
  });

  it('teacher A CANNOT read teacher B lesson — proves RLS is applied', async () => {
    const { data, error } = await fx.teacherA.client
      .from('lessons')
      .select('id')
      .eq('id', fx.lessonB.id)
      .maybeSingle();
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it('service client bypasses RLS and sees both lessons', async () => {
    const { data, error } = await fx.service
      .from('lessons')
      .select('id')
      .in('id', [fx.lessonA.id, fx.lessonB.id]);
    expect(error).toBeNull();
    expect(data?.map((row) => row.id).sort()).toEqual([fx.lessonA.id, fx.lessonB.id].sort());
  });
});
