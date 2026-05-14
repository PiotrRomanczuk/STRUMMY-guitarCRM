import { createAdminClient } from '@/lib/supabase/admin';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { z } from 'zod';
import { PhoneSchema } from '@/schemas/shared/phone';
import { NextRequest } from 'next/server';

const ProfileUpdateSchema = z.object({
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  full_name: z.string().max(255).optional(),
  phone: PhoneSchema,
  avatar_url: z.string().url().optional().nullable(),
});

const PROFILE_COLUMNS =
  'id, email, first_name, last_name, full_name, phone, avatar_url, is_admin, is_teacher, is_student, is_active, last_sign_in_at, sign_in_count, deletion_requested_at, deletion_scheduled_for, created_at, updated_at';

export async function GET(request: NextRequest) {
  return withApiAuth(request, async ({ user }) => {
    try {
      const supabase = createAdminClient();

      const { data, error } = await supabase
        .from('profiles')
        .select(PROFILE_COLUMNS)
        .eq('id', user.id)
        .single();

      if (error || !data) {
        return Response.json({ error: 'Profile not found' }, { status: 404 });
      }

      return Response.json(data, { status: 200 });
    } catch {
      return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

export async function PUT(request: NextRequest) {
  return withApiAuth(request, async ({ user }, req) => {
    try {
      let body;
      try {
        body = await req.json();
      } catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
      }

      const parsed = ProfileUpdateSchema.safeParse(body);

      if (!parsed.success) {
        return Response.json(
          { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const updates: Record<string, unknown> = {};
      if (parsed.data.first_name !== undefined) updates.first_name = parsed.data.first_name;
      if (parsed.data.last_name !== undefined) updates.last_name = parsed.data.last_name;
      if (parsed.data.full_name !== undefined) updates.full_name = parsed.data.full_name;
      if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;
      if (parsed.data.avatar_url !== undefined) updates.avatar_url = parsed.data.avatar_url;

      if (Object.keys(updates).length === 0) {
        return Response.json({ error: 'No fields to update' }, { status: 400 });
      }

      const supabase = createAdminClient();

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select(PROFILE_COLUMNS)
        .single();

      if (error) {
        return Response.json({ error: 'Failed to update profile' }, { status: 500 });
      }

      return Response.json(data, { status: 200 });
    } catch {
      return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
