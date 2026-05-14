import { createAdminClient } from '@/lib/supabase/admin';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { maskShadowEmail } from '@/lib/auth/shadow-email';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { logShadowUserCreated, logAdminUserCreated } from '@/lib/auth/auth-event-logger';
import { logger } from '@/lib/logger';
import { NextRequest } from 'next/server';

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

export async function GET(request: NextRequest) {
  return withApiAuth(request, async ({ user, roles }) => {
    try {
      const supabase = createAdminClient();
      const url = new URL(request.url);

      const searchQuery = url.searchParams.get('search');
      const roleFilter = url.searchParams.get('role');
      const studentStatus = url.searchParams.get('studentStatus');
      const activeFilter = url.searchParams.get('active');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      // Student role: can only see their own profile
      if (roles.isStudent && !roles.isAdmin && !roles.isTeacher) {
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
      let allowedStudentIds: string[] | null = null;
      if (roles.isTeacher && !roles.isAdmin) {
        const { data: lessonData } = await supabase
          .from('lessons')
          .select('student_id')
          .eq('teacher_id', user.id)
          .is('deleted_at', null);

        allowedStudentIds = Array.from(new Set((lessonData || []).map((l) => l.student_id)));

        if (allowedStudentIds.length === 0) {
          return Response.json({ data: [], total: 0, limit, offset }, { status: 200 });
        }
      }

      let query = supabase
        .from('profiles')
        .select(
          'id, email, full_name, avatar_url, is_admin, is_teacher, is_student, is_shadow, is_active, student_status, created_at, updated_at',
          { count: 'exact' }
        );

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

      if (studentStatus && studentStatus !== 'all') {
        query = query.eq('student_status', studentStatus as 'active' | 'archived');
      }

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

      return Response.json({ data: mappedData, total: count || 0, limit, offset }, { status: 200 });
    } catch (error) {
      logger.error('Error fetching users:', error);
      return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

export async function POST(request: NextRequest) {
  return withApiAuth(request, async ({ user, roles }) => {
    try {
      if (!roles.isAdmin && !roles.isTeacher) {
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
        full_name,
        phone,
        notes,
        isAdmin: reqIsAdmin,
        isTeacher: reqIsTeacher,
        isStudent: reqIsStudent,
        inviteEmail,
      } = parsed.data;

      if (!roles.isAdmin && roles.isTeacher) {
        if (reqIsAdmin || reqIsTeacher) {
          return Response.json({ error: 'Teachers can only create students' }, { status: 403 });
        }
      }

      const supabaseAdmin = createAdminClient();

      let finalFullName = full_name;
      if (!finalFullName && (firstName || lastName)) {
        finalFullName = `${firstName || ''} ${lastName || ''}`.trim();
      }

      if (finalFullName && finalFullName.includes('$$$')) {
        finalFullName = finalFullName.replace(/\$\$\$\s*/g, '').trim();
      }

      let finalEmail = email;

      if (!email || email.trim() === '') {
        const newId = randomUUID();
        finalEmail = `shadow_${newId}@placeholder.com`;

        const inviteEmailValue = inviteEmail?.trim() || null;

        const insertPayload: Record<string, unknown> = {
          id: newId,
          email: finalEmail,
          full_name: finalFullName || null,
          phone: phone || null,
          notes: notes || null,
          is_admin: reqIsAdmin || false,
          is_teacher: reqIsTeacher || false,
          is_student: reqIsStudent || true,
          is_shadow: true,
        };
        // Only include invite_email when set — column may not exist in all envs
        if (inviteEmailValue !== null) {
          insertPayload.invite_email = inviteEmailValue;
        }

        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert([insertPayload as never])
          .select()
          .single();

        if (profileError) {
          logger.error('Shadow profile insert error:', profileError);
          return Response.json(
            { error: profileError.message, code: profileError.code },
            { status: 500 }
          );
        }

        logShadowUserCreated(finalEmail, user.id, newId);
        return Response.json(profileData, { status: 201 });
      }

      // Real User Creation
      const { data: existing } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (existing) {
        return Response.json({ error: 'User with this email already exists' }, { status: 409 });
      }

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        email_confirm: true,
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

      const { data: profileData, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          full_name: finalFullName || null,
          phone: phone || null,
          notes: notes || null,
          is_admin: reqIsAdmin || false,
          is_teacher: reqIsTeacher || false,
          is_student: reqIsStudent !== false,
          is_shadow: false,
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        logger.error('Error updating profile:', updateError);
        return Response.json({ id: userId, email: email }, { status: 201 });
      }

      return Response.json(profileData, { status: 201 });
    } catch (error) {
      logger.error('Error creating user:', error);
      return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

/**
 * PATCH /api/users — Set invite_email on a shadow profile.
 */
export async function PATCH(request: NextRequest) {
  return withApiAuth(request, async ({ roles }) => {
    try {
      if (!roles.isAdmin && !roles.isTeacher) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const rawBody = await request.json();
      const parsed = PatchUserSchema.safeParse(rawBody);
      if (!parsed.success) {
        return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
      }

      const { userId, inviteEmail } = parsed.data;
      const supabase = createAdminClient();

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
        .update({ invite_email: inviteEmail } as never)
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        logger.error('Error setting invite_email:', updateError);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
      }

      return Response.json(updated, { status: 200 });
    } catch (error) {
      logger.error('Error in PATCH /api/users:', error);
      return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
