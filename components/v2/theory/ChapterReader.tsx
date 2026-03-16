'use client';

import { lazy, Suspense } from 'react';
import { useLayoutMode } from '@/hooks/use-is-widescreen';
import { ChapterReaderMobile } from './ChapterReader.Mobile';
import type { ChapterNav } from './theory.types';

const ChapterReaderDesktop = lazy(() => import('./ChapterReader.Desktop'));

interface ChapterReaderV2Props {
  courseId: string;
  courseTitle: string;
  lesson: {
    id: string;
    title: string;
    content: string;
    updated_at: string;
  };
  prevChapter: ChapterNav | null;
  nextChapter: ChapterNav | null;
}

/**
 * v2 Chapter Reader component.
 * Mobile: Optimized reading layout with larger text and relaxed line-height.
 * Desktop: Centered prose with breadcrumb navigation.
 *
 * Data passed from the server component -- no new data fetching.
 */
export function ChapterReaderV2(props: ChapterReaderV2Props) {
  const mode = useLayoutMode();

  if (mode === 'mobile') return <ChapterReaderMobile {...props} />;

  return (
    <Suspense fallback={<ChapterReaderMobile {...props} />}>
      <ChapterReaderDesktop {...props} />
    </Suspense>
  );
}
