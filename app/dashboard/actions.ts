'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logInviteSent, logInviteFailed, logShadowUserCreated } from '@/lib/auth/auth-event-logger';
import type { AuthEvent } from '@/components/dashboard/admin/auth-events/auth-events.helpers';
import { logger } from '@/lib/logger';

export async function sendUserInvite(userId: string) {
  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('is_admin, is_teacher')
    .eq('id', currentUser.id)
    .single();

  if (!callerProfile?.is_admin && !callerProfile?.is_teacher) {
    throw new Error('Unauthorized: Only admins and teachers can send invites');
  }

  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('email, is_shadow, sign_in_count, full_name')
    .eq('id', userId)
    .single();

  if (!targetProfile) {
    throw new Error('User not found');
  }

  if (targetProfile.is_shadow) {
    throw new Error('Cannot send invite to shadow user — they need a real email first');
  }

  if (targetProfile.sign_in_count > 0) {
    throw new Error('User has already signed in — no invite needed');
  }

  const supabaseAdmin = createAdminClient();

  // Reset email confirmation so invite flow works on already-confirmed users
  await supabaseAdmin.auth.admin.updateUserById(userId, {
    email_confirm: false,
  });

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    targetProfile.email,
    {
      redirectTo: `${baseUrl}/accept-invitation`,
    }
  );

  if (inviteError) {
    logInviteFailed(targetProfile.email, currentUser.id, inviteError.message);
    throw new Error(`Failed to send invite: ${inviteError.message}`);
  }

  logInviteSent(targetProfile.email, currentUser.id, userId);
  return { success: true };
}

export async function inviteUser(
  email: string,
  fullName: string,
  role: 'student' | 'teacher' | 'admin' = 'student',
  phone?: string
) {
  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', currentUser.id)
    .single();

  if (!profile?.is_admin) {
    throw new Error('Unauthorized: Only admins can invite users');
  }

  const supabaseAdmin = createAdminClient();

  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = existingUsers.users.find((u) => u.email === email);

  let userId = existingUser?.id;

  if (!userId) {
    const { data: authData, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email);

    if (inviteError) {
      logInviteFailed(email, currentUser.id, inviteError.message);
      throw new Error(`Failed to invite user: ${inviteError.message}`);
    }
    if (!authData.user) throw new Error('User creation failed');
    userId = authData.user.id;
    logInviteSent(email, currentUser.id, userId);
  }

  const updates: Record<string, unknown> = {
    full_name: fullName,
    phone: phone || null,
    is_student: role === 'student',
    is_teacher: role === 'teacher',
    is_admin: role === 'admin',
  };

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (profileError) logger.error('Error updating profile:', profileError);

  return { success: true, userId };
}

export async function findOrCreateAuthUser(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  studentEmail: string
): Promise<string> {
  // 1. Search existing auth users
  let page = 1;
  while (page <= 5) {
    const {
      data: { users },
      error,
    } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });

    if (error || !users || users.length === 0) break;

    const found = users.find((u) => u.email?.toLowerCase() === studentEmail.toLowerCase());
    if (found) return found.id;
    page++;
  }

  // 2. Try generateLink, then createUser as fallback
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: studentEmail,
    options: {
      data: { is_student: true },
    },
  });

  if (linkError) {
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: studentEmail,
      email_confirm: true,
      user_metadata: { is_student: true },
    });

    if (createError) throw new Error(`Failed to create/find user: ${createError.message}`);
    return newUser.user.id;
  }

  if (linkData?.user) {
    if (!linkData.user.email_confirmed_at) {
      await supabaseAdmin.auth.admin.updateUserById(linkData.user.id, { email_confirm: true });
    }
    return linkData.user.id;
  }

  throw new Error('Could not obtain user ID for shadow user');
}

export async function upsertStudentProfile(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  userId: string,
  studentEmail: string
): Promise<void> {
  const { error } = await supabaseAdmin.from('profiles').upsert(
    {
      id: userId,
      email: studentEmail,
      full_name: null,
      is_student: true,
      is_teacher: false,
      is_admin: false,
      is_development: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (!error) return;

  // Handle duplicate email (orphan profile)
  if (error.code === '23505' && error.message?.includes('email')) {
    await cleanupOrphanProfiles(supabaseAdmin, userId, studentEmail);
    return;
  }

  logger.error('Failed to upsert shadow profile:', error);
  throw new Error('Failed to ensure shadow profile exists');
}

async function cleanupOrphanProfiles(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  userId: string,
  studentEmail: string
): Promise<void> {
  const { data: orphan } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', studentEmail)
    .single();

  if (!orphan || orphan.id === userId) return;

  // Rename orphan email to free constraint
  const tempEmail = `${studentEmail}_migrated_${Date.now()}`;
  await supabaseAdmin.from('profiles').update({ email: tempEmail }).eq('id', orphan.id);

  // Create new profile
  const { error } = await supabaseAdmin.from('profiles').upsert(
    {
      id: userId,
      email: studentEmail,
      full_name: null,
      is_student: true,
      is_teacher: false,
      is_admin: false,
      is_development: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) throw new Error(`Failed to create profile after cleanup: ${error.message}`);

  // Migrate related data
  await supabaseAdmin.from('lessons').update({ student_id: userId }).eq('student_id', orphan.id);
  await supabaseAdmin.from('lessons').update({ teacher_id: userId }).eq('teacher_id', orphan.id);
  await supabaseAdmin
    .from('assignments')
    .update({ student_id: userId })
    .eq('student_id', orphan.id);
  await supabaseAdmin
    .from('assignments')
    .update({ teacher_id: userId })
    .eq('teacher_id', orphan.id);

  // Delete orphan
  await supabaseAdmin.from('profiles').delete().eq('id', orphan.id);
}

export async function createShadowUser(studentEmail: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, is_teacher')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin && !profile?.is_teacher) {
    throw new Error('Unauthorized: Only teachers and admins can create shadow users');
  }

  const supabaseAdmin = createAdminClient();
  const userId = await findOrCreateAuthUser(supabaseAdmin, studentEmail);
  await upsertStudentProfile(supabaseAdmin, userId, studentEmail);

  logShadowUserCreated(studentEmail, user.id, userId);
  return { success: true, userId };
}

export async function deleteUser(userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    throw new Error('Unauthorized: Admin access required');
  }

  const supabaseAdmin = createAdminClient();

  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);

  const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', userId);

  if (profileError) {
    logger.error('Error deleting profile:', profileError);
  }

  if (authUser?.user) {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      logger.error('Error deleting auth user:', error);
      if (!profileError) {
        return { success: true, warning: 'Profile deleted but auth user deletion failed' };
      }
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  return { success: true };
}

export async function getAuditLogs(limit = 10) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    throw new Error('Unauthorized: Admin access required');
  }

  const { data, error } = await supabase
    .from('audit_log')
    .select('*, profiles!actor_id(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Error fetching audit logs:', error);
    return [];
  }

  return data;
}

export interface AuthEventFilters {
  email?: string;
  eventType?: string;
  success?: boolean;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}

export async function getAuthEvents(filters: AuthEventFilters = {}): Promise<AuthEvent[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    throw new Error('Unauthorized: Admin access required');
  }

  const limit = filters.limit ?? 100;

  // Use supabase client (RLS enforces admin-only SELECT)
  let query = supabase
    .from('auth_events' as never)
    .select('*' as never)
    .order('occurred_at' as never, { ascending: false } as never)
    .limit(limit);

  if (filters.email) {
    query = query.ilike('user_email' as never, `%${filters.email}%` as never);
  }
  if (filters.eventType) {
    query = query.eq('event_type' as never, filters.eventType as never);
  }
  if (filters.success !== undefined) {
    query = query.eq('success' as never, filters.success as never);
  }
  if (filters.fromDate) {
    query = query.gte('occurred_at' as never, filters.fromDate as never);
  }
  if (filters.toDate) {
    query = query.lte('occurred_at' as never, filters.toDate as never);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching auth events:', error);
    return [];
  }

  return (data ?? []) as unknown as AuthEvent[];
}
