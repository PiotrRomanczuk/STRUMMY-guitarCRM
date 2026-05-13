import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { computeChordAnalysis } from '@/lib/services/chord-analytics';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  return withApiAuth(request, async ({ roles }) => {
    try {
      if (!roles.isAdmin && !roles.isTeacher) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const adminClient = createAdminClient();

      const { data: songs, error } = await adminClient
        .from('songs')
        .select('id, title, author, key, chords')
        .is('deleted_at', null);

      if (error) {
        logger.error('[ChordAnalysis] Query error:', error);
        return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
      }

      const result = computeChordAnalysis(songs ?? []);
      return NextResponse.json(result);
    } catch (error) {
      logger.error('[ChordAnalysis] Error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
