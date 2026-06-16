import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { randomUUID } from 'crypto';
import { maskShadowEmail } from '@/lib/auth/shadow-email';
import { z } from 'zod';
import {
  logShadowUserCreated,
  logAdminUserCreated,
  logShadowInviteEmailSet,
  logShadowInviteSent,
} from '@/lib/auth/auth-event-logger';
import { logger } from '@/lib/logger';

const CreateUserSchema = z.object({
  email: z.string().email().optional().or(z.literal('')),
  firstName: z.string().max(255).optional(),
  lastName: z.string().max(255).optional(),
  full_name: z.string().max(255).optional(),
  phone: z.string().max(50).optional(),
  notes: z.string().max(5000).optional(),
  isAdmin: z.boolean().optional(),
  isTeacher: z.boolean().optional(),
  isStudent: z.boolean().optional(),
  isShadow: z.boolean().optional(),
  inviteEmail: z.string().email().optional().or(z.literal('')),
});

const PatchUserSchema = z.object({
  userId: z.string().uuid(),
  inviteEmail: z.string().email('Invalid invite email'),
});

export async function GET(request: Request) {
  try {
    const { user, isAdmin, isTeacher, isStudent } = await getUserWithRolesSSR();

    if (!user || (!isAdmin && !isTeacher && !isStudent)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const url = new URL(request.url);

    // Filtering parameters
    const searchQuery = url.searchParams.get('search');
    const roleFilter = url.searchParams.get('role');
    const studentStatus = url.searchParams.get('studentStatus');
    const activeFilter = url.searchParams.get('active');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Student role: can only see their own profile
    if (isStudent && !isAdmin && !isTeacher) {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, email, full_name, avatar_url, is_admin, is_teacher, is_student, is_shadow, is_active, student_status, created_at, updated_at'
        )
        .eq('id', user.id)
        .single();

      if (error || !data) {
        return Response.json({ error: 'Profile not found' }, { status: 404 });
      }

      const mapped = {
        id: data.id,
        email: maskShadowEmail(data.email),
        firstName: null,
        lastName: null,
        full_name: data.full_name,
        avatar_url: data.avatar_url ?? null,
        isAdmin: data.is_admin,
        isTeacher: data.is_teacher,
        isStudent: data.is_student,
        isShadow: data.is_shadow,
        isActive: data.is_active ?? true,
        isRegistered: !data.is_shadow,
        studentStatus: data.student_status ?? 'active',
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      return Response.json({ data: [mapped], total: 1, limit, offset }, { status: 200 });
    }

    // Teacher role: can only see students linked via active lessons
    // Determine allowed profile IDs for teacher
    let allowedStudentIds: string[] | null = null;
    if (isTeacher && !isAdmin) {
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('student_id')
        .eq('teacher_id', user.id)
        .is('deleted_at', null);

      allowedStudentIds = Array.from(new Set((lessonData || []).map((l) => l.student_id)));

      // If teacher has no students, return empty result
      if (allowedStudentIds.length === 0) {
        return Response.json({ data: [], total: 0, limit, offset }, { status: 200 });
      }
    }

    // Build query
    let query = supabase
      .from('profiles')
      .select(
        'id, email, full_name, avatar_url, is_admin, is_teacher, is_student, is_shadow, is_active, student_status, created_at, updated_at',
        { count: 'exact' }
      );

    // For teachers, restrict to their students only
    if (allowedStudentIds !== null) {
      query = query.in('id', allowedStudentIds);
    }

    if (searchQuery) {
      query = query.or(`email.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`);
    }

    if (roleFilter) {
      if (roleFilter === 'admin') {
        query = query.eq('is_admin', true);
      } else if (roleFilter === 'teacher') {
        query = query.eq('is_teacher', true);
      } else if (roleFilter === 'student') {
        query = query.eq('is_student', true);
      } else if (roleFilter === 'shadow') {
        query = query.eq('is_shadow', true);
      }
    }

    // Filter by student status (only applies to students)
    if (studentStatus && studentStatus !== 'all') {
      query = query.eq('student_status', studentStatus);
    }

    // Filter by account active status
    if (activeFilter !== null) {
      query = query.eq('is_active', activeFilter === 'true');
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return Response.json({ error: 'Internal server error' }, { status: 500 });
    }

    const mappedData = (data || []).map((profile) => ({
      id: profile.id,
      email: maskShadowEmail(profile.email),
      firstName: null,
      lastName: null,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url ?? null,
      isAdmin: profile.is_admin,
      isTeacher: profile.is_teacher,
      isStudent: profile.is_student,
      isShadow: profile.is_shadow,
      isActive: profile.is_active ?? true,
      isRegistered: !profile.is_shadow,
      studentStatus: profile.student_status ?? 'active',
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    }));

    return Response.json(
      {
        data: mappedData,
        total: count || 0,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error fetching users:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, isAdmin, isTeacher } = await getUserWithRolesSSR();

    if (!user || (!isAdmin && !isTeacher)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let rawBody;
    try {
      const text = await request.text();
      if (!text) {
        return Response.json({ error: 'Empty request body' }, { status: 400 });
      }
      rawBody = JSON.parse(text);
    } catch (e) {
      logger.error('Error parsing JSON body:', e);
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = CreateUserSchema.safeParse(rawBody);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const {
      email,
      firstName,
      lastName,
      full_name, // Accept full_name directly too
      phone,
      notes,
      isAdmin: reqIsAdmin,
      isTeacher: reqIsTeacher,
      isStudent: reqIsStudent,
      inviteEmail,
    } = parsed.data;

    // Permission Check
    if (!isAdmin && isTeacher) {
      // Teachers can ONLY create Students
      if (reqIsAdmin || reqIsTeacher) {
        return Response.json({ error: 'Teachers can only create students' }, { status: 403 });
      }
    }

    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    // Construct full_name
    let finalFullName = full_name;
    if (!finalFullName && (firstName || lastName)) {
      finalFullName = `${firstName || ''} ${lastName || ''}`.trim();
    }

    // Clean up $$$ from name if present (common in imported data)
    if (finalFullName && finalFullName.includes('$$$')) {
      finalFullName = finalFullName.replace(/\$\$\$\s*/g, '').trim();
    }

    let finalEmail = email;

    if (!email || email.trim() === '') {
      // Shadow User Creation - profile only, no auth user
      const newId = randomUUID();
      finalEmail = `shadow_${newId}@placeholder.com`;

      const inviteEmailValue = inviteEmail?.trim() || null;

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: newId,
            email: finalEmail,
            full_name: finalFullName || null,
            phone: phone || null,
            notes: notes || null,
            is_admin: reqIsAdmin || false,
            is_teacher: reqIsTeacher || false,
            is_student: reqIsStudent || true,
            is_shadow: true,
            invite_email: inviteEmailValue,
          },
        ])
        .select()
        .single();

      if (profileError) {
        return Response.json({ error: 'Internal server error' }, { status: 500 });
      }

      logShadowUserCreated(finalEmail, user.id, newId);
      return Response.json(profileData, { status: 201 });
    }

    // Real User Creation - create in auth.users (trigger creates profile)
    // Check if email exists in profiles
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return Response.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    // Create user in auth.users - this triggers handle_new_user to create profile
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        firstName: firstName || '',
        lastName: lastName || '',
        full_name: finalFullName || '',
      },
    });

    if (authError) {
      logger.error('Error creating auth user:', authError);
      return Response.json({ error: authError.message }, { status: 500 });
    }

    const userId = authData.user.id;
    logAdminUserCreated(email, user.id, userId);

    // Update the profile with additional fields (trigger creates basic profile)
    const { data: profileData, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: finalFullName || null,
        phone: phone || null,
        notes: notes || null,
        is_admin: reqIsAdmin || false,
        is_teacher: reqIsTeacher || false,
        is_student: reqIsStudent !== false, // Default to true unless explicitly false
        is_shadow: false,
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      logger.error('Error updating profile:', updateError);
      // Profile was created by trigger, just couldn't update extra fields
      // Return success anyway with basic data
      return Response.json({ id: userId, email: email }, { status: 201 });
    }

    return Response.json(profileData, { status: 201 });
  } catch (error) {
    logger.error('Error creating user:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/users — Set invite_email on a shadow profile.
 * When the student later signs up with this email, the handle_new_user
 * trigger will auto-link them to this shadow profile.
 */
export async function PATCH(request: Request) {
  try {
    const { user, isAdmin, isTeacher } = await getUserWithRolesSSR();

    if (!user || (!isAdmin && !isTeacher)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawBody = await request.json();
    const parsed = PatchUserSchema.safeParse(rawBody);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { userId, inviteEmail } = parsed.data;
    const supabase = await createClient();

    // Verify the profile exists and is a shadow user
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, is_shadow')
      .eq('id', userId)
      .single();

    if (fetchError || !profile) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (!profile.is_shadow) {
      return Response.json(
        { error: 'invite_email can only be set on shadow profiles' },
        { status: 400 }
      );
    }

    // Check no other profile already uses this email
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .or(`email.eq.${inviteEmail},invite_email.eq.${inviteEmail}`)
      .neq('id', userId)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return Response.json(
        { error: 'This email is already associated with another user' },
        { status: 409 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({ invite_email: inviteEmail })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      logger.error('Error setting invite_email:', updateError);
      return Response.json({ error: 'Internal server error' }, { status: 500 });
    }

    // TODO(phase-0.1): remove try/catch once bucket-A tables are restored to prod
    try {
      await logShadowInviteEmailSet(inviteEmail, user.id, userId);
    } catch (logError) {
      logger.error('Failed to log shadow_invite_email_set', logError);
    }

    // Set-and-send: dispatch the Supabase invite so the student can claim this
    // shadow profile. The handle_new_user trigger matches invite_email on signup
    // and transfers all references (ADR-0002). A shadow WITH invite_email is
    // exactly who we invite — no is_shadow rejection here (spec 06 §6.1).
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'http://localhost:3000';

    const supabaseAdmin = createAdminClient();
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(inviteEmail, {
      redirectTo: `${baseUrl}/accept-invitation`,
    });

    if (inviteError) {
      logger.error('Failed to send shadow invite:', inviteError);
      return Response.json(
        { error: `Invite email saved but sending failed: ${inviteError.message}` },
        { status: 502 }
      );
    }

    // TODO(phase-0.1): remove try/catch once bucket-A tables are restored to prod
    try {
      await logShadowInviteSent(inviteEmail, user.id, userId);
    } catch (logError) {
      logger.error('Failed to log shadow_invite_sent', logError);
    }

    return Response.json(updated, { status: 200 });
  } catch (error) {
    logger.error('Error in PATCH /api/users:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
