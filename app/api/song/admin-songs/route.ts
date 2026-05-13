import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  return withApiAuth(request, async ({ roles }) => {
    try {
      const { searchParams } = new URL(request.url);
      const level = searchParams.get('level');
      const supabase = await createClient();

      if (!roles.isAdmin && !roles.isTeacher) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }

      // Fetch all songs (teachers and admins can see all)
      let query = supabase
        .from('songs')
        .select(
          'id, title, author, level, key, chords, youtube_url, ultimate_guitar_link, gallery_images, created_at, updated_at'
        );

      if (level) {
        query = query.eq('level', level as 'beginner' | 'intermediate' | 'advanced');
      }

      const { data: songs, error: songsError } = await query;

      if (songsError) {
        return NextResponse.json({ error: 'Failed to fetch songs' }, { status: 500 });
      }

      return NextResponse.json(songs || []);
    } catch (error) {
      logger.error('Error in admin-songs route:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
