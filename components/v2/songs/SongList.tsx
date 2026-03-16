'use client';

import { lazy, Suspense } from 'react';
import { useLayoutMode } from '@/hooks/use-is-widescreen';
import { SongListMobile } from './SongList.Mobile';
import { SongListSkeleton } from './SongList.Skeleton';
import type { SongWithStatus } from '@/components/songs/types';

const SongListDesktop = lazy(() => import('./SongList.Desktop'));

export interface SongListV2Props {
  songs: SongWithStatus[];
  loading: boolean;
  error: string | null;
  isTeacher: boolean;
  onRefresh: () => void;
}

export function SongListV2(props: SongListV2Props) {
  const mode = useLayoutMode();

  if (props.loading) return <SongListSkeleton />;

  if (mode === 'mobile') return <SongListMobile {...props} />;

  return (
    <Suspense fallback={<SongListMobile {...props} />}>
      <SongListDesktop {...props} />
    </Suspense>
  );
}
