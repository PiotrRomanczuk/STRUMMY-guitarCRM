'use client';

import { lazy, Suspense } from 'react';
import { useLayoutMode } from '@/hooks/use-is-widescreen';
import { CourseListMobile } from './CourseList.Mobile';
import type { TheoryCourse } from './theory.types';

const CourseListDesktop = lazy(() => import('./CourseList.Desktop'));

interface CourseListV2Props {
  courses: TheoryCourse[];
  isStaff: boolean;
}

/**
 * v2 Theory Course List component.
 * Mobile: Card-based list in MobilePageShell with FAB for creation.
 * Desktop: Grid card layout with creation button in header.
 *
 * Data is passed from the server component page -- no new data fetching.
 */
export function CourseListV2({ courses, isStaff }: CourseListV2Props) {
  const mode = useLayoutMode();

  if (mode === 'mobile') {
    return <CourseListMobile courses={courses} isStaff={isStaff} />;
  }

  return (
    <Suspense fallback={<CourseListMobile courses={courses} isStaff={isStaff} />}>
      <CourseListDesktop courses={courses} isStaff={isStaff} />
    </Suspense>
  );
}
