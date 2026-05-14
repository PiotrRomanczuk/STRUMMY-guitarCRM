import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { logInviteSent, logInviteFailed } from '@/lib/auth/auth-event-logger';
import { logger } from '@/lib/logger';

const InviteUserSchema = z.object({
  email: z.string().email('Valid email required'),
  fullName: z.string().min(1, 'Full name required').max(200),
  role: z.enum(['student', 'teacher', 'admin']).optional().default('student'),
  phone: z.string().max(50).optional().nullable(),
});

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function POST(request: Request) {
  return withApiAuth(request, async ({ user, roles }) => {
    if (!roles.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = InviteUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, fullName, role, phone } = parsed.data;
    const supabaseAdmin = createAdminClient();

    // Idempotent: if auth user already exists, skip creation
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existing = existingUsers?.users.find((u) => u.email === email);

    let userId = existing?.id;

    if (!userId) {
      const { data: authData, error: inviteError } =
        await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${BASE_URL}/accept-invitation`,
        });

      if (inviteError) {
        logInviteFailed(email, user.id, inviteError.message);
        if (inviteError.message?.includes('already been registered')) {
          return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
        }
        logger.error('Error sending invite:', inviteError);
        return NextResponse.json({ error: inviteError.message }, { status: 500 });
      }

      if (!authData.user) {
        return NextResponse.json({ error: 'User creation failed' }, { status: 500 });
      }

      userId = authData.user.id;
      logInviteSent(email, user.id, userId);
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: fullName,
        phone: phone ?? null,
        is_student: role === 'student',
        is_teacher: role === 'teacher',
        is_admin: role === 'admin',
      })
      .eq('id', userId);

    if (profileError) {
      logger.error('Error updating profile after invite:', profileError);
    }

    return NextResponse.json({ success: true, userId }, { status: 201 });
  });
}
