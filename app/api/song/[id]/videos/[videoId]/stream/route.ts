import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getVideoStreamUrl } from '@/lib/services/google-drive';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { createLogger } from '@/lib/logger';

const log = createLogger('SongVideoStream');

/**
 * GET /api/song/[id]/videos/[videoId]/stream
 * Get a streaming/download URL for the video
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  return withApiAuth(_request, async ({ user }) => {
    try {
      const { id: songId, videoId } = await params;
      const supabase = await createClient();

      const { data: video } = await supabase
        .from('song_videos')
        .select('google_drive_file_id')
        .eq('id', videoId)
        .eq('song_id', songId)
        .single();

      if (!video) {
        return NextResponse.json({ error: 'Video not found' }, { status: 404 });
      }

      const streamUrl = await getVideoStreamUrl(user.id, video.google_drive_file_id);

      return NextResponse.json({ url: streamUrl });
    } catch (error) {
      log.error('Error getting stream URL', { error });
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
