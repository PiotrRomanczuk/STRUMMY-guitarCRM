import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import type { Song } from '@/components/songs/types';

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
  }

  const userId = auth.user.id;
  const supabase = createAdminClient();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();
  if (profileError) {
    return NextResponse.json({ error: 'Error fetching user profile' }, { status: 500 });
  }
  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return NextResponse.json([]);
}
