import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { logger } from '@/lib/logger';
import { computeTeachingStats } from './helpers';

export async function GET() {
  try {
    const { user, isAdmin, isTeacher } = await getUserWithRolesSSR();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin && !isTeacher) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createAdminClient();
    const result = await computeTeachingStats(supabase);
    return NextResponse.json(result);
  } catch (err) {
    logger.error('[SongStatsEngagement] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
