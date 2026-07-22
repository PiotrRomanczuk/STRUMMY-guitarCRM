import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Resolve seed target ids (student/teacher) from the configured test-account
 * emails at runtime, instead of hard-coding profile UUIDs that drift per
 * environment. Use in E2E `beforeAll` blocks that seed student-scoped data.
 */
export function adminClient(): SupabaseClient {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_LOCAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key);
}

async function idByEmail(db: SupabaseClient, email: string): Promise<string> {
  const { data, error } = await db.from('profiles').select('id').eq('email', email).single();
  if (error || !data?.id) {
    throw new Error(`seed-ids: no profile for ${email}: ${error?.message ?? 'not found'}`);
  }
  return data.id as string;
}

/** Profile id of the E2E student login (TEST_STUDENT_EMAIL, default student@dev.local). */
export function getStudentId(db: SupabaseClient): Promise<string> {
  return idByEmail(db, process.env.TEST_STUDENT_EMAIL || 'student@dev.local');
}

/** Profile id of the E2E teacher login (TEST_TEACHER_EMAIL, default teacher@dev.local). */
export function getTeacherId(db: SupabaseClient): Promise<string> {
  return idByEmail(db, process.env.TEST_TEACHER_EMAIL || 'teacher@dev.local');
}

/**
 * Profile id of the admin (TEST_ADMIN_EMAIL, default admin@dev.local), who
 * is also a teacher. Use as an alternate lesson teacher so specs that seed
 * lessons for the same student in parallel don't collide on the per-(teacher,
 * student) lesson-number trigger.
 */
export function getAdminId(db: SupabaseClient): Promise<string> {
  return idByEmail(db, process.env.TEST_ADMIN_EMAIL || 'admin@dev.local');
}
