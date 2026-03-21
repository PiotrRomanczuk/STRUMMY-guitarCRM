'use client';

import { lazy, Suspense } from 'react';
import { useLayoutMode } from '@/hooks/use-is-widescreen';
import { LessonListMobile } from './LessonList.Mobile';
import { LessonListSkeleton } from './LessonList.Skeleton';
import { useLessonRefresh } from './useLessonRefresh';
import type { LessonListV2Props } from './lesson.types';

const LessonListDesktop = lazy(() => import('./LessonList.Desktop'));

/**
 * v2 Lesson list with responsive layout switching.
 * Mobile renders card-based list by default.
 * Desktop lazy-loads the table view.
 */
export function LessonListV2(props: LessonListV2Props) {
  const mode = useLayoutMode();
  const { refresh, isRefreshing } = useLessonRefresh();

  const enrichedProps = { ...props, onRefresh: refresh, isRefreshing };

  if (mode === 'mobile') return <LessonListMobile {...enrichedProps} />;

  return (
    <Suspense fallback={<LessonListSkeleton />}>
      <LessonListDesktop {...enrichedProps} />
    </Suspense>
  );
}
