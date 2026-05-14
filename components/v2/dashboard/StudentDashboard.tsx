'use client';

import { lazy, Suspense } from 'react';
import { useLayoutMode } from '@/hooks/use-is-widescreen';
import type { StudentDashboardData } from '@/app/actions/student/dashboard';
import type { SongOfTheWeekWithSong } from '@/types/SongOfTheWeek';
import { StudentDashboardMobile } from './StudentDashboard.Mobile';
import { StudentDashboardSkeleton } from './StudentDashboard.Skeleton';

const StudentDashboardDesktop = lazy(() => import('./StudentDashboard.Desktop'));

/**
 * Extends the server action type with fields from Team Alpha's contract.
 * If Alpha's branch hasn't landed yet, the fallback (`?? 0`) keeps things safe.
 */
export type StudentDashboardDataExtended = StudentDashboardData & {
  practiceStreakDays?: number;
  realChartData?: { day: string; lessons: number; practiceMinutes: number }[];
};

export interface StudentDashboardV2Props {
  data: StudentDashboardDataExtended;
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
