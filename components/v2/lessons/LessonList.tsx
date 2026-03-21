'use client';

import { lazy, Suspense, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLayoutMode } from '@/hooks/use-is-widescreen';
import { LessonListMobile } from './LessonList.Mobile';
import { LessonListSkeleton } from './LessonList.Skeleton';
import { useLessonRefresh } from './useLessonRefresh';
import { useCalendarSync } from './useCalendarSync';
import { CalendarSyncProgress } from './CalendarSyncProgress';
import type { LessonListV2Props } from './lesson.types';

const LessonListDesktop = lazy(() => import('./LessonList.Desktop'));

/**
 * v2 Lesson list with responsive layout switching.
 * Mobile renders card-based list by default.
 * Desktop lazy-loads the table view.
 */
export function LessonListV2(props: LessonListV2Props) {
  const mode = useLayoutMode();
  const router = useRouter();
  const pathname = usePathname();
  const { refresh, isRefreshing } = useLessonRefresh();
  const { syncCalendar, cancelSync, dismiss, progress, isSyncing } = useCalendarSync();

  const handleYearChange = useCallback(
    (year: number) => {
      const params = new URLSearchParams();
      params.set('year', String(year));
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname]
  );

  const enrichedProps = {
    ...props,
    onRefresh: refresh,
    isRefreshing,
    onSyncCalendar: syncCalendar,
    isSyncing,
    onYearChange: handleYearChange,
  };

  const syncOverlay = (
    <CalendarSyncProgress
      progress={progress}
      onDismiss={dismiss}
      onCancel={cancelSync}
    />
  );

  if (mode === 'mobile') {
    return (
      <>
        <LessonListMobile {...enrichedProps} />
        {syncOverlay}
      </>
    );
  }

  return (
    <>
      <Suspense fallback={<LessonListSkeleton />}>
        <LessonListDesktop {...enrichedProps} />
      </Suspense>
      {syncOverlay}
    </>
  );
}
