import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { maskShadowEmail } from '@/lib/auth/shadow-email';

export async function GET() {
  try {
    const supabase = await createClient();

    // Require authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Require admin or teacher role to list all profiles
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('is_admin, is_teacher')
      .eq('id', user.id)
      .single();

    if (!currentProfile?.is_admin && !currentProfile?.is_teacher) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(
        'id, email, full_name, is_admin, is_teacher, is_student, is_shadow, is_active, student_status, created_at, updated_at'
      )
      .order('full_name', { ascending: true });

    if (error) {
      logger.error('Error fetching profiles:', error);
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    const masked = (profiles ?? []).map((p) => ({
      ...p,
      email: maskShadowEmail(p.email),
    }));

    return NextResponse.json(masked);
  } catch (error) {
    logger.error('Error in profiles API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
