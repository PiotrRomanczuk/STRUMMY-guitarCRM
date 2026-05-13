import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { SongStatusEnum } from '@/schemas';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiAuth(request, async () => {
    try {
      const { id } = await params;
      const supabase = await createClient();

      const { data: lessonSong, error } = await supabase
        .from('lesson_songs')
        .select(
          `
        *,
        song:songs(title, author, level, key, ultimate_guitar_link),
        lesson:lessons(title, scheduled_at, status)
      `
        )
        .eq('id', id)
        .single();

      if (error) {
        logger.error('Error fetching lesson song:', error);
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: 'Lesson song assignment not found' }, { status: 404 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!lessonSong) {
        return NextResponse.json({ error: 'Lesson song assignment not found' }, { status: 404 });
      }

      return NextResponse.json(lessonSong);
    } catch (error) {
      logger.error('Error in lesson song API:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiAuth(request, async ({ roles }) => {
    try {
      const { id } = await params;
      const supabase = await createClient();
      const body = await request.json();

      if (!roles.isAdmin && !roles.isTeacher) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Validate the update data
      const { song_status, status } = body;
      const newStatus = status || song_status;

      if (newStatus) {
        try {
          SongStatusEnum.parse(newStatus);
        } catch (validationError) {
          return NextResponse.json(
            { error: 'Invalid song status', details: validationError },
            { status: 400 }
          );
        }
      }

      const { data: lessonSong, error } = await supabase
        .from('lesson_songs')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(
          `
        *,
        song:songs(title, author, level, key),
        lesson:lessons(title, scheduled_at, status)
      `
        )
        .single();

      if (error) {
        logger.error('Error updating lesson song:', error);
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: 'Lesson song assignment not found' }, { status: 404 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(lessonSong);
    } catch (error) {
      logger.error('Error in lesson song update API:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiAuth(request, async ({ roles }) => {
    try {
      const { id } = await params;
      const supabase = await createClient();

      if (!roles.isAdmin && !roles.isTeacher) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { error } = await supabase.from('lesson_songs').delete().eq('id', id);

      if (error) {
        logger.error('Error deleting lesson song:', error);
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: 'Lesson song assignment not found' }, { status: 404 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      logger.error('Error in lesson song delete API:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
