import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { createLogger } from '@/lib/logger';

const log = createLogger('SongLessonsAPI');

/**
 * GET /api/song/[id]/lessons
 * Get all lessons that use this song
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiAuth(request, async () => {
    try {
      const { id: songId } = await params;
      const supabase = await createClient();

      // Fetch lesson_songs with lesson and profile details
      const { data: lessonSongs, error } = await supabase
        .from('lesson_songs')
        .select(
          `
        id,
        status,
        lessons (
          id,
          lesson_teacher_number,
          scheduled_at,
          status,
          student_id,
          teacher_id,
          student:profiles!lessons_student_id_fkey(id, full_name, email),
          teacher:profiles!lessons_teacher_id_fkey(id, full_name, email)
        )
      `
        )
        .eq('song_id', songId)
        .order('created_at', { ascending: false });

      if (error) {
        log.error('Error fetching song lessons', { error });
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Transform the data to match the expected format
      const transformedLessons =
        lessonSongs
          ?.map((ls) => {
            const lesson = Array.isArray(ls.lessons) ? ls.lessons[0] : ls.lessons;
            if (!lesson) return null;

            return {
              id: lesson.id,
              lesson_teacher_number: lesson.lesson_teacher_number,
              scheduled_at: lesson.scheduled_at,
              lesson_status: lesson.status,
              song_status: ls.status,
              student_id: lesson.student_id,
              teacher_id: lesson.teacher_id,
              student: lesson.student,
              teacher: lesson.teacher,
            };
          })
          .filter((item) => item !== null) || [];

      return NextResponse.json({ lessons: transformedLessons });
    } catch (error) {
      log.error('Error in song lessons API', { error });
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
