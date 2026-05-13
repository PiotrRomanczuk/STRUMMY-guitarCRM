import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  return withApiAuth(request, async ({ roles }) => {
    try {
      if (!roles.isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const adminClient = createAdminClient();

      // Get total songs count
      const { count: totalSongs, error: countError } = await adminClient
        .from('songs')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        logger.error('[SongStats] Error counting songs:', countError);
      }

      // Get songs by level
      const { data: songsByLevel } = await adminClient
        .from('songs')
        .select('level')
        .not('level', 'is', null);

      const levelStats =
        songsByLevel?.reduce(
          (acc: Record<string, number>, song: { level: string | null }) => {
            if (song.level) {
              acc[song.level] = (acc[song.level] || 0) + 1;
            }
            return acc;
          },
          {} as Record<string, number>
        ) || {};

      // Get songs by key
      const { data: songsByKey } = await adminClient
        .from('songs')
        .select('key')
        .not('key', 'is', null);

      const keyStats =
        songsByKey?.reduce(
          (acc: Record<string, number>, song: { key: string | null }) => {
            if (song.key) {
              acc[song.key] = (acc[song.key] || 0) + 1;
            }
            return acc;
          },
          {} as Record<string, number>
        ) || {};

      // Get songs with audio files
      const { count: songsWithAudio } = await adminClient
        .from('songs')
        .select('*', { count: 'exact', head: true })
        .not('audio_files', 'is', null);

      // Get songs with chords
      const { count: songsWithChords } = await adminClient
        .from('songs')
        .select('*', { count: 'exact', head: true })
        .not('chords', 'is', null);

      // Get top authors
      const { data: topAuthors } = await adminClient
        .from('songs')
        .select('author')
        .not('author', 'is', null);

      const authorStats =
        topAuthors?.reduce(
          (acc: Record<string, number>, song: { author: string | null }) => {
            if (song.author) {
              acc[song.author] = (acc[song.author] || 0) + 1;
            }
            return acc;
          },
          {} as Record<string, number>
        ) || {};

      const topAuthorsList = Object.entries(authorStats)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([author, count]) => ({ author, count }));

      // Calculate average songs per author
      const uniqueAuthors = Object.keys(authorStats).length;
      const averageSongsPerAuthor = uniqueAuthors > 0 ? (totalSongs || 0) / uniqueAuthors : 0;

      // Get recent songs (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: recentSongs } = await adminClient
        .from('songs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      return NextResponse.json({
        totalSongs: totalSongs || 0,
        levelStats,
        keyStats,
        songsWithAudio: songsWithAudio || 0,
        songsWithChords: songsWithChords || 0,
        topAuthorsList,
        averageSongsPerAuthor: Math.round(averageSongsPerAuthor * 100) / 100,
        recentSongs: recentSongs || 0,
        songsWithoutAudio: (totalSongs || 0) - (songsWithAudio || 0),
        songsWithoutChords: (totalSongs || 0) - (songsWithChords || 0),
      });
    } catch (error) {
      logger.error('Error in song stats API:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
