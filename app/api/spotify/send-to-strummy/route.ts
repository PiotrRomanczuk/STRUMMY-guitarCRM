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
 * Log an import attempt to apple_shortcut_song_import_log.
 * Non-blocking — errors are swallowed so they don't affect the response.
 */
function logImport(params: {
  userId: string;
  spotifyUrl?: string | null;
  spotifyTrackId?: string | null;
  songTitle?: string | null;
  songArtist?: string | null;
  songId?: string | null;
  status: 'success' | 'duplicate' | 'error';
  errorMessage?: string | null;
  httpStatus: number;
  source?: string;
}) {
  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (supabase as any)
    .from('apple_shortcut_song_import_log')
    .insert({
      user_id: params.userId,
      spotify_url: params.spotifyUrl ?? null,
      spotify_track_id: params.spotifyTrackId ?? null,
      song_title: params.songTitle ?? null,
      song_artist: params.songArtist ?? null,
      song_id: params.songId ?? null,
      status: params.status,
      error_message: params.errorMessage ?? null,
      http_status: params.httpStatus,
      source: params.source ?? 'shortcut',
    })
    .then(
      () => {},
      (err) => logger.error('[import-log] Failed to write log', { error: String(err) })
    );
}

/**
 * POST /api/spotify/send-to-strummy
 * One-tap: gets currently playing track from Spotify → creates draft song.
 * Logs every attempt (success and failure) to apple_shortcut_song_import_log.
 */
export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
    }

    const userId = auth.user.id;
    const supabase = createAdminClient();

    // Role check
    const { data: profileData } = await supabase
      .from('profiles')
      .select('is_admin, is_teacher')
      .eq('id', userId)
      .single();

    if (
      !profileData ||
      !validateMutationPermission({
        isAdmin: profileData.is_admin,
        isTeacher: profileData.is_teacher,
      })
    ) {
      logImport({
        userId,
        status: 'error',
        errorMessage: 'Forbidden: not teacher/admin',
        httpStatus: 403,
      });
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
      const status = message.includes('SPOTIFY_USER_REFRESH_TOKEN') ? 503 : 502;
      logImport({ userId, status: 'error', errorMessage: message, httpStatus: status });
      return NextResponse.json(
        {
          error:
            status === 503
              ? 'Spotify not connected. Visit /dashboard/admin/spotify-connect'
              : `Spotify error: ${message}`,
        },
        { status }
      );
    }

    if (!nowPlaying) {
      logImport({ userId, status: 'error', errorMessage: 'Nothing playing', httpStatus: 404 });
      return NextResponse.json(
        { error: 'Nothing is playing on Spotify right now' },
        { status: 404 }
      );
    }

    const spotifyUrl = nowPlaying.url;
    const trackId = nowPlaying.id;

    // Fetch full track data
    let track: SpotifyApiTrack;
    try {
      track = (await getTrack(trackId)) as SpotifyApiTrack;
    } catch (error) {
      logger.error('[send-to-strummy] Track fetch failed', { error: String(error) });
      logImport({
        userId,
        spotifyUrl,
        spotifyTrackId: trackId,
        songTitle: nowPlaying.title,
        songArtist: nowPlaying.artist,
        status: 'error',
        errorMessage: 'Failed to fetch track from Spotify',
        httpStatus: 502,
      });
      return NextResponse.json({ error: 'Failed to fetch track from Spotify' }, { status: 502 });
    }

    // Audio features (optional)
    let features: SpotifyAudioFeatures | null = null;
    try {
      features = (await getAudioFeatures(trackId)) as SpotifyAudioFeatures;
    } catch {
      // Non-critical
    }

    const draft = mapSpotifyToSongDraft(track, features);

    const validationResult = SongDraftSchema.safeParse(draft);
    if (!validationResult.success) {
      logImport({
        userId,
        spotifyUrl,
        spotifyTrackId: trackId,
        songTitle: nowPlaying.title,
        songArtist: nowPlaying.artist,
        status: 'error',
        errorMessage: 'Draft validation failed',
        httpStatus: 422,
      });
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
        logImport({
          userId,
          spotifyUrl,
          spotifyTrackId: trackId,
          songTitle: nowPlaying.title,
          songArtist: nowPlaying.artist,
          status: 'duplicate',
          errorMessage: 'Already exists',
          httpStatus: 409,
        });
        return NextResponse.json(
          {
            error: `${nowPlaying.title} by ${nowPlaying.artist} already exists in Strummy`,
            existing: true,
            track: { title: nowPlaying.title, artist: nowPlaying.artist },
          },
          { status: 409 }
        );
      }
      logImport({
        userId,
        spotifyUrl,
        spotifyTrackId: trackId,
        songTitle: nowPlaying.title,
        songArtist: nowPlaying.artist,
        status: 'error',
        errorMessage: dbError.message,
        httpStatus: 500,
      });
      logger.error('[send-to-strummy] DB error', { error: dbError.message });
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Success
    logImport({
      userId,
      spotifyUrl,
      spotifyTrackId: trackId,
      songTitle: nowPlaying.title,
      songArtist: nowPlaying.artist,
      songId: song.id,
      status: 'success',
      httpStatus: 201,
    });

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
