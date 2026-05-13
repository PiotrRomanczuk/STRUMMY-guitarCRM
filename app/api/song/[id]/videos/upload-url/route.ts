import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createResumableUploadUrl } from '@/lib/services/google-drive';
import { UploadUrlRequestSchema } from '@/schemas/SongVideoSchema';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { createLogger } from '@/lib/logger';

const log = createLogger('SongVideoUploadURL');

/**
 * POST /api/song/[id]/videos/upload-url
 * Generate a resumable upload URL for Google Drive
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiAuth(request, async ({ user, roles }) => {
    try {
      const { id: songId } = await params;
      const supabase = await createClient();

      if (!roles.isAdmin && !roles.isTeacher) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Verify song exists
      const { data: song } = await supabase.from('songs').select('id').eq('id', songId).single();

      if (!song) {
        return NextResponse.json({ error: 'Song not found' }, { status: 404 });
      }

      const body = await request.json();
      const input = UploadUrlRequestSchema.parse(body);

      const { uploadUrl, folderId } = await createResumableUploadUrl(
        user.id,
        input.filename,
        input.mime_type,
        input.file_size_bytes
      );

      return NextResponse.json({ uploadUrl, folderId });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Invalid request', details: (error as Error).message },
          { status: 400 }
        );
      }
      log.error('Error generating upload URL', { error });
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
