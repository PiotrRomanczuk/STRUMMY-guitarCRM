import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { logInviteSent, logInviteFailed } from '@/lib/auth/auth-event-logger';
import { logger } from '@/lib/logger';

const ResendInviteSchema = z.object({
  userId: z.string().uuid('userId must be a valid UUID'),
});

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function POST(request: Request) {
  return withApiAuth(request, async ({ user, roles }) => {
    if (!roles.isAdmin && !roles.isTeacher) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = ResendInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { userId: targetId } = parsed.data;
    const supabase = await createClient();

    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('email, is_shadow, sign_in_count, full_name')
      .eq('id', targetId)
      .single();

    if (!targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetProfile.is_shadow) {
      return NextResponse.json(
        {
          error: 'Cannot send invite to shadow user — set invite_email first via PATCH /api/users',
        },
        { status: 422 }
      );
    }

    if (targetProfile.sign_in_count > 0) {
      return NextResponse.json(
        { error: 'User has already signed in — no invite needed' },
        { status: 409 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Clear email_confirm so the invite flow re-triggers for already-confirmed users
    await supabaseAdmin.auth.admin.updateUserById(targetId, { email_confirm: false });

    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      targetProfile.email,
      { redirectTo: `${BASE_URL}/accept-invitation` }
    );

    if (inviteError) {
      logInviteFailed(targetProfile.email, user.id, inviteError.message);
      logger.error('Error resending invite:', inviteError);
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    logInviteSent(targetProfile.email, user.id, targetId);
    return NextResponse.json({ success: true });
  });
}
