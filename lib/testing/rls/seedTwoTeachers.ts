import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient, signInAs } from './clients';

const PASSWORD = 'rls-test-Password!1';

export type SeededUser = {
  id: string;
  email: string;
  password: string;
  client: SupabaseClient;
};

export type SeededLesson = {
  id: string;
  teacher_id: string;
  student_id: string;
};

export type TwoTeacherFixture = {
  service: SupabaseClient;
  teacherA: SeededUser;
  teacherB: SeededUser;
  studentA1: SeededUser;
  studentB1: SeededUser;
  lessonA: SeededLesson;
  lessonB: SeededLesson;
  cleanup: () => Promise<void>;
};

type Role = 'teacher' | 'student';

async function createUser(
  service: SupabaseClient,
  role: Role,
  tag: string
): Promise<Omit<SeededUser, 'client'>> {
  const email = `rls-${role}-${tag}@guitarcrm.local`;
  const { data, error } = await service.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { isTest: true },
  });
  if (error || !data.user) {
    throw new Error(`createUser(${email}) failed: ${error?.message ?? 'no user returned'}`);
  }
  const id = data.user.id;
  const { error: profileErr } = await service.from('profiles').upsert(
    {
      id,
      email,
      full_name: `RLS ${role} ${tag}`,
      is_admin: false,
      is_teacher: role === 'teacher',
      is_student: role === 'student',
      is_development: true,
    },
    { onConflict: 'id' }
  );
  if (profileErr) {
    throw new Error(`profile upsert for ${email} failed: ${profileErr.message}`);
  }
  return { id, email, password: PASSWORD };
}

async function insertLesson(
  service: SupabaseClient,
  teacher_id: string,
  student_id: string
): Promise<SeededLesson> {
  const { data, error } = await service
    .from('lessons')
    .insert({
      teacher_id,
      student_id,
      title: 'RLS fixture lesson',
      scheduled_at: new Date().toISOString(),
    })
    .select('id, teacher_id, student_id')
    .single();
  if (error || !data) {
    throw new Error(`insertLesson failed: ${error?.message ?? 'no row'}`);
  }
  return data as SeededLesson;
}

/**
 * Seed two independent teachers, one student each, and one lesson per teacher.
 * Returns pre-authenticated RLS-real clients plus a `cleanup()` that deletes
 * the auth users (cascades to profiles + lessons).
 *
 * Each call uses a unique email tag so concurrent test runs don't collide.
 */
export async function seedTwoTeachers(): Promise<TwoTeacherFixture> {
  const service = createServiceClient();
  const tag = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const tA = await createUser(service, 'teacher', `a-${tag}`);
  const tB = await createUser(service, 'teacher', `b-${tag}`);
  const sA1 = await createUser(service, 'student', `a1-${tag}`);
  const sB1 = await createUser(service, 'student', `b1-${tag}`);

  const lessonA = await insertLesson(service, tA.id, sA1.id);
  const lessonB = await insertLesson(service, tB.id, sB1.id);

  const [tAClient, tBClient, sA1Client, sB1Client] = await Promise.all([
    signInAs(tA.email, tA.password),
    signInAs(tB.email, tB.password),
    signInAs(sA1.email, sA1.password),
    signInAs(sB1.email, sB1.password),
  ]);

  const ids = [tA.id, tB.id, sA1.id, sB1.id];
  const cleanup = async () => {
    await Promise.allSettled(ids.map((id) => service.auth.admin.deleteUser(id)));
  };

  return {
    service,
    teacherA: { ...tA, client: tAClient },
    teacherB: { ...tB, client: tBClient },
    studentA1: { ...sA1, client: sA1Client },
    studentB1: { ...sB1, client: sB1Client },
    lessonA,
    lessonB,
    cleanup,
  };
}
