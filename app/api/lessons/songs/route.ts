import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { LessonSongSchema, type LessonSong } from '@/schemas';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  return withApiAuth(request, async () => {
    try {
      const supabase = await createClient();
      const { searchParams } = new URL(request.url);

      const lessonId = searchParams.get('lessonId');
      const songId = searchParams.get('songId');
      const studentId = searchParams.get('studentId');

      if (!lessonId) {
        return NextResponse.json({ error: 'Lesson ID is required' }, { status: 400 });
      }

      let query = supabase
        .from('lesson_songs')
        .select(
          `
        *,
        song:songs(title, author, level, key),
        lesson:lessons(title, scheduled_at, status)
      `
        )
        .eq('lesson_id', lessonId);

      if (songId) {
        query = query.eq('song_id', songId);
      }

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data: lessonSongs, error } = await query;

      if (error) {
        logger.error('Error fetching lesson songs:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ lessonSongs: lessonSongs || [] });
    } catch (error) {
      logger.error('Error in lesson songs API:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

export async function POST(request: NextRequest) {
  return withApiAuth(request, async ({ roles }) => {
    try {
      const supabase = await createClient();
      const body = await request.json();

      if (!roles.isAdmin && !roles.isTeacher) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Validate input data
      let validatedData: LessonSong;
      try {
        validatedData = LessonSongSchema.parse(body);
      } catch (validationError) {
        logger.error('Lesson song input validation error:', validationError);
        return NextResponse.json(
          { error: 'Invalid lesson song data', details: validationError },
          { status: 400 }
        );
      }

      // Check if the lesson exists
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select('id')
        .eq('id', validatedData.lesson_id)
        .single();

      if (lessonError || !lesson) {
        return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
      }

      // Check if the song exists
      const { data: song, error: songError } = await supabase
        .from('songs')
        .select('id')
        .eq('id', validatedData.song_id)
        .single();

      if (songError || !song) {
        return NextResponse.json({ error: 'Song not found' }, { status: 404 });
      }

      // Check if this song is already assigned to this lesson
      const { data: existingAssignment } = await supabase
        .from('lesson_songs')
        .select('id')
        .eq('lesson_id', validatedData.lesson_id)
        .eq('song_id', validatedData.song_id)
        .single();

      if (existingAssignment) {
        return NextResponse.json(
          { error: 'Song is already assigned to this lesson' },
          { status: 409 }
        );
      }

      const { data: lessonSong, error } = await supabase
        .from('lesson_songs')
        .insert({
          lesson_id: validatedData.lesson_id,
          song_id: validatedData.song_id,
          status: validatedData.song_status || 'started',
        })
        .select()
        .single();

      if (error) {
        logger.error('Error assigning song to lesson:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(lessonSong);
    } catch (error) {
      logger.error('Error in lesson song assignment API:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
