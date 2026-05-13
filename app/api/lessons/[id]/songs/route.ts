import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { logger } from '@/lib/logger';

/**
 * GET /api/lessons/[id]/songs
 * Get all songs for a specific lesson
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiAuth(request, async () => {
    try {
      const { id: lessonId } = await params;
      const supabase = await createClient();

      // Fetch lesson songs with song details
      const { data: lessonSongs, error } = await supabase
        .from('lesson_songs')
        .select(
          `
        id,
        song_id,
        status,
        notes,
        songs (
          id,
          title,
          author,
          level
        )
      `
        )
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('Error fetching lesson songs:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Transform the data to match the expected format
      const transformedSongs =
        lessonSongs?.map((ls) => ({
          id: ls.id,
          song_id: ls.song_id,
          status: ls.status,
          notes: ls.notes,
          song: Array.isArray(ls.songs) ? ls.songs[0] : ls.songs,
        })) || [];

      return NextResponse.json({ songs: transformedSongs });
    } catch (error) {
      logger.error('Error in lesson songs API:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
