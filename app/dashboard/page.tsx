import '@/app/design-preview/editorial-tokens.css';

import { Fraunces, Geist, Geist_Mono } from 'next/font/google';
import { Suspense } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingCard } from '@/components/dashboard/states';
import { TodayLessons, UpcomingLessons } from '@/components/dashboard/cards';
import { AdminDashboardEditorial } from '@/components/dashboard/editorial/admin/AdminDashboardEditorial';
import { StudentDashboardEditorial } from '@/components/dashboard/editorial/student/StudentDashboardEditorial';
import { TeacherDashboardEditorial } from '@/components/dashboard/editorial/teacher/TeacherDashboardEditorial';
import { createClient } from '@/lib/supabase/server';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { getPendingInvites, getPlatformPulse } from '@/lib/services/admin-dashboard-queries';
import { getStudentNextLesson, getStudentTopSongs } from '@/lib/services/student-dashboard-queries';
import {
  getTeacherDayLessons,
  summariseDayLessons,
} from '@/lib/services/teacher-dashboard-queries';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  weight: ['400', '500'],
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  axes: ['opsz'],
  display: 'swap',
});

function resolveRoleLabel(isAdmin: boolean, isTeacher: boolean, isStudent: boolean): string {
  const roles: string[] = [];
  if (isAdmin) roles.push('Admin');
  if (isTeacher) roles.push('Teacher');
  if (isStudent) roles.push('Student');
  return roles.length > 0 ? roles.join(' · ') : 'No role assigned';
}

function resolveActiveView(
  view: string | undefined,
  isAdmin: boolean,
  isTeacher: boolean,
  isStudent: boolean
): 'admin' | 'teacher' | 'student' {
  if (view === 'admin' && isAdmin) return 'admin';
  if (view === 'student' && isStudent) return 'student';
  if (view === 'teacher' && isTeacher) return 'teacher';
  if (isTeacher) return 'teacher';
  if (isStudent) return 'student';
  if (isAdmin) return 'admin';
  return 'teacher';
}

async function loadProfileName(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select('full_name').eq('id', userId).single();
  return (data?.full_name as string | null) ?? null;
}

async function TeacherEditorialView({ userId, email }: { userId: string; email: string }) {
  const now = new Date();
  const [fullName, lessons] = await Promise.all([
    loadProfileName(userId),
    getTeacherDayLessons(userId, now),
  ]);
  const stats = summariseDayLessons(lessons);
  return (
    <div className={`theme-editorial ${geist.variable} ${geistMono.variable} ${fraunces.variable}`}>
      <TeacherDashboardEditorial
        fullName={fullName}
        email={email}
        now={now}
        lessons={lessons}
        stats={stats}
      />
    </div>
  );
}

async function AdminEditorialView() {
  const now = new Date();
  const [pulse, invites] = await Promise.all([getPlatformPulse(), getPendingInvites()]);
  return (
    <div className={`theme-editorial ${geist.variable} ${geistMono.variable} ${fraunces.variable}`}>
      <AdminDashboardEditorial pulse={pulse} invites={invites} now={now} />
    </div>
  );
}

async function StudentEditorialView({ userId, email }: { userId: string; email: string }) {
  const now = new Date();
  const [fullName, nextLesson, songs] = await Promise.all([
    loadProfileName(userId),
    getStudentNextLesson(userId),
    getStudentTopSongs(userId),
  ]);
  return (
    <div className={`theme-editorial ${geist.variable} ${geistMono.variable} ${fraunces.variable}`}>
      <StudentDashboardEditorial
        fullName={fullName}
        email={email}
        now={now}
        nextLesson={nextLesson}
        songs={songs}
      />
    </div>
  );
}

function LegacyShell({
  user,
  isAdmin,
  isTeacher,
  isStudent,
  activeView,
}: {
  user: { id: string; email?: string | null } | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  activeView: 'admin' | 'teacher' | 'student';
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">Dashboard rebuild in progress.</p>
          <p>
            <span className="font-medium">Signed in as:</span>{' '}
            <span className="text-muted-foreground">{user?.email ?? 'unknown'}</span>
          </p>
          <p>
            <span className="font-medium">Role:</span>{' '}
            <span className="text-muted-foreground">
              {resolveRoleLabel(isAdmin, isTeacher, isStudent)}
            </span>
          </p>
        </CardContent>
      </Card>
      {activeView === 'teacher' && user && (
        <>
          <Suspense fallback={<LoadingCard />}>
            <TodayLessons teacherId={user.id} />
          </Suspense>
          <Suspense fallback={<LoadingCard />}>
            <UpcomingLessons teacherId={user.id} />
          </Suspense>
        </>
      )}
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { view } = await searchParams;
  const { user, isAdmin, isTeacher, isStudent } = await getUserWithRolesSSR();
  const activeView = resolveActiveView(
    typeof view === 'string' ? view : undefined,
    isAdmin,
    isTeacher,
    isStudent
  );

  if (activeView === 'teacher' && user) {
    return <TeacherEditorialView userId={user.id} email={user.email ?? ''} />;
  }

  if (activeView === 'student' && user) {
    return <StudentEditorialView userId={user.id} email={user.email ?? ''} />;
  }

  if (activeView === 'admin' && user) {
    return <AdminEditorialView />;
  }

  return (
    <LegacyShell
      user={user}
      isAdmin={isAdmin}
      isTeacher={isTeacher}
      isStudent={isStudent}
      activeView={activeView}
    />
  );
}
