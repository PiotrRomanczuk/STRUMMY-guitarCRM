import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UpdateSongVideoInputSchema } from '@/schemas/SongVideoSchema';
import { deleteVideoFromDrive } from '@/lib/services/google-drive';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { createLogger } from '@/lib/logger';

const log = createLogger('SongVideoAPI');

type RouteParams = { params: Promise<{ id: string; videoId: string }> };

/**
 * PATCH /api/song/[id]/videos/[videoId]
 * Update video title, order, etc.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withApiAuth(request, async ({ roles }) => {
    try {
      const { id: songId, videoId } = await params;
      const supabase = await createClient();

      if (!roles.isAdmin && !roles.isTeacher) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const body = await request.json();
      const updates = UpdateSongVideoInputSchema.parse(body);

      const { data: video, error } = await supabase
        .from('song_videos')
        .update(updates)
        .eq('id', videoId)
        .eq('song_id', songId)
        .select()
        .single();

      if (error) {
        log.error('Error updating video', { error, videoId });
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!video) {
        return NextResponse.json({ error: 'Video not found' }, { status: 404 });
      }

      return NextResponse.json({ video });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Invalid request data', details: (error as Error).message },
          { status: 400 }
        );
      }
      log.error('Unexpected error updating video', { error });
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

/**
 * DELETE /api/song/[id]/videos/[videoId]
 * Delete video from DB and Google Drive
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  return withApiAuth(_request, async ({ user, roles }) => {
    try {
      const { id: songId, videoId } = await params;
      const supabase = await createClient();

      if (!roles.isAdmin && !roles.isTeacher) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Fetch video to get Drive file ID
      const { data: video } = await supabase
        .from('song_videos')
        .select('google_drive_file_id')
        .eq('id', videoId)
        .eq('song_id', songId)
        .single();

      if (!video) {
        return NextResponse.json({ error: 'Video not found' }, { status: 404 });
      }

      // Delete from Google Drive (best-effort)
      try {
        await deleteVideoFromDrive(user.id, video.google_drive_file_id);
      } catch (err) {
        log.warn('Failed to delete from Drive, continuing DB delete', { err, videoId });
      }

      // Delete from database
      const { error } = await supabase
        .from('song_videos')
        .delete()
        .eq('id', videoId)
        .eq('song_id', songId);

      if (error) {
        log.error('Error deleting video from DB', { error, videoId });
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      log.error('Unexpected error deleting video', { error });
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
