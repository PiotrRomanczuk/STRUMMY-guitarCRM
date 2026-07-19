import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTrack } from '@/lib/spotify';
import type { SpotifyApiTrack } from '@/types/spotify';
import { z } from 'zod';
import {
  TEST_ACCOUNT_MUTATION_ERROR,
  isDemoMutationBlocked,
} from '@/lib/auth/test-account-guard';
import { logger } from '@/lib/logger';

const ActionSchema = z.object({
  matchId: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  overrideSpotifyId: z.string().optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check permissions
  const { data: profile } = await supabase
    .from('user_overview')
    .select('is_admin, is_teacher')
    .eq('user_id', user.id)
    .single();

  if (!profile?.is_admin && !profile?.is_teacher) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Check if user is a test/development account
  const { data: devProfile } = await supabase
    .from('profiles')
    .select('is_development')
    .eq('id', user.id)
    .single();

  if (devProfile?.is_development) {
    return NextResponse.json({ error: TEST_ACCOUNT_MUTATION_ERROR }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = ActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { matchId, action, overrideSpotifyId } = parsed.data;

    // Get the match with song details
    const { data: match, error: fetchError } = await supabase
      .from('spotify_matches')
      .select(
        `
        *,
        songs!inner(id, title, author)
      `
      )
      .eq('id', matchId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !match) {
      return NextResponse.json({ error: 'Match not found or already processed' }, { status: 404 });
    }

    if (action === 'approve') {
      let spotifyData;

      // If an alternative Spotify track was selected, fetch its data
      if (overrideSpotifyId) {
        try {
          const trackData = await getTrack(overrideSpotifyId) as SpotifyApiTrack;

          spotifyData = {
            spotify_url: trackData.external_urls.spotify,
            duration_ms: trackData.duration_ms,
            release_year: trackData.album.release_date
              ? parseInt(trackData.album.release_date.split('-')[0])
              : null,
            cover_image_url: trackData.album.images[0]?.url,
          };
        } catch (error) {
          logger.error('Failed to fetch alternative Spotify track:', error);
          return NextResponse.json(
            { error: 'Failed to fetch alternative Spotify track data' },
            { status: 500 }
          );
        }
      } else {
        // Use the original matched Spotify data
        spotifyData = {
          spotify_url: match.spotify_url,
          duration_ms: match.spotify_duration_ms,
          release_year: match.spotify_release_date
            ? parseInt(match.spotify_release_date.split('-')[0])
            : null,
          cover_image_url: match.spotify_cover_image_url,
        };
      }

      // Update the song with Spotify data
      const updateData = {
        spotify_link_url: spotifyData.spotify_url,
        duration_ms: spotifyData.duration_ms,
        release_year: spotifyData.release_year,
        cover_image_url: spotifyData.cover_image_url,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('songs')
        .update(updateData)
        .eq('id', match.song_id)
        .select()
        .single();

      if (updateError) {
        logger.error('❌ Update error:', updateError);
        return NextResponse.json(
          { error: `Failed to update song: ${updateError.message}` },
          { status: 500 }
        );
      }

      // Mark match as approved
      // First, delete any existing approved/rejected matches for this song to avoid unique constraint violations
      const { error: deleteError } = await supabase
        .from('spotify_matches')
        .delete()
        .eq('song_id', match.song_id)
        .neq('id', matchId);

      if (deleteError) {
        logger.warn('Could not delete old matches', { error: deleteError.message });
        // Continue anyway - this is not critical
      }

      const { error: approveError } = await supabase
        .from('spotify_matches')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', matchId)
        .select()
        .single();

      if (approveError) {
        logger.error('❌ Approve error:', approveError);
        return NextResponse.json(
          { error: `Failed to mark as approved: ${approveError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        action: 'approved',
        message: `Successfully updated "${match.songs.title}" with Spotify data`,
      });
    } else if (action === 'reject') {
      // Mark match as rejected
      const { error: rejectError } = await supabase
        .from('spotify_matches')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', matchId)
        .select()
        .single();

      if (rejectError) {
        logger.error('❌ Reject error:', rejectError);
        return NextResponse.json(
          { error: `Failed to mark as rejected: ${rejectError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        action: 'rejected',
        message: `Rejected match for "${match.songs.title}"`,
      });
    }
  } catch (error) {
    logger.error('Error processing match action:', error);
    return NextResponse.json({ error: 'Failed to process match action' }, { status: 500 });
  }
}
