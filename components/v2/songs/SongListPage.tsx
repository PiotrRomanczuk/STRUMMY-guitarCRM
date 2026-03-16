'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { SongListV2 } from './SongList';
import type { SongWithStatus } from '@/components/songs/types';

interface SongListPageV2Props {
  initialSongs: SongWithStatus[];
  isTeacher: boolean;
}

/**
 * Page-level v2 song list client component.
 * Receives server-fetched songs as props for instant render (no loading skeleton).
 */
export function SongListPageV2({ initialSongs, isTeacher }: SongListPageV2Props) {
  const router = useRouter();
  const handleRefresh = useCallback(() => router.refresh(), [router]);

  return (
    <SongListV2
      songs={initialSongs}
      loading={false}
      error={null}
      isTeacher={isTeacher}
      onRefresh={handleRefresh}
    />
  );
}
