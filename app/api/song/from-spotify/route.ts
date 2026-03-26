import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { getTrack, getAudioFeatures } from '@/lib/spotify';
import { createAdminClient } from '@/lib/supabase/admin';
import { SongDraftSchema } from '@/schemas/SongSchema';
import { validateMutationPermission } from '@/lib/auth/permissions';
import { logger } from '@/lib/logger';
import type { SpotifyApiTrack } from '@/types/spotify';
import { extractTrackId, mapSpotifyToSongDraft, type SpotifyAudioFeatures } from './spotify-mapper';

const RequestSchema = z.object({
  spotify_url: z.string().min(1, 'spotify_url is required'),
});

/**
 * POST /api/song/from-spotify
 * Create a draft song from a Spotify URL.
 * Supports both cookie session and API key authentication.
 * Requires teacher or admin role.
 */
export async function POST(request: Request) {
  try {
    // Authenticate (API key or cookie session)
    const auth = await authenticateRequest(request);
    if (!auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
    }

    // Check role (teacher or admin)
    const supabase = createAdminClient();
    const { data: profileData } = await supabase
      .from('profiles')
      .select('is_admin, is_teacher, is_development')
      .eq('id', auth.user.id)
      .single();

    if (!profileData) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    if (
      !validateMutationPermission({
        isAdmin: profileData.is_admin,
        isTeacher: profileData.is_teacher,
      })
    ) {
      return NextResponse.json(
        { error: 'Forbidden: Only teachers and admins can create songs' },
        { status: 403 }
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const trackId = extractTrackId(parsed.data.spotify_url);
    if (!trackId) {
      return NextResponse.json({ error: 'Invalid Spotify URL or track ID' }, { status: 400 });
    }

    // Fetch track metadata
    let track: SpotifyApiTrack;
    try {
      track = (await getTrack(trackId)) as SpotifyApiTrack;
    } catch (error) {
      logger.error('[from-spotify] Failed to fetch track:', error);
      return NextResponse.json({ error: 'Failed to fetch track from Spotify' }, { status: 502 });
    }

    // Fetch audio features (non-critical — continue without them)
    let features: SpotifyAudioFeatures | null = null;
    try {
      features = (await getAudioFeatures(trackId)) as SpotifyAudioFeatures;
    } catch (error) {
      logger.warn('[from-spotify] Audio features unavailable', { error: String(error) });
    }

    const draft = mapSpotifyToSongDraft(track, features);

    // Validate against draft schema
    const validationResult = SongDraftSchema.safeParse(draft);
    if (!validationResult.success) {
      logger.error('[from-spotify] Draft validation failed:', validationResult.error);
      return NextResponse.json(
        {
          error: 'Mapped song data failed validation',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    // Insert into DB
    const { data: song, error: dbError } = await supabase
      .from('songs')
      .insert(validationResult.data)
      .select()
      .single();

    if (dbError) {
      if (dbError.code === '23505') {
        return NextResponse.json(
          { error: 'A song with this title and author already exists' },
          { status: 409 }
        );
      }
      logger.error('[from-spotify] DB insert error:', dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ song, source: 'spotify', track_id: trackId }, { status: 201 });
  } catch (error) {
    logger.error('[from-spotify] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
