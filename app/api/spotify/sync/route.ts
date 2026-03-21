import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchSongsWithAI } from '@/lib/services/enhanced-spotify-search';
import type { Database } from '@/database.types';
import { logger } from '@/lib/logger';

type DatabaseSong = Database['public']['Tables']['songs']['Row'];

export async function POST(request: Request) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check permissions (optional, but good practice)
  const { data: profile } = await supabase
    .from('user_overview')
    .select('is_admin, is_teacher')
    .eq('user_id', user.id)
    .single();

  if (!profile?.is_admin && !profile?.is_teacher) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Parse query parameters
  const url = new URL(request.url);
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam) : 1000; // Default to 1000 (process all)
  const force = url.searchParams.get('force') === 'true';
  const enableAI = url.searchParams.get('ai') !== 'false'; // AI enabled by default
  const minConfidence = parseInt(url.searchParams.get('minConfidence') || '20');
  const generateReport = url.searchParams.get('report') === 'true';

  // 1. Fetch songs
  let queryBuilder = supabase.from('songs').select('id, title, author, level, key, chords, audio_files, gallery_images, cover_image_url, youtube_url, ultimate_guitar_link, spotify_link_url, tiktok_short_url, lyrics_with_chords, short_title, notes, category, capo_fret, strumming_pattern, tempo, time_signature, duration_ms, release_year, search_vector, deleted_at, created_at, updated_at').is('deleted_at', null); // Only active songs

  if (!force) {
    // Prioritize songs missing Spotify data
    queryBuilder = queryBuilder.is('spotify_link_url', null);
  }

  const { data: songs, error } = await queryBuilder.limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!songs || songs.length === 0) {
    return NextResponse.json({
      total: 0,
      updated: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      message: 'No songs found to process',
    });
  }

  const results = {
    total: songs.length,
    updated: 0,
    failed: 0,
    skipped: 0,
    pending: 0,
    errors: [] as string[],
    aiMatches: 0,
    totalQueries: 0,
    averageConfidence: 0,
    processingTimeMs: 0,
  };

  const startTime = Date.now();

  try {
    // 2. Use AI-enhanced search
    const searchResults = await searchSongsWithAI(
      songs as DatabaseSong[],
      {
        maxQueries: 8,
        minConfidenceScore: minConfidence,
        includePartialMatches: true,
        enableAIAnalysis: enableAI,
      },
      // Progress callback
      () => {
        // Progress tracking (no-op in production)
      }
    );

    // 3. Process results and update database
    for (const searchResult of searchResults) {
      const { song, match } = searchResult;
      results.totalQueries += searchResult.queriesUsed;

      try {
        const track = match.track || match.spotifyTrack; // Support both property names

        if (match.confidence >= 85 && track) {
          // High confidence match (85%+) - update the song directly

          const updateData: {
            spotify_link_url: string;
            duration_ms: number;
            release_year: number | null;
            author?: string;
            cover_image_url?: string;
            updated_at: string;
          } = {
            spotify_link_url: track.external_urls.spotify,
            duration_ms: track.duration_ms,
            release_year: track.album.release_date
              ? parseInt(track.album.release_date.split('-')[0])
              : null,
            updated_at: new Date().toISOString(),
          };

          // Set author from Spotify artist
          const artistName = track.artists?.[0]?.name;
          if (artistName) {
            updateData.author = artistName;
          }

          // Set cover image
          const imageUrl = track.album.images[0]?.url;
          if (imageUrl) {
            updateData.cover_image_url = imageUrl;
          }

          const { error: updateError } = await supabase
            .from('songs')
            .update(updateData)
            .eq('id', song.id);

          if (updateError) {
            results.failed++;
            results.errors.push(`Failed to update ${song.title}: ${updateError.message}`);
          } else {
            results.updated++;
            results.aiMatches++;
          }
        } else if (match.confidence >= 20 && track) {
          // Any reasonable match (20%+) - store for manual review

          // First, check if we already have a pending match for this song
          const { data: existingMatch } = await supabase
            .from('spotify_matches')
            .select('id')
            .eq('song_id', song.id)
            .eq('status', 'pending')
            .single();

          if (!existingMatch) {
            // Store the match for manual review
            const { error: insertError } = await supabase.from('spotify_matches').insert({
              song_id: song.id,
              spotify_track_id: track.id,
              spotify_track_name: track.name,
              spotify_artist_name: track.artists[0]?.name || 'Unknown',
              spotify_album_name: track.album.name,
              spotify_url: track.external_urls.spotify,
              spotify_preview_url: track.preview_url || null,
              spotify_cover_image_url: track.album.images?.[0]?.url || null,
              spotify_duration_ms: track.duration_ms,
              spotify_release_date: track.album.release_date,
              spotify_popularity: track.popularity,
              confidence_score: match.confidence,
              search_query: match.searchQuery || `${song.title} ${song.author}`,
              match_reason: match.reason || 'AI-powered fuzzy match',
              status: 'pending',
            });

            if (insertError) {
              results.failed++;
              results.errors.push(
                `Failed to store pending match for ${song.title}: ${insertError.message}`
              );
            } else {
              results.pending++;
            }
          } else {
            results.pending++;
          }
        } else {
          // Very low confidence or no match
          results.skipped++;

          if (match.confidence > 0) {
            results.errors.push(`Very low confidence match for "${song.title}": ${match.reason}`);
          }
        }
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        results.failed++;
        results.errors.push(`Error updating ${song.title}: ${errorMessage}`);
      }
    }

    // 4. Calculate final statistics
    results.processingTimeMs = Date.now() - startTime;
    const confidenceScores = searchResults.map((r) => r.match.confidence).filter((c) => c > 0);

    results.averageConfidence =
      confidenceScores.length > 0
        ? Math.round(confidenceScores.reduce((sum, c) => sum + c, 0) / confidenceScores.length)
        : 0;

    // 5. Generate detailed report if requested
    if (generateReport) {
      const { generateMatchReport } = await import('@/lib/services/enhanced-spotify-search');
      const report = generateMatchReport(searchResults);

      // For now, just include summary in response
      (results as Record<string, unknown>).report = report.split('\n').slice(0, 20).join('\n') + '\n... (truncated)';
    }

    return NextResponse.json(results);
  } catch (error) {
    logger.error('❌ AI-enhanced sync failed:', error);

    return NextResponse.json(
      {
        error: 'AI-enhanced sync failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        results: {
          ...results,
          processingTimeMs: Date.now() - startTime,
        },
      },
      { status: 500 }
    );
  }
}
