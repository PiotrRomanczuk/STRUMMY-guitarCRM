import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { logger } from '@/lib/logger';
import type { Song } from '@/components/songs/types';

export async function GET(request: Request) {
  return withApiAuth(request, async ({ user, roles }) => {
    if (!roles.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_favorites')
      .select('song:song_id(*)')
      .eq('user_id', user.id);

    if (error) {
      if (error.message?.includes('user_favorites') || error.message?.includes('schema cache')) {
        return NextResponse.json([]);
      }
      logger.error('Error fetching admin favorites:', error);
      return NextResponse.json({ error: 'Failed to fetch favorite songs' }, { status: 500 });
    }

    const songs = data?.map((fav: unknown) => (fav as { song: Song }).song) || [];
    return NextResponse.json(songs);
  });
}
