import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SongInputSchema } from '@/schemas/SongSchema';
import { TEST_ACCOUNT_MUTATION_ERROR } from '@/lib/auth/test-account-guard';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  return withApiAuth(request, async ({ roles, flags }) => {
    try {
      const supabase = await createClient();
      const body = await request.json();

      if (flags.isDevelopment) {
        return NextResponse.json({ error: TEST_ACCOUNT_MUTATION_ERROR }, { status: 403 });
      }

      if (!roles.isAdmin && !roles.isTeacher) {
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
        logger.error('Error creating song:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(song);
    } catch (error) {
      logger.error('Error in song creation API:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
