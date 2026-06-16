import { createClient } from '@/lib/supabase/server';
import { maskShadowEmail } from '@/lib/auth/shadow-email';
import { logger } from '@/lib/logger';

export type UserListRow = {
  id: string;
  fullName: string | null;
  email: string | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isShadow: boolean;
  isActive: boolean;
  inviteEmail: string | null;
  studentStatus: string;
  createdAt: string | null;
};

export type UserListFilters = {
  search?: string;
  role?: string;
  studentStatus?: string;
  active?: string;
};

export type UserListScope = {
  userId: string;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
};

const SELECT =
  'id, email, full_name, is_admin, is_teacher, is_student, is_shadow, is_active, invite_email, student_status, created_at';

type Row = {
  id: string;
  email: string | null;
  full_name: string | null;
  is_admin: boolean | null;
  is_teacher: boolean | null;
  is_student: boolean | null;
  is_shadow: boolean | null;
  is_active: boolean | null;
  invite_email: string | null;
  student_status: string | null;
  created_at: string | null;
};

const toRow = (r: Row): UserListRow => ({
  id: r.id,
  fullName: r.full_name,
  email: maskShadowEmail(r.email ?? ''),
  isAdmin: r.is_admin ?? false,
  isTeacher: r.is_teacher ?? false,
  isStudent: r.is_student ?? false,
  isShadow: r.is_shadow ?? false,
  isActive: r.is_active ?? true,
  inviteEmail: r.invite_email,
  studentStatus: r.student_status ?? 'active',
  createdAt: r.created_at,
});

/**
 * Role-scoped Profile list for the editorial users surface (SSR, RLS-bound).
 * - student-only → just their own row
 * - teacher (non-admin) → students linked via their lessons (inactive hidden by RLS)
 * - admin → all (RLS bypass via is_admin())
 * `active='false'` reveals deactivated rows (admin only, by RLS).
 */
export async function getUsersList(
  scope: UserListScope,
  filters: UserListFilters = {}
): Promise<UserListRow[]> {
  const supabase = await createClient();

  if (scope.isStudent && !scope.isAdmin && !scope.isTeacher) {
    const { data, error } = await supabase
      .from('profiles')
      .select(SELECT)
      .eq('id', scope.userId)
      .single();
    if (error || !data) return [];
    return [toRow(data as Row)];
  }

  let allowedStudentIds: string[] | null = null;
  if (scope.isTeacher && !scope.isAdmin) {
    const { data: lessonData } = await supabase
      .from('lessons')
      .select('student_id')
      .eq('teacher_id', scope.userId)
      .is('deleted_at', null);
    allowedStudentIds = Array.from(new Set((lessonData ?? []).map((l) => l.student_id)));
    if (allowedStudentIds.length === 0) return [];
  }

  let query = supabase.from('profiles').select(SELECT);

  if (allowedStudentIds !== null) {
    query = query.in('id', allowedStudentIds);
  }
  if (filters.search) {
    query = query.or(`email.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%`);
  }
  if (filters.role === 'admin') query = query.eq('is_admin', true);
  else if (filters.role === 'teacher') query = query.eq('is_teacher', true);
  else if (filters.role === 'student') query = query.eq('is_student', true);
  else if (filters.role === 'shadow') query = query.eq('is_shadow', true);

  if (filters.studentStatus && filters.studentStatus !== 'all') {
    query = query.eq('student_status', filters.studentStatus);
  }
  if (filters.active === 'true' || filters.active === 'false') {
    query = query.eq('is_active', filters.active === 'true');
  }

  const { data, error } = await query.order('created_at', { ascending: false }).limit(200);

  if (error) {
    logger.warn('[users-list-queries] list error', { error: error.message, code: error.code });
    return [];
  }

  return (data ?? []).map((r) => toRow(r as Row));
}
