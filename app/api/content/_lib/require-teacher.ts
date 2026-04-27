import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateMutationPermission } from '@/lib/auth/permissions';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface TeacherContext {
  userId: string;
  supabase: SupabaseClient;
}

export type TeacherGate = { ok: true; ctx: TeacherContext } | { ok: false; response: NextResponse };

export async function requireTeacher(): Promise<TeacherGate> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, is_teacher')
    .eq('id', user.id)
    .single();

  if (
    !validateMutationPermission({
      isAdmin: profile?.is_admin,
      isTeacher: profile?.is_teacher,
    })
  ) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { ok: true, ctx: { userId: user.id, supabase: supabase as SupabaseClient } };
}
