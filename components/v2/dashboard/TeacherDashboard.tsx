'use client';

import { lazy, Suspense } from 'react';
import { useLayoutMode } from '@/hooks/use-is-widescreen';
import type { TeacherDashboardData } from '@/app/actions/teacher/dashboard';
import type { SongOfTheWeekWithSong } from '@/types/SongOfTheWeek';
import { TeacherDashboardMobile } from './TeacherDashboard.Mobile';

const TeacherDashboardDesktop = lazy(
  () => import('./TeacherDashboard.Desktop')
);

export interface TeacherDashboardV2Props {
  data: TeacherDashboardData;
  email?: string;
  fullName?: string | null;
  isAdmin?: boolean;
  sotw?: SongOfTheWeekWithSong | null;
}

export function TeacherDashboardV2(props: TeacherDashboardV2Props) {
  const mode = useLayoutMode();

  if (mode === 'mobile') return <TeacherDashboardMobile {...props} />;

  return (
    <Suspense fallback={<TeacherDashboardMobile {...props} />}>
      <TeacherDashboardDesktop {...props} />
    </Suspense>
  );
}
