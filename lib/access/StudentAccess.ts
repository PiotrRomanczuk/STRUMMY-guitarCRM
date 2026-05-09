import 'server-only';
import { cache } from 'react';
import type { AuthedProfile } from '@/lib/auth/loadAuthedProfile';
import { createClient } from '@/lib/supabase/server';

/**
 * StudentAccess answers the domain question "who may this Profile see?"
 *
 * Two operations:
 * - `visibleStudentIds()` — the set of Student ids this Profile may see.
 *   Used to populate UI selectors (dropdowns, autocomplete) and for
 *   pre-write authorization checks.
 * - `canView(studentId)` — predicate version of the same question.
 *
 * There is intentionally no `scope(query)` operation: list-filtering of
 * lessons / assignments / songs is RLS's job (see ADR-0001). This module
 * exists for UI and pre-write 403s, not for security.
 *
 * Backed by the `teacher_students` Postgres view — a Teacher *teaches* a
 * Student iff at least one non-deleted Lesson exists between them
 * (see CONTEXT.md: Teaches).
 *
 * The expensive read (`teacher_students` query) is memoized per request
 * via `React.cache`, keyed by user id.
 */
export type StudentAccess = {
  visibleStudentIds(): Promise<string[] | null>;
  canView(studentId: string): Promise<boolean>;
};

/**
 * Per-request memoized fetch of the teacher's student set.
 * Returns `null` for admins (meaning "all students") and the empty
 * array for any other Profile that can only see themselves.
 */
const fetchVisibleStudentIds = cache(
  async (userId: string, isAdmin: boolean, isTeacher: boolean): Promise<string[] | null> => {
    if (isAdmin) return null;
    if (!isTeacher) return [];
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('teacher_students')
      .select('student_id')
      .eq('teacher_id', userId);
    if (error || !data) return [];
    return Array.from(new Set(data.map((r) => r.student_id))).filter(Boolean);
  }
);

export function studentAccess(authed: AuthedProfile): StudentAccess {
  const { user, roles } = authed;

  return {
    async visibleStudentIds() {
      return fetchVisibleStudentIds(user.id, roles.isAdmin, roles.isTeacher);
    },

    async canView(studentId: string) {
      if (roles.isAdmin) return true;
      if (roles.isStudent && studentId === user.id) return true;
      if (!roles.isTeacher) return false;
      const ids = await fetchVisibleStudentIds(user.id, false, true);
      return ids?.includes(studentId) ?? false;
    },
  };
}
