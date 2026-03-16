'use client';

import { lazy, Suspense } from 'react';
import { useLayoutMode } from '@/hooks/use-is-widescreen';
import { LiveLessonMobile } from './LiveLesson.Mobile';
import type { LiveLessonData } from '@/components/lessons/live/live-lesson.types';

const LiveLessonDesktop = lazy(() => import('./LiveLesson.Desktop'));

export interface LiveLessonV2Props {
  lesson: LiveLessonData;
}

/**
 * v2 Live Lesson with responsive layout switching.
 * Mobile renders a focused card-based view with large touch targets.
 * Desktop lazy-loads the side-panel layout.
 */
export function LiveLessonV2(props: LiveLessonV2Props) {
  const mode = useLayoutMode();

  if (mode === 'mobile') return <LiveLessonMobile {...props} />;

  return (
    <Suspense fallback={<LiveLessonMobile {...props} />}>
      <LiveLessonDesktop {...props} />
    </Suspense>
  );
}
