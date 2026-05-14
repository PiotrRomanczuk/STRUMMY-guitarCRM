import { createAdminClient } from '@/lib/supabase/admin';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { NextRequest } from 'next/server';

const UpdateUserSchema = z.object({
  full_name: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  isAdmin: z.boolean().optional(),
  isTeacher: z.boolean().optional(),
  isStudent: z.boolean().optional(),
  isParent: z.boolean().optional(),
  isActive: z.boolean().optional(),
  parentId: z.string().uuid().nullable().optional(),
});

type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

/**
 * Build a true PATCH update payload from a parsed user-update body.
 * Only fields the client actually sent are included; this prevents
 * silently clobbering columns (notably role flags) on partial updates.
 * Always sets updated_at. See STRUM-253.
 */
function buildUserUpdatePayload(body: UpdateUserInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.full_name !== undefined) {
    payload.full_name = body.full_name;
  } else if (body.firstName !== undefined || body.lastName !== undefined) {
    payload.full_name = `${body.firstName ?? ''} ${body.lastName ?? ''}`.trim();
  }

  if (body.isAdmin !== undefined) payload.is_admin = body.isAdmin;
  if (body.isTeacher !== undefined) payload.is_teacher = body.isTeacher;
  if (body.isStudent !== undefined) payload.is_student = body.isStudent;
  if (body.isParent !== undefined) payload.is_parent = body.isParent;
  if (body.isActive !== undefined) payload.is_active = body.isActive;
  if (body.parentId !== undefined) payload.parent_id = body.parentId;

  return payload;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiAuth(
    request,
    async (_authed, _req) => {
      try {
        const { id } = await params;
        const supabase = createAdminClient();

        const { data, error } = await supabase
          .from('profiles')
          .select(
            'id, email, full_name, first_name, last_name, phone, notes, is_admin, is_teacher, is_student, is_shadow, is_active, is_parent, parent_id, student_status, created_at, updated_at'
          )
          .eq('id', id)
          .single();

        if (error || !data) {
          return Response.json({ error: 'User not found' }, { status: 404 });
        }

        return Response.json(data, { status: 200 });
      } catch (error) {
        logger.error('Error fetching user:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
      }
    },
    { requiredRole: 'admin' }
  );
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiAuth(
    request,
    async (_authed, req) => {
      try {
        const { id } = await params;

        let body: z.infer<typeof UpdateUserSchema>;
        try {
          const text = await req.text();
          if (!text) {
            return Response.json({ error: 'Empty request body' }, { status: 400 });
          }
          const parsed = JSON.parse(text);
          const result = UpdateUserSchema.safeParse(parsed);
          if (!result.success) {
            return Response.json(
              { error: 'Invalid request body', details: result.error.issues },
              { status: 400 }
            );
          }
          body = result.data;
        } catch (e) {
          logger.error('Error parsing JSON body:', e);
          return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const supabase = createAdminClient();

        if (body.parentId !== undefined) {
          if (body.parentId === id) {
            return Response.json({ error: 'A user cannot be their own parent' }, { status: 400 });
          }
          if (body.parentId !== null) {
            const { data: parentProfile } = await supabase
              .from('profiles')
              .select('id, is_parent')
              .eq('id', body.parentId)
              .single();
            if (!parentProfile) {
              return Response.json({ error: 'Parent profile not found' }, { status: 400 });
            }
            if (!parentProfile.is_parent) {
              return Response.json(
                { error: 'Target user is not marked as a parent' },
                { status: 400 }
              );
            }
          }
        }

        const updatePayload = buildUserUpdatePayload(body);

        if (Object.keys(updatePayload).length === 1) {
          return Response.json({ error: 'No updatable fields provided' }, { status: 400 });
        }

        const { data, error } = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json(data, { status: 200 });
      } catch (error) {
        logger.error('Error updating user:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
      }
    },
    { requiredRole: 'admin' }
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiAuth(
    request,
    async (_authed, _req) => {
      try {
        const { id } = await params;
        const supabase = createAdminClient();

        const { error } = await supabase.from('profiles').delete().eq('id', id);

        if (error) {
          return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json({ success: true }, { status: 200 });
      } catch (error) {
        logger.error('Error deleting user:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
      }
    },
    { requiredRole: 'admin' }
  );
}
