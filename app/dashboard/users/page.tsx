import { Suspense } from 'react';
import { UsersList } from '@/components/users';
import { UserListV2 } from '@/components/v2/users';
import { createClient } from '@/lib/supabase/server';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { getUIVersion } from '@/lib/ui-version.server';
import { ListPageSkeleton } from '@/components/ui/skeleton-screens';

export const metadata = {
  title: 'Users',
  description: 'Manage users in the system',
};

interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  is_admin: boolean;
  is_teacher: boolean;
  is_student: boolean;
  is_active: boolean | null;
  is_shadow: boolean | null;
  student_status: string | null;
  created_at: string | null;
}

function toUserProfile(row: ProfileRow) {
  return {
    id: row.id,
    user_id: null,
    email: row.email,
    full_name: row.full_name ?? null,
    firstName: null,
    lastName: null,
    username: null,
    isAdmin: row.is_admin ?? false,
    isTeacher: row.is_teacher ?? false,
    isStudent: row.is_student ?? false,
    isActive: row.is_active ?? true,
    isRegistered: !row.is_shadow,
    studentStatus: (row.student_status as 'active' | 'archived') ?? 'active',
    created_at: row.created_at,
  };
}

const PROFILE_FIELDS =
  'id, email, full_name, is_admin, is_teacher, is_student, is_active, is_shadow, student_status, created_at';

async function fetchInitialUsers() {
  const { user, isAdmin, isTeacher, isStudent } = await getUserWithRolesSSR();

  if (!user || (!isAdmin && !isTeacher && !isStudent)) {
    return [];
  }

  const supabase = await createClient();

  // Student: only see own profile
  if (isStudent && !isAdmin && !isTeacher) {
    const { data } = await supabase
      .from('profiles')
      .select(PROFILE_FIELDS)
      .eq('id', user.id)
      .single();
    return data ? [toUserProfile(data as ProfileRow)] : [];
  }

  // Teacher: see students from active lessons
  let query = supabase.from('profiles').select(PROFILE_FIELDS);

  if (isTeacher && !isAdmin) {
    const { data: lessonData } = await supabase
      .from('lessons')
      .select('student_id')
      .eq('teacher_id', user.id)
      .is('deleted_at', null);

    const allowedStudentIds = Array.from(
      new Set((lessonData || []).map((l) => l.student_id))
    );

    if (allowedStudentIds.length === 0) {
      return [];
    }

    query = query.in('id', allowedStudentIds);
  }

  const { data } = await query.eq('student_status', 'active').limit(50);

  return (data ?? []).map((row) => toUserProfile(row as ProfileRow));
}

export default async function UsersPage() {
  const [initialUsers, uiVersion] = await Promise.all([
    fetchInitialUsers(),
    getUIVersion(),
  ]);

  if (uiVersion === 'v2') {
    return (
      <Suspense fallback={<ListPageSkeleton />}>
        <UserListV2 initialUsers={initialUsers} />
      </Suspense>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl">
      <div className="space-y-4 sm:space-y-6 opacity-0 animate-fade-in">
        <Suspense fallback={<ListPageSkeleton />}>
          <UsersList initialUsers={initialUsers} />
        </Suspense>
      </div>
    </div>
  );
}
