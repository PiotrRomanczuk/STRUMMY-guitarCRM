import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreateSongVideoInputSchema } from '@/schemas/SongVideoSchema';
import { setFilePublicReadable, getVideoMetadata } from '@/lib/services/google-drive';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { createLogger } from '@/lib/logger';

const log = createLogger('SongVideosAPI');

/**
 * GET /api/song/[id]/videos
 * List all videos for a song
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiAuth(_request, async () => {
    try {
      const { id: songId } = await params;
      const supabase = await createClient();

      const { data: videos, error } = await supabase
        .from('song_videos')
        .select('*')
        .eq('song_id', songId)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        log.error('Error fetching videos', { error, songId });
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ videos });
    } catch (error) {
      log.error('Unexpected error listing videos', { error });
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

/**
 * POST /api/song/[id]/videos
 * Register an uploaded video (after client-side Drive upload)
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiAuth(request, async ({ user, roles }) => {
    try {
      const { id: songId } = await params;
      const supabase = await createClient();

      if (!roles.isAdmin && !roles.isTeacher) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const body = await request.json();
      const input = CreateSongVideoInputSchema.parse(body);

      // Make the video publicly readable for streaming
      try {
        await setFilePublicReadable(user.id, input.google_drive_file_id);
      } catch (err) {
        log.warn('Could not set file public readable', { err });
      }

      // Fetch metadata from Drive to fill in any gaps
      let thumbnailUrl = input.thumbnail_url;
      let fileSizeBytes = input.file_size_bytes;
      try {
        const meta = await getVideoMetadata(user.id, input.google_drive_file_id);
        thumbnailUrl = thumbnailUrl ?? meta.thumbnailLink ?? undefined;
        fileSizeBytes = fileSizeBytes ?? meta.size;
      } catch (err) {
        log.warn('Could not fetch Drive metadata', { err });
      }

      // Get the next display order
      const { data: lastVideo } = await supabase
        .from('song_videos')
        .select('display_order')
        .eq('song_id', songId)
        .order('display_order', { ascending: false })
        .limit(1)
        .single();

      const displayOrder = input.display_order ?? (lastVideo ? lastVideo.display_order + 1 : 0);

      const { data: video, error } = await supabase
        .from('song_videos')
        .insert({
          song_id: songId,
          uploaded_by: user.id,
          google_drive_file_id: input.google_drive_file_id,
          google_drive_folder_id: process.env.GOOGLE_DRIVE_FOLDER_ID || null,
          title: input.title || input.filename,
          filename: input.filename,
          mime_type: input.mime_type,
          file_size_bytes: fileSizeBytes || null,
          duration_seconds: input.duration_seconds || null,
          thumbnail_url: thumbnailUrl || null,
          display_order: displayOrder,
          video_type: input.video_type,
        })
        .select()
        .single();

      if (error) {
        log.error('Error saving video metadata', { error, songId });
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ video }, { status: 201 });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Invalid request data', details: (error as Error).message },
          { status: 400 }
        );
      }
      log.error('Unexpected error registering video', { error });
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
