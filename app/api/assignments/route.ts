import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { AssignmentInputSchema } from '@/schemas/AssignmentSchema';
import { getAssignmentsHandler, createAssignmentHandler } from './handlers';
import { TEST_ACCOUNT_MUTATION_ERROR } from '@/lib/auth/test-account-guard';
import { logger } from '@/lib/logger';

/**
 * Extract query parameters from request
 */
function extractQueryParams(searchParams: URLSearchParams) {
  return {
    teacher_id: searchParams.get('teacher_id') || undefined,
    student_id: searchParams.get('student_id') || undefined,
    lesson_id: searchParams.get('lesson_id') || undefined,
    song_id: searchParams.get('song_id') || undefined,
    status: searchParams.get('status') || undefined,
    search: searchParams.get('search') || undefined,
    due_date_from: searchParams.get('due_date_from') || undefined,
    due_date_to: searchParams.get('due_date_to') || undefined,
    sortField: searchParams.get('sortField') || undefined,
    sortDirection: searchParams.get('sortDirection') as 'asc' | 'desc' | undefined,
    page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined,
  };
}

/**
 * GET /api/assignments
 * List assignments with role-based filtering
 */
export async function GET(request: NextRequest) {
  return withApiAuth(request, async ({ user, roles }) => {
    try {
      const supabase = await createClient();
      const { searchParams } = new URL(request.url);
      const queryParams = extractQueryParams(searchParams);

      const result = await getAssignmentsHandler(supabase, user.id, roles, queryParams);

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }

      return NextResponse.json({ assignments: result.assignments }, { status: 200 });
    } catch (error) {
      logger.error('Error in GET /api/assignments:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

/**
 * POST /api/assignments
 * Create a new assignment
 *
 * Role-based access:
 * - Admin: Can create any assignment
 * - Teacher: Can create assignments for their students (teacher_id must match user)
 */
export async function POST(request: NextRequest) {
  return withApiAuth(request, async ({ user, roles, flags }) => {
    try {
      if (flags.isDevelopment) {
        return NextResponse.json({ error: TEST_ACCOUNT_MUTATION_ERROR }, { status: 403 });
      }

      const supabase = await createClient();
      const body = await request.json();
      const input = AssignmentInputSchema.parse(body);

      const result = await createAssignmentHandler(supabase, user.id, roles, input);

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }

      return NextResponse.json(result.assignment, { status: result.status });
    } catch (error) {
      logger.error('Error in POST /api/assignments:', error);

      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
