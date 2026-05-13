import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { getLessonsHandler, createLessonHandler } from './handlers';
import { TEST_ACCOUNT_MUTATION_ERROR } from '@/lib/auth/test-account-guard';
import { logger } from '@/lib/logger';
import { createListResponse } from '@/lib/api/response';

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
 * GET /api/lessons
 * List all lessons with role-based filtering
 */
export async function GET(request: NextRequest) {
  return withApiAuth(request, async ({ user, roles }) => {
    try {
      const supabase = createAdminClient();
      const { searchParams } = new URL(request.url);
      const queryParams = extractQueryParams(searchParams);

      const result = await getLessonsHandler(supabase, user, roles, queryParams);

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }

      const lessons = result.lessons ?? [];
      const count = result.count ?? 0;
      return NextResponse.json(
        {
          ...createListResponse('lessons', lessons, {
            total: count,
            page: queryParams.page,
            limit: queryParams.limit,
          }),
          count, // legacy field — drop when frontend migrates to pagination.total
        },
        { status: 200 }
      );
    } catch (error) {
      logger.error('Error in lessons API:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

/**
 * POST /api/lessons
 * Create a new lesson (admin/teacher only)
 */
export async function POST(request: NextRequest) {
  return withApiAuth(request, async ({ user, roles, flags }) => {
    try {
      if (flags.isDevelopment) {
        return NextResponse.json({ error: TEST_ACCOUNT_MUTATION_ERROR }, { status: 403 });
      }

      const supabase = createAdminClient();
      const body = await request.json();
      const result = await createLessonHandler(supabase, user, roles, body);

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }

      return NextResponse.json(result.lesson, { status: result.status });
    } catch (error) {
      logger.error('Error in lesson creation API:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
