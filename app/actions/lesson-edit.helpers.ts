import { createAdminClient } from '@/lib/supabase/admin';
import { matchStudentByEmail, createShadowStudent } from '@/lib/services/import-utils';

export type ResolveStudentResult =
  | { ok: true; studentId: string }
  | { ok: false; error: string; ambiguous?: boolean };

/**
 * Resolve a lesson form's student selection to a profile id.
 *
 * - An explicit `studentId` is returned as-is.
 * - An `email` is matched against existing profiles; an unmatched email creates
 *   a shadow profile inline (`is_shadow = true`, `user_id = null`).
 *
 * Profile match/insert run on the admin client because `insert_profile_admin_only`
 * blocks teachers from inserting profiles under RLS.
 */
export async function resolveStudent(
  studentId: string | undefined,
  email: string | undefined
): Promise<ResolveStudentResult> {
  if (studentId) return { ok: true, studentId };

  const trimmed = email?.trim().toLowerCase();
  if (!trimmed) return { ok: false, error: 'Select a student or enter an email' };

  const admin = createAdminClient();
  const match = await matchStudentByEmail(trimmed, admin);

  if (match.status === 'MATCHED' && match.candidates[0]) {
    return { ok: true, studentId: match.candidates[0].id };
  }

  if (match.status === 'AMBIGUOUS') {
    return {
      ok: false,
      ambiguous: true,
      error: 'Several students share that email — pick the existing student instead.',
    };
  }

  const [firstName, ...rest] = trimmed.split('@')[0].split(/[._-]+/);
  const created = await createShadowStudent(trimmed, firstName ?? 'New', rest.join(' '), admin);
  if (!created.success || !created.profileId) {
    return { ok: false, error: created.error ?? 'Could not create student' };
  }
  return { ok: true, studentId: created.profileId };
}
