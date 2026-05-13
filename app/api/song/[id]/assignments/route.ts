import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { createLogger } from '@/lib/logger';

const log = createLogger('SongAssignmentsAPI');

/**
 * GET /api/song/[id]/assignments
 * Get all assignments linked to lessons that contain this song
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiAuth(request, async () => {
    const { id } = await params;
    const supabase = await createClient();

    try {
      // We want assignments that are linked to lessons that contain this song.
      // We use !inner joins to filter by the song_id in the nested lesson_songs table.
      const { data: assignments, error } = await supabase
        .from('assignments')
        .select(
          `
        id,
        title,
        status,
        due_date,
        student_id,
        lesson_id,
        student:profiles!student_id(id, full_name, email),
        lesson:lessons!inner(
          id,
          lesson_teacher_number,
          lesson_songs!inner(
            song_id
          )
        )
      `
        )
        .eq('lesson.lesson_songs.song_id', id)
        .order('due_date', { ascending: false });

      if (error) {
        log.error('Error fetching song assignments', { error });
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ assignments });
    } catch (error) {
      log.error('Unexpected error in song assignments API', { error });
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  });
}
