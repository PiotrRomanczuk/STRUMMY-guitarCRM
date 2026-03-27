import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTrack, getAudioFeatures } from '@/lib/spotify';
import type { SpotifyApiTrack } from '@/types/spotify';
import {
  extractTrackId,
  mapSpotifyKey,
  extractReleaseYear,
  mapSpotifyToSongDraft,
  type SpotifyAudioFeatures,
} from '../spotify-mapper';

interface PipelineStep {
  name: string;
  status: 'success' | 'error' | 'skipped';
  input?: unknown;
  output?: unknown;
  error?: string;
  durationMs: number;
}

/**
 * GET /api/song/from-spotify/debug?url=...
 * Read-only pipeline debug — shows each step of converting a Spotify URL to a song draft.
 * Requires admin or teacher role. Does NOT insert into DB.
 */
export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
  }

  // Role check
  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, is_teacher')
    .eq('id', auth.user.id)
    .single();

  if (!profile?.is_admin && !profile?.is_teacher) {
    return NextResponse.json({ error: 'Admin or teacher role required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'url query parameter is required' }, { status: 400 });
  }

  const steps: PipelineStep[] = [];

  // Step 1: URL Parsing
  const step1Start = Date.now();
  const trackId = extractTrackId(url);
  steps.push({
    name: 'URL Parsing',
    status: trackId ? 'success' : 'error',
    input: { rawUrl: url },
    output: trackId
      ? {
          trackId,
          strippedParams: url.includes('?') ? url.split('?')[1] : null,
        }
      : undefined,
    error: trackId ? undefined : 'Could not extract track ID from URL',
    durationMs: Date.now() - step1Start,
  });

  if (!trackId) {
    return NextResponse.json({ steps }, { status: 200 });
  }

  // Step 2: Spotify Track Fetch
  let track: SpotifyApiTrack | null = null;
  const step2Start = Date.now();
  try {
    track = (await getTrack(trackId)) as SpotifyApiTrack;
    steps.push({
      name: 'Spotify Track Fetch',
      status: 'success',
      input: { trackId },
      output: {
        title: track.name,
        artist: track.artists.map((a) => a.name).join(', '),
        album: track.album.name,
        coverUrl: track.album.images[0]?.url || null,
        releaseDate: track.album.release_date,
        durationMs: track.duration_ms,
        spotifyUrl: track.external_urls.spotify,
      },
      durationMs: Date.now() - step2Start,
    });
  } catch (err) {
    steps.push({
      name: 'Spotify Track Fetch',
      status: 'error',
      input: { trackId },
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - step2Start,
    });
    return NextResponse.json({ steps }, { status: 200 });
  }

  // Step 3: Audio Features Fetch
  let features: SpotifyAudioFeatures | null = null;
  const step3Start = Date.now();
  try {
    features = (await getAudioFeatures(trackId)) as SpotifyAudioFeatures;
    steps.push({
      name: 'Audio Features Fetch',
      status: 'success',
      input: { trackId },
      output: {
        pitchClass: features.key,
        mode: features.mode,
        tempo: features.tempo,
        timeSignature: features.time_signature,
        durationMs: features.duration_ms,
      },
      durationMs: Date.now() - step3Start,
    });
  } catch (err) {
    steps.push({
      name: 'Audio Features Fetch',
      status: 'skipped',
      input: { trackId },
      error: `Audio features unavailable: ${err instanceof Error ? err.message : String(err)}`,
      durationMs: Date.now() - step3Start,
    });
  }

  // Step 4: Key Mapping
  const step4Start = Date.now();
  if (features) {
    const mappedKey = mapSpotifyKey(features.key, features.mode);
    steps.push({
      name: 'Key Mapping',
      status: mappedKey ? 'success' : 'skipped',
      input: {
        pitchClass: features.key,
        mode: features.mode,
        modeLabel: features.mode === 1 ? 'major' : 'minor',
      },
      output: mappedKey ? { key: mappedKey } : undefined,
      error: mappedKey ? undefined : `Unknown pitch class ${features.key}`,
      durationMs: Date.now() - step4Start,
    });
  } else {
    steps.push({
      name: 'Key Mapping',
      status: 'skipped',
      error: 'No audio features available',
      durationMs: 0,
    });
  }

  // Step 5: Draft Mapping
  const step5Start = Date.now();
  const draft = mapSpotifyToSongDraft(track, features);
  const releaseYear = extractReleaseYear(track.album.release_date);
  steps.push({
    name: 'Draft Mapping',
    status: 'success',
    input: { trackFields: Object.keys(draft).length },
    output: {
      ...draft,
      _releaseYearParsed: releaseYear,
    },
    durationMs: Date.now() - step5Start,
  });

  // Step 6: Would-be DB Insert (dry run — check for duplicates only)
  const step6Start = Date.now();
  const { data: existing } = await supabase
    .from('songs')
    .select('id, title, author')
    .eq('title', draft.title as string)
    .eq('author', draft.author as string)
    .is('deleted_at', null)
    .maybeSingle();

  steps.push({
    name: 'Database Check (dry run)',
    status: existing ? 'error' : 'success',
    input: { title: draft.title, author: draft.author },
    output: existing
      ? {
          wouldReturn: 409,
          existingSongId: existing.id,
          message: 'A song with this title and author already exists',
        }
      : { wouldReturn: 201, message: 'Song would be created successfully' },
    durationMs: Date.now() - step6Start,
  });

  return NextResponse.json({ steps }, { status: 200 });
}
