'use server';

import React from 'react';
import Image from 'next/image';
import SongDetailHeader from './Header';
import SongDetailInfo from './Info';
import LyricsWithChords from './LyricsWithChords';
import SongSections from './SongSections';
import SongDetailActions from './Actions';
import YouTubeEmbed from './YouTubeEmbed';
import ImageGallery from './ImageGallery';
import VideoGallery from '../videos/VideoGallery';
import type { Song } from '../types';
import type { SongVideo } from '@/types/SongVideo';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

interface Props {
  songId: string;
  isAdmin?: boolean;
  isTeacher?: boolean;
}

async function loadSongData(songId: string): Promise<Song | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('songs')
      .select('id, title, author, level, key, chords, audio_files, gallery_images, cover_image_url, youtube_url, ultimate_guitar_link, spotify_link_url, tiktok_short_url, lyrics_with_chords, short_title, notes, category, capo_fret, strumming_pattern, tempo, time_signature, duration_ms, release_year, search_vector, deleted_at, created_at, updated_at')
      .eq('id', songId)
      .is('deleted_at', null)
      .single();

    if (error) {
      logger.error('[SongDetail Server] Supabase error:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return data as Song;
  } catch (err) {
    logger.error('[SongDetail Server] Exception:', err);
    return null;
  }
}

async function loadVideos(songId: string): Promise<SongVideo[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('song_videos')
      .select('id, song_id, uploaded_by, google_drive_file_id, google_drive_folder_id, title, filename, mime_type, file_size_bytes, duration_seconds, thumbnail_url, display_order, video_type, published_to_instagram, published_to_tiktok, published_to_youtube_shorts, instagram_media_id, tiktok_media_id, youtube_shorts_id, created_at, updated_at')
      .eq('song_id', songId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('[SongDetail Server] Videos fetch error:', error);
      return [];
    }
    return data as SongVideo[];
  } catch (err) {
    logger.error('[SongDetail Server] Videos exception:', err);
    return [];
  }
}

export default async function SongDetail({ songId, isAdmin = false, isTeacher = false }: Props) {
  const [song, videos] = await Promise.all([
    loadSongData(songId),
    loadVideos(songId),
  ]);

  if (!song) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-destructive">
        <p className="font-semibold mb-2">Error Loading Song</p>
        <p className="text-sm">Song not found or you do not have permission to view it</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-muted/30 p-6 md:p-8 rounded-2xl border border-border mt-2 relative overflow-hidden">
        {song.cover_image_url && (
          <div
            className="absolute inset-0 opacity-[0.03] blur-2xl pointer-events-none scale-110 transform-gpu"
            style={{
              backgroundImage: `url(${song.cover_image_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-6 relative z-10 w-full md:w-auto">
          {song.cover_image_url && (
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl overflow-hidden shadow-sm ring-1 ring-border/50">
              <Image
                src={song.cover_image_url}
                alt={`${song.title} cover`}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
          <SongDetailHeader
            title={song.title || 'Untitled'}
            author={song.author || 'Unknown'}
            level={song.level}
            songKey={song.key}
            durationMs={song.duration_ms}
            releaseYear={song.release_year}
          />
        </div>

        <div className="relative z-10 w-full md:w-auto mt-2 md:mt-0 flex justify-start md:justify-end">
          <SongDetailActions
            songId={song.id}
            songTitle={song.title || 'Untitled'}
            hasSpotifyData={!!song.spotify_link_url}
            isAdmin={isAdmin}
            isTeacher={isTeacher}
          />
        </div>
      </div>

      <div className="space-y-8">
        <SongDetailInfo song={song} />
        <SongSections songId={song.id} />
        <LyricsWithChords song={song} />
        {videos.length === 0 && <YouTubeEmbed url={song.youtube_url} />}
        <ImageGallery images={song.gallery_images} />
        {videos.length > 0 && <VideoGallery songId={song.id} isTeacher={isAdmin || isTeacher} initialVideos={videos} />}
      </div>
    </div>
  );
}
