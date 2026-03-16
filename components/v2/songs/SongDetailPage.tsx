'use client';

import { useParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useSongDetail } from '@/components/songs/details/useSongDetail';
import { SongDetailV2 } from './SongDetail';

/**
 * Page-level v2 song detail client component.
 * Reuses the existing useSongDetail hook for data fetching.
 */
export function SongDetailPageV2() {
  const params = useParams();
  const songId = params?.id as string;
  const { isTeacher, isAdmin } = useAuth();
  const { song, loading, error, handleDelete } = useSongDetail(songId);

  return (
    <SongDetailV2
      songId={songId}
      song={song}
      loading={loading}
      error={error}
      isTeacher={isTeacher || isAdmin}
      onDelete={handleDelete}
    />
  );
}
