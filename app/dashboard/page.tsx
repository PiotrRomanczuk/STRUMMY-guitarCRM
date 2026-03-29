import { createClient } from '@/lib/supabase/server';
import { DashboardPageContent } from '@/components/dashboard/Dashboard';
import { AdminDashboardClient } from '@/components/dashboard/admin/AdminDashboardClient';
import { StudentDashboardClient } from '@/components/dashboard/student/StudentDashboardClient';
import { TeacherDashboardClient } from '@/components/dashboard/teacher/TeacherDashboardClient';
import { TeacherDashboardV2, StudentDashboardV2 } from '@/components/v2/dashboard';
import { RoleSwitcher } from '@/components/dashboard/RoleSwitcher';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { getStudentDashboardData } from '@/app/actions/student/dashboard';
import { getTeacherDashboardData } from '@/app/actions/teacher/dashboard';
import { getCurrentSongOfTheWeek } from '@/app/actions/song-of-the-week';
import { getUIVersion } from '@/lib/ui-version.server';

function resolveActiveView(
  view: string | string[] | undefined,
  isAdmin: boolean,
  isTeacher: boolean,
  isStudent: boolean
): 'admin' | 'teacher' | 'student' {
  const v = typeof view === 'string' ? view : undefined;
  if (v === 'admin' && isAdmin) return 'admin';
  if (v === 'student' && isStudent) return 'student';
  if (v === 'teacher' && isTeacher) return 'teacher';
  // Default priority: teacher > student > admin
  if (isTeacher) return 'teacher';
  if (isStudent) return 'student';
  if (isAdmin) return 'admin';
  return 'teacher';
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { view } = await searchParams;
  const { user, isAdmin, isTeacher, isStudent } = await getUserWithRolesSSR();

  if (!user) {
    return <div>Please log in to access the dashboard.</div>;
  }

  const activeView = resolveActiveView(view, isAdmin, isTeacher, isStudent);
  const hasMultipleRoles = [isAdmin, isTeacher, isStudent].filter(Boolean).length > 1;

  // Fetch user profile and Song of the Week in parallel
  const supabase = await createClient();
  const [{ data: profile }, sotw] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    getCurrentSongOfTheWeek(),
  ]);

  const roleSwitcher = hasMultipleRoles ? (
    <RoleSwitcher
      isAdmin={isAdmin}
      isTeacher={isTeacher}
      isStudent={isStudent}
      activeView={activeView}
    />
  ) : null;

  // Admin View
  if (activeView === 'admin') {
    const [
      { count: totalUsers },
      { count: totalTeachers },
      { count: totalStudents },
      { count: activeStudents },
      { count: totalSongs },
      { count: totalLessons },
      { data: recentUsers },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_teacher', true),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_student', true),
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_student', true)
        .eq('student_status', 'active'),
      supabase.from('songs').select('*', { count: 'exact', head: true }),
      supabase.from('lessons').select('*', { count: 'exact', head: true }),
      supabase
        .from('profiles')
        .select('id, full_name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const adminStats = {
      totalUsers: totalUsers || 0,
      totalTeachers: totalTeachers || 0,
      totalStudents: totalStudents || 0,
      activeStudents: activeStudents || 0,
      totalSongs: totalSongs || 0,
      totalLessons: totalLessons || 0,
      recentUsers:
        (recentUsers as
          | { id: string; full_name: string; email: string; created_at: string }[]
          | null) || [],
    };

    return (
      <>
        {roleSwitcher}
        <AdminDashboardClient
          stats={adminStats}
          user={user}
          profile={profile}
          viewMode="admin"
          sotw={sotw}
        />
      </>
    );
  }

  // Student View
  if (activeView === 'student') {
    const [studentData, uiVersion] = await Promise.all([getStudentDashboardData(), getUIVersion()]);

    let sotwInRepertoire = false;
    if (sotw) {
      const { count } = await supabase
        .from('student_repertoire')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', user.id)
        .eq('song_id', sotw.song_id);
      sotwInRepertoire = (count ?? 0) > 0;
    }

    if (uiVersion === 'v2') {
      return (
        <>
          {roleSwitcher}
          <StudentDashboardV2
            data={studentData}
            email={user.email}
            sotw={sotw}
            sotwInRepertoire={sotwInRepertoire}
          />
        </>
      );
    }

    return (
      <>
        {roleSwitcher}
        <StudentDashboardClient
          data={studentData}
          email={user.email}
          sotw={sotw}
          sotwInRepertoire={sotwInRepertoire}
        />
      </>
    );
  }

  // Teacher View (default)
  if (activeView === 'teacher') {
    const [teacherData, uiVersion] = await Promise.all([getTeacherDashboardData(), getUIVersion()]);

    if (uiVersion === 'v2') {
      return (
        <>
          {roleSwitcher}
          <TeacherDashboardV2
            data={teacherData}
            email={user.email}
            fullName={profile?.full_name}
            isAdmin={isAdmin}
            sotw={sotw}
          />
        </>
      );
    }

    return (
      <>
        {roleSwitcher}
        <TeacherDashboardClient
          data={teacherData}
          email={user.email}
          fullName={profile?.full_name}
          isAdmin={isAdmin}
          sotw={sotw}
        />
      </>
    );
  }

  return (
    <DashboardPageContent
      email={user.email}
      fullName={profile?.full_name}
      isAdmin={isAdmin}
      isTeacher={isTeacher}
      isStudent={isStudent}
    />
  );
}
