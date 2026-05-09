import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { updateLessonHandler, deleteLessonHandler } from '../handlers';
import { TEST_ACCOUNT_MUTATION_ERROR } from '@/lib/auth/test-account-guard';
import { logger } from '@/lib/logger';

/**
 * GET /api/lessons/[id]
 * Get a single lesson.
 *
 * Visibility (admin / teacher of this lesson / student in this lesson) is
 * enforced by RLS — see ADR-0001. If RLS hides the row, `maybeSingle()`
 * returns null and we respond 404, indistinguishable from a real not-found.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiAuth(request, async () => {
    try {
      const { id } = await params;
      const supabase = await createClient();

      const { data: lesson, error } = await supabase
        .from('lessons')
        .select(
          'id, teacher_id, student_id, status, date, time, lesson_teacher_number, scheduled_at, notes, created_at, updated_at'
        )
        .eq('id', id)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching lesson:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!lesson) {
        return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
      }

      return NextResponse.json(lesson);
    } catch (error) {
      logger.error('Error in lesson API:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

/**
 * PUT /api/lessons/[id]
 * Update a lesson (admin/teacher only)
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiAuth(request, async ({ user, roles, flags }) => {
    try {
      if (flags.isDevelopment) {
        return NextResponse.json({ error: TEST_ACCOUNT_MUTATION_ERROR }, { status: 403 });
      }

      const { id } = await params;
      const supabase = await createClient();
      const body = await request.json();
      const result = await updateLessonHandler(supabase, user, roles, id, body);

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }

      return NextResponse.json(result.lesson, { status: result.status });
    } catch (error) {
      logger.error('Error in lesson update API:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

/**
 * DELETE /api/lessons/[id]
 * Delete a lesson (admin/teacher only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiAuth(request, async ({ user, roles, flags }) => {
    try {
      if (flags.isDevelopment) {
        return NextResponse.json({ error: TEST_ACCOUNT_MUTATION_ERROR }, { status: 403 });
      }

      const { id } = await params;
      const supabase = await createClient();
      const result = await deleteLessonHandler(supabase, user, roles, id);

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }

      return NextResponse.json({ success: true }, { status: result.status });
    } catch (error) {
      logger.error('Error in lesson delete API:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
