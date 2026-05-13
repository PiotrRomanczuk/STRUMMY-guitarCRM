import { authenticateRequest } from '@/lib/auth/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { LessonInputSchema, LessonSchema, type LessonInput } from '@/schemas';
import { TEST_ACCOUNT_MUTATION_ERROR } from '@/lib/auth/test-account-guard';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
    }
    const supabase = createAdminClient();
    const body = await request.json();

    // Check if user is a test/development account
    const { data: devProfile } = await supabase
      .from('profiles')
      .select('is_development')
      .eq('id', auth.user.id)
      .single();

    if (devProfile?.is_development) {
      return NextResponse.json({ error: TEST_ACCOUNT_MUTATION_ERROR }, { status: 403 });
    }

    // Check if user has permission to create lessons via profiles boolean flags
    // NOTE: original code queried user_roles table (deprecated); now using profiles.is_admin/is_teacher
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, is_teacher')
      .eq('id', auth.user.id)
      .single();

    if (!profile || (!profile.is_admin && !profile.is_teacher)) {
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
}
