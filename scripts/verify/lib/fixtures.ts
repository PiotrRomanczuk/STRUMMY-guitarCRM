import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from './supabase-clients';

// Seeded demo accounts — these are LOCAL-DEV ONLY credentials, also documented
// openly in CLAUDE.md ("Dev Credentials") and matched by supabase/seed.sql.
// They unlock nothing in production. GitGuardian inline pragmas below mark
// them as intentional fixtures, not leaked secrets.
export const DEMO = {
  admin: { email: 'p.romanczuk@gmail.com', password: 'test123_admin' }, // pragma: allowlist secret
  teacherA: { email: 'sarah@strummy.app', password: 'Demo2024!' }, // pragma: allowlist secret
  studentA: { email: 'emma@strummy.app', password: 'Demo2024!' }, // pragma: allowlist secret
} as const;

const EPHEMERAL_PASSWORD = `verify-crud-${Date.now()}`;

export type CrudFixtures = {
  admin: { id: string; email: string; password: string };
  teacherA: { id: string; email: string; password: string };
  studentA: { id: string; email: string; password: string };
  teacherB: { id: string; email: string; password: string };
  studentB: { id: string; email: string; password: string };
  lessonA: string;
  lessonB: string;
  cleanup: () => Promise<void>;
};

export async function seedCrudFixtures(): Promise<CrudFixtures> {
  const admin = createServiceClient();
  const tracked: { lessons: string[]; authUsers: string[] } = { lessons: [], authUsers: [] };

  const adminId = await resolveProfileId(admin, DEMO.admin.email, 'is_admin');
  const teacherAId = await resolveProfileId(admin, DEMO.teacherA.email, 'is_teacher');
  const studentAId = await resolveProfileId(admin, DEMO.studentA.email, 'is_student');

  const teacherB = await createEphemeralUser(admin, 'teacher', tracked);
  const studentB = await createEphemeralUser(admin, 'student', tracked);

  const lessonA = await createLesson(admin, teacherAId, studentAId, tracked);
  const lessonB = await createLesson(admin, teacherB.id, studentB.id, tracked);

  return {
    admin: { id: adminId, ...DEMO.admin },
    teacherA: { id: teacherAId, ...DEMO.teacherA },
    studentA: { id: studentAId, ...DEMO.studentA },
    teacherB,
    studentB,
    lessonA,
    lessonB,
    cleanup: async () => {
      const failures: string[] = [];
      for (const id of tracked.lessons) {
        const { error } = await admin.from('lessons').delete().eq('id', id);
        if (error) failures.push(`delete lessons[${id}]: ${error.message}`);
      }
      for (const id of tracked.authUsers) {
        const { error } = await admin.auth.admin.deleteUser(id);
        if (error) failures.push(`deleteUser(${id}): ${error.message}`);
      }
      if (failures.length)
        throw new Error(
          `${failures.length} fixture cleanup step(s) failed:\n  ${failures.join('\n  ')}`
        );
    },
  };
}

async function resolveProfileId(
  admin: SupabaseClient,
  email: string,
  flag: 'is_admin' | 'is_teacher' | 'is_student'
): Promise<string> {
  const { data, error } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .eq(flag, true)
    .maybeSingle();
  if (error) throw new Error(`profile lookup ${email}: ${error.message}`);
  if (!data) {
    throw new Error(
      `Seed account missing on this DB: ${email} (with ${flag}=true). Run \`npm run seed\` first.`
    );
  }
  return data.id;
}

async function createEphemeralUser(
  admin: SupabaseClient,
  role: 'teacher' | 'student',
  tracked: { authUsers: string[] }
): Promise<{ id: string; email: string; password: string }> {
  const email = `verify-${role}-${Date.now()}-${Math.floor(Math.random() * 9999)}@strummy.test`;
  const password = EPHEMERAL_PASSWORD;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw new Error(`createUser ${role}: ${error.message}`);
  const id = data.user.id;
  tracked.authUsers.push(id);

  const flag = role === 'teacher' ? 'is_teacher' : 'is_student';
  const { error: roleErr } = await admin
    .from('profiles')
    .update({ [flag]: true })
    .eq('id', id);
  if (roleErr) throw new Error(`set ${flag} on ${email}: ${roleErr.message}`);
  return { id, email, password };
}

async function createLesson(
  admin: SupabaseClient,
  teacherId: string,
  studentId: string,
  tracked: { lessons: string[] }
): Promise<string> {
  const { data, error } = await admin
    .from('lessons')
    .insert({
      teacher_id: teacherId,
      student_id: studentId,
      scheduled_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      title: 'Verify CRUD test lesson',
    })
    .select('id')
    .single();
  if (error) throw new Error(`lesson insert: ${error.message}`);
  tracked.lessons.push(data.id);
  return data.id;
}
