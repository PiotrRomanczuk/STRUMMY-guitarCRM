'use client';

import React from 'react';
import SongForm from '.';
import { useSong } from '../hooks';
import { useRouter } from 'next/navigation';

interface Props {
  mode: 'create' | 'edit';
  songId?: string;
  onSuccess?: (songId?: string) => void;
}

export default function SongFormGuard({ mode, songId, onSuccess }: Props) {
  // Server-side API enforces authorization; client renders form optimistically.
  const router = useRouter();

  const { song, loading, error } = useSong(songId || '');

  if (mode === 'edit' && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (mode === 'edit' && error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-destructive">Error: {error}</div>
      </div>
    );
  }

  const handleSuccess = (songId?: string) => {
    if (onSuccess) {
      onSuccess(songId);
    } else if (songId) {
      router.push(`/dashboard/songs/${songId}`);
    } else {
      router.push('/dashboard/songs');
    }
  };

  return <SongForm mode={mode} song={song} onSuccess={handleSuccess} />;
}
