'use client';

import { lazy, Suspense } from 'react';
import { useLayoutMode } from '@/hooks/use-is-widescreen';
import { LessonDetailMobile } from './LessonDetail.Mobile';
import type { LessonDetailV2Props } from './LessonDetail.types';

const LessonDetailDesktop = lazy(() => import('./LessonDetail.Desktop'));

export type { LessonDetailV2Props } from './LessonDetail.types';

export function LessonDetailV2(props: LessonDetailV2Props) {
  const mode = useLayoutMode();

  if (mode === 'mobile') return <LessonDetailMobile {...props} />;

  return (
    <Suspense fallback={<LessonDetailMobile {...props} />}>
      <LessonDetailDesktop {...props} />
    </Suspense>
  );
}
