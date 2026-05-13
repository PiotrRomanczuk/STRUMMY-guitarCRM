import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SongUpdateSchema } from '@/schemas/SongSchema';
import { TEST_ACCOUNT_MUTATION_ERROR } from '@/lib/auth/test-account-guard';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { logger } from '@/lib/logger';

export async function PUT(request: NextRequest) {
  return withApiAuth(request, async ({ roles, flags }) => {
    try {
      const supabase = await createClient();

      if (flags.isDevelopment) {
        return NextResponse.json({ error: TEST_ACCOUNT_MUTATION_ERROR }, { status: 403 });
      }

      if (!roles.isAdmin && !roles.isTeacher) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
      }

      const parsed = SongUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const { id, ...updateFields } = parsed.data;

      const { data: existingData } = await supabase
        .from('songs')
        .select('id')
        .eq('id', id)
        .single();

      if (!existingData) {
        return NextResponse.json({ error: 'No song found with the specified ID' }, { status: 404 });
      }

      const { data: updatedSong, error } = await supabase
        .from('songs')
        .update({ ...updateFields, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating song', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ song: updatedSong }, { status: 200 });
    } catch (error) {
      logger.error('Unexpected error in song update API:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
