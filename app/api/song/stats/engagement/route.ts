import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { logger } from '@/lib/logger';
import { computeTeachingStats } from './helpers';

export async function GET(request: Request) {
  return withApiAuth(request, async ({ roles }) => {
    try {
      if (!roles.isAdmin && !roles.isTeacher) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const supabase = createAdminClient();
      const result = await computeTeachingStats(supabase);
      return NextResponse.json(result);
    } catch (err) {
      logger.error('[SongStatsEngagement] Error:', err);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
