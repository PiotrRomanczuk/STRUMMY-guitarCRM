import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { getLessonsHandler, createLessonHandler } from '../../lessons/handlers';
import { logger } from '@/lib/logger';

/**
 * Extract query parameters from request
 */
function extractQueryParams(searchParams: URLSearchParams) {
  return {
    userId: searchParams.get('userId') || undefined,
    studentId: searchParams.get('studentId') || undefined,
    filter: searchParams.get('filter') || undefined,
    sort: searchParams.get('sort') as 'created_at' | 'date' | 'lesson_number' | undefined,
    sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' | undefined,
    page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
  };
}

/**
 * GET /api/teacher/lessons
 * List lessons filtered to teacher's students only
 */
export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async ({ user, roles }) => {
      try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const queryParams = extractQueryParams(searchParams);

        const result = await getLessonsHandler(supabase, user, roles, queryParams);

        if (result.error) {
          return NextResponse.json({ error: result.error }, { status: result.status });
        }

        return NextResponse.json(
          {
            lessons: result.lessons || [],
            count: result.count || 0,
          },
          { status: 200 }
        );
      } catch (error) {
        logger.error('Error in teacher lessons API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    },
    { requiredRole: 'teacher' }
  );
}

/**
 * POST /api/teacher/lessons
 * Create a new lesson for teacher's students only
 */
export async function POST(request: NextRequest) {
  return withApiAuth(
    request,
    async ({ user, roles }) => {
      try {
        const supabase = await createClient();
        const body = await request.json();

        // Force teacher_id to be current user for teacher role
        const lessonData = {
          ...body,
          teacher_id: user.id,
        };

        const result = await createLessonHandler(supabase, user, roles, lessonData);

        if (result.error) {
          return NextResponse.json({ error: result.error }, { status: result.status });
        }

        return NextResponse.json(result.lesson, { status: result.status });
      } catch (error) {
        logger.error('Error in teacher lesson creation API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    },
    { requiredRole: 'teacher' }
  );
}
