import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateMutationPermission } from '@/lib/auth/permissions';
import { getCurrentlyPlaying } from '@/lib/spotify-user';
import { getTrack, getAudioFeatures } from '@/lib/spotify';
import { SongDraftSchema } from '@/schemas/SongSchema';
import {
  mapSpotifyToSongDraft,
  type SpotifyAudioFeatures,
} from '@/app/api/song/from-spotify/spotify-mapper';
import { logger } from '@/lib/logger';
import type { SpotifyApiTrack } from '@/types/spotify';

/**
 * POST /api/spotify/send-to-strummy
 * One-tap: gets currently playing track from Spotify → creates draft song.
 * This is the single endpoint the Apple Shortcut calls.
 * Requires API key auth with teacher/admin role.
 */
export async function POST(request: Request) {
  try {
    // Auth
    const auth = await authenticateRequest(request);
    if (!auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
    }

    // Role check
    const supabase = createAdminClient();
    const { data: profileData } = await supabase
      .from('profiles')
      .select('is_admin, is_teacher')
      .eq('id', auth.user.id)
      .single();

    if (
      !profileData ||
      !validateMutationPermission({
        isAdmin: profileData.is_admin,
        isTeacher: profileData.is_teacher,
      })
    ) {
      return NextResponse.json(
        { error: 'Forbidden: teacher or admin role required' },
        { status: 403 }
      );
    }

    // Get currently playing track
    let nowPlaying;
    try {
      nowPlaying = await getCurrentlyPlaying();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('SPOTIFY_USER_REFRESH_TOKEN')) {
        return NextResponse.json(
          { error: 'Spotify not connected. Visit /dashboard/admin/spotify-connect' },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: `Spotify error: ${message}` }, { status: 502 });
    }

    if (!nowPlaying) {
      return NextResponse.json(
        { error: 'Nothing is playing on Spotify right now' },
        { status: 404 }
      );
    }

    // Fetch full track data (for all metadata fields)
    let track: SpotifyApiTrack;
    try {
      track = (await getTrack(nowPlaying.id)) as SpotifyApiTrack;
    } catch (error) {
      logger.error('[send-to-strummy] Track fetch failed', { error: String(error) });
      return NextResponse.json({ error: 'Failed to fetch track from Spotify' }, { status: 502 });
    }

    // Audio features (optional)
    let features: SpotifyAudioFeatures | null = null;
    try {
      features = (await getAudioFeatures(nowPlaying.id)) as SpotifyAudioFeatures;
    } catch {
      // Non-critical
    }

    // Map to draft
    const draft = mapSpotifyToSongDraft(track, features);

    const validationResult = SongDraftSchema.safeParse(draft);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Song data validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    // Insert
    const { data: song, error: dbError } = await supabase
      .from('songs')
      .insert(validationResult.data)
      .select()
      .single();

    if (dbError) {
      if (dbError.code === '23505') {
        return NextResponse.json(
          {
            error: `${nowPlaying.title} by ${nowPlaying.artist} already exists in Strummy`,
            existing: true,
            track: { title: nowPlaying.title, artist: nowPlaying.artist },
          },
          { status: 409 }
        );
      }
      logger.error('[send-to-strummy] DB error', { error: dbError.message });
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        song,
        source: 'now-playing',
        message: `Added ${nowPlaying.title} by ${nowPlaying.artist} to Strummy`,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('[send-to-strummy] Unexpected error', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
