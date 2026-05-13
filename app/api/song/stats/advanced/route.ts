import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import type { SongStatsAdvanced } from '@/types/SongStatsAdvanced';
import {
  computeOverview,
  computeTempoStats,
  computeKeyDistribution,
  computeLevelDistribution,
  computeCategoryDistribution,
  computeLibraryGrowth,
  computeSunburst,
  computeReleaseYearStats,
} from './helpers';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  return withApiAuth(request, async ({ roles }) => {
    try {
      if (!roles.isAdmin && !roles.isTeacher) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const adminClient = createAdminClient();

      const { data: songs, error } = await adminClient
        .from('songs')
        .select(
          'title, author, level, key, tempo, category, release_year, chords, strumming_pattern, audio_files, youtube_url, spotify_link_url, created_at'
        )
        .is('deleted_at', null);

      if (error) {
        logger.error('[SongStatsAdvanced] Query error:', error);
        return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
      }

      const rows = songs ?? [];

      const result: SongStatsAdvanced = {
        overview: computeOverview(rows),
        tempo: computeTempoStats(rows),
        keyDistribution: computeKeyDistribution(rows),
        levelDistribution: computeLevelDistribution(rows),
        categoryDistribution: computeCategoryDistribution(rows),
        libraryGrowth: computeLibraryGrowth(rows),
        sunburst: computeSunburst(rows),
        releaseYear: computeReleaseYearStats(rows),
      };

      return NextResponse.json(result);
    } catch (error) {
      logger.error('[SongStatsAdvanced] Error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
