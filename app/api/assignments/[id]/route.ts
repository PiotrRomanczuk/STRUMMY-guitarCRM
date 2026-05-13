import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { AssignmentUpdateSchema } from '@/schemas/AssignmentSchema';
import { getAssignmentHandler, updateAssignmentHandler, deleteAssignmentHandler } from './handlers';
import { TEST_ACCOUNT_MUTATION_ERROR } from '@/lib/auth/test-account-guard';
import { logger } from '@/lib/logger';

/**
 * GET /api/assignments/[id]
 * Fetch a single assignment by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiAuth(request, async ({ user, roles }) => {
    try {
      const { id } = await params;
      const supabase = createAdminClient();
      const result = await getAssignmentHandler(supabase, id, user.id, roles);

      return NextResponse.json(result.data ? result.data : { error: result.error }, {
        status: result.status,
      });
    } catch (error) {
      logger.error('Error in GET /api/assignments/[id]:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

/**
 * PATCH /api/assignments/[id]
 * Update an assignment
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiAuth(request, async ({ user, roles, flags }) => {
    try {
      if (flags.isDevelopment) {
        return NextResponse.json({ error: TEST_ACCOUNT_MUTATION_ERROR }, { status: 403 });
      }

      const { id } = await params;
      const supabase = createAdminClient();
      const body = await request.json();
      const input = AssignmentUpdateSchema.parse({ ...body, id });

      const result = await updateAssignmentHandler(supabase, id, user.id, roles, input, body);

      return NextResponse.json(result.data ? result.data : { error: result.error }, {
        status: result.status,
      });
    } catch (error) {
      logger.error('Error in PATCH /api/assignments/[id]:', error);

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

/**
 * DELETE /api/assignments/[id]
 * Delete an assignment
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
      const supabase = createAdminClient();
      const result = await deleteAssignmentHandler(supabase, id, user.id, roles);

      return NextResponse.json(result.data ? result.data : { error: result.error }, {
        status: result.status,
      });
    } catch (error) {
      logger.error('Error in DELETE /api/assignments/[id]:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
