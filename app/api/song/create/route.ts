import { authenticateRequest } from '@/lib/auth/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { SongInputSchema } from '@/schemas/SongSchema';
import { NextRequest, NextResponse } from 'next/server';
import { TEST_ACCOUNT_MUTATION_ERROR } from '@/lib/auth/test-account-guard';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
    }
    const supabase = createAdminClient();
    const body = await request.json();

    // Check if user has permission to create songs
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, is_teacher, is_development')
      .eq('id', auth.user.id)
      .single();

    if (profile?.is_development) {
      return NextResponse.json({ error: TEST_ACCOUNT_MUTATION_ERROR }, { status: 403 });
    }

    if (!profile || (!profile.is_admin && !profile.is_teacher)) {
      return NextResponse.json(
        { error: 'You are not authorized to create songs' },
        { status: 403 }
      );
    }

    // Validate input data using the schema
    const parseResult = SongInputSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid song data', details: parseResult.error },
        { status: 400 }
      );
    }

    const { data: song, error } = await supabase
      .from('songs')
      .insert(parseResult.data)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Song already exists' }, { status: 409 });
      }
      logger.error('Error creating song:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(song);
  } catch (error) {
    logger.error('Error in song creation API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
