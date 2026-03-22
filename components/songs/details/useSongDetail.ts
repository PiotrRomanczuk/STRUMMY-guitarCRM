'use client';

import { useMutation } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import { queryClient } from '@/lib/query-client';
import { apiClient } from '@/lib/api-client';
import type { Song } from '../types';
import { useEffect, useState, useRef } from 'react';

interface DeleteResult {
  success: boolean;
  cascadeInfo?: Record<string, number>;
  error?: string;
}

async function loadSongDetail(songId: string): Promise<Song | undefined> {
  if (!songId) return undefined;

  const supabase = getSupabaseBrowserClient();
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    throw new Error('Not authenticated. Please sign in.');
  }

  const { data, error: fetchError } = await supabase
    .from('songs')
    .select('id, title, author, level, key, chords, audio_files, gallery_images, cover_image_url, youtube_url, ultimate_guitar_link, spotify_link_url, tiktok_short_url, lyrics_with_chords, short_title, notes, category, capo_fret, strumming_pattern, tempo, time_signature, duration_ms, release_year, search_vector, deleted_at, created_at, updated_at')
    .eq('id', songId)
    .is('deleted_at', null)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw new Error('Song not found or has been deleted');
    } else if (fetchError.code === 'PGRST501') {
      throw new Error('You do not have permission to view this song');
    }
    throw new Error(fetchError.message || 'Failed to load song');
  }

  if (!data) {
    throw new Error('Song not found');
  }

  return data as Song;
}

async function deleteSongDetail(songId: string): Promise<DeleteResult> {
  return await apiClient.delete<DeleteResult>(`/api/song?id=${songId}`);
}

export function useSongDetail(songId: string, onDeleted?: () => void) {
  const router = useRouter();
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchedIdRef = useRef<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!songId || songId === lastFetchedIdRef.current) return;

    lastFetchedIdRef.current = songId;
    let isMounted = true;

    const fetchSong = async () => {
      try {
        const data = await loadSongDetail(songId);
        if (isMounted) {
          setSong(data || null);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : String(err));
          setSong(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSong();

    return () => {
      isMounted = false;
      lastFetchedIdRef.current = null;
    };
  }, [songId]);

  const { mutate: deleteSong, isPending: deleting } = useMutation({
    mutationFn: (id: string) => deleteSongDetail(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      onDeleted?.();
      router.push('/dashboard/songs');
    },
  });

  const handleDelete = () => {
    if (!song) return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!song) return;
    setShowDeleteConfirm(false);
    deleteSong(song.id);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const refetch = () => {
    setLoading(true);
    setError(null);

    loadSongDetail(songId)
      .then((data) => {
        setSong(data || null);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
        setSong(null);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return {
    song,
    loading,
    error,
    deleting,
    handleDelete,
    refetch,
    showDeleteConfirm,
    confirmDelete,
    cancelDelete,
  };
}
