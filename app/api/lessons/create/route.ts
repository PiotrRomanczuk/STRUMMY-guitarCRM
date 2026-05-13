import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { LessonInputSchema, LessonSchema, type LessonInput } from '@/schemas';
import { TEST_ACCOUNT_MUTATION_ERROR } from '@/lib/auth/test-account-guard';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  return withApiAuth(request, async ({ user, roles, flags }) => {
    try {
      const supabase = await createClient();
      const body = await request.json();

      if (flags.isDevelopment) {
        return NextResponse.json({ error: TEST_ACCOUNT_MUTATION_ERROR }, { status: 403 });
      }

      if (!roles.isAdmin && !roles.isTeacher) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Validate input data using the schema
      let validatedData: LessonInput;
      try {
        validatedData = LessonInputSchema.parse(body);
      } catch (validationError) {
        logger.error('Lesson input validation error:', validationError);
        return NextResponse.json(
          { error: 'Invalid lesson data', details: validationError },
          { status: 400 }
        );
      }

      // Calculate the next lesson_teacher_number for this teacher-student pair
      const { data: existingLessons } = await supabase
        .from('lessons')
        .select('lesson_teacher_number')
        .eq('teacher_id', validatedData.teacher_id)
        .eq('student_id', validatedData.student_id)
        .order('lesson_teacher_number', { ascending: false })
        .limit(1);

      const nextLessonNumber =
        (existingLessons && existingLessons.length > 0
          ? existingLessons[0].lesson_teacher_number
          : 0) + 1;

      const { data: lesson, error } = await supabase
        .from('lessons')
        .insert({
          teacher_id: validatedData.teacher_id,
          student_id: validatedData.student_id,
          lesson_teacher_number: nextLessonNumber,
          scheduled_at: validatedData.scheduled_at,
          notes: validatedData.notes || null,
          status: validatedData.status || 'SCHEDULED',
          creator_user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating lesson:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Validate the created lesson
      try {
        const validatedLesson = LessonSchema.parse(lesson);
        return NextResponse.json(validatedLesson);
      } catch (validationError) {
        logger.error('Created lesson validation error:', validationError);
        return NextResponse.json({ error: 'Invalid lesson data' }, { status: 500 });
      }
    } catch (error) {
      logger.error('Error in lesson creation API:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
