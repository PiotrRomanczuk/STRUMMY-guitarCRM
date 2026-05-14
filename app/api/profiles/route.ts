import { createAdminClient } from '@/lib/supabase/admin';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  return withApiAuth(request, async ({ roles }) => {
    try {
      if (!roles.isAdmin && !roles.isTeacher) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const supabase = createAdminClient();

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

      return NextResponse.json(profiles || []);
    } catch (error) {
      logger.error('Error in profiles API:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
