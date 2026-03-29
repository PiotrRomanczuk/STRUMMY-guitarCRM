import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { logger } from '@/lib/logger';
import { enrichTempo, enrichCategory } from './helpers';

export async function POST(req: NextRequest) {
  try {
    const { user, isAdmin } = await getUserWithRolesSSR();
    if (!user || !isAdmin) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const type = body.type as string;
    const batchSize = Math.min(Number(body.batchSize) || 50, 100);
    const supabase = createAdminClient();

    if (type === 'tempo') {
      const result = await enrichTempo(supabase, batchSize);
      return NextResponse.json(result);
    }
    if (type === 'category') {
      const result = await enrichCategory(supabase, batchSize);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid type. Use "tempo" or "category"' }, { status: 400 });
  } catch (err) {
    logger.error('[SpotifyEnrich] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
