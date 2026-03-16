'use client';

import { lazy, Suspense } from 'react';
import { useLayoutMode } from '@/hooks/use-is-widescreen';
import type { StudentDashboardData } from '@/app/actions/student/dashboard';
import type { SongOfTheWeekWithSong } from '@/types/SongOfTheWeek';
import { StudentDashboardMobile } from './StudentDashboard.Mobile';
import { StudentDashboardSkeleton } from './StudentDashboard.Skeleton';

const StudentDashboardDesktop = lazy(
  () => import('./StudentDashboard.Desktop')
);

export interface StudentDashboardV2Props {
  data: StudentDashboardData;
  email?: string;
  sotw?: SongOfTheWeekWithSong | null;
  sotwInRepertoire?: boolean;
}

export function StudentDashboardV2(props: StudentDashboardV2Props) {
  const mode = useLayoutMode();

  if (mode === 'mobile') return <StudentDashboardMobile {...props} />;

  return (
    <Suspense fallback={<StudentDashboardSkeleton />}>
      <StudentDashboardDesktop {...props} />
    </Suspense>
  );
}
