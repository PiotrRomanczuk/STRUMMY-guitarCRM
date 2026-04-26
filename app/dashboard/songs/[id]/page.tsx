import { Suspense } from 'react';
import { SongDetail, SongLessons, SongAssignments, SongStudents } from '@/components/songs';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { Breadcrumbs } from '@/components/shared';
import { redirect } from 'next/navigation';
import { getSongStudents } from './actions';
import { StudentSongDetailPageClient } from '@/components/songs/student/StudentSongDetailPageClient';
import { SongStatusHistory } from '@/components/shared/SongStatusHistory';
import { Skeleton } from '@/components/ui/skeleton';
import { SongDetailPageV2 } from '@/components/v2/songs/SongDetailPage';
import { getUIVersion } from '@/lib/ui-version.server';

interface SearchParams {
  [key: string]: string | string[] | undefined;
}

interface SongPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<SearchParams>;
}

export default async function SongPage({ params, searchParams }: SongPageProps) {
  const [{ user, isAdmin, isTeacher, isStudent }, uiVersion] = await Promise.all([
    getUserWithRolesSSR(),
    getUIVersion(),
  ]);
  if (!user) {
    redirect('/sign-in');
  }

  // If user is a student and NOT an admin/teacher, show the student view
  if (isStudent && !isAdmin && !isTeacher) {
    return <StudentSongDetailPageClient />;
  }

  const { id } = await params;
  // Ensure searchParams are awaited to satisfy the interface, even if unused
  await searchParams;

  // v2 UI: client-side detail with tabs
  if (uiVersion === 'v2') {
    return <SongDetailPageV2 />;
  }

  // Fetch students if user is teacher or admin
  const canViewStudents = isAdmin || isTeacher;
  const students = canViewStudents ? await getSongStudents(id) : [];

  return (
    <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Songs', href: '/dashboard/songs' },
          { label: 'Song Details' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Suspense fallback={<DetailSkeleton />}>
            <SongDetail songId={id} isAdmin={isAdmin} isTeacher={isTeacher} />
          </Suspense>

          <Suspense fallback={<ListSkeleton title="Lessons" />}>
            <SongLessons songId={id} />
          </Suspense>

          <Suspense fallback={<ListSkeleton title="Assignments" />}>
            <SongAssignments songId={id} />
          </Suspense>

          {canViewStudents && (
            <Suspense fallback={<ListSkeleton title="Active Students" />}>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Active Students
                </h2>
                <SongStudents students={students} />
              </div>
            </Suspense>
          )}
        </div>

        <div className="lg:col-span-1">
          <Suspense fallback={<HistorySkeleton />}>
            <SongStatusHistory songId={id} title="Learning Progress" />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

// Skeleton components for progressive rendering
function DetailSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <Skeleton className="h-8 w-64" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

function ListSkeleton({ title: _title }: { title: string }) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <Skeleton className="h-5 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <Skeleton className="h-6 w-40" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
