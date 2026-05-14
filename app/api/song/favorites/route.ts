import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UserFavoriteInputSchema } from '@/schemas/UserFavoriteSchema';
import { TEST_ACCOUNT_MUTATION_ERROR } from '@/lib/auth/test-account-guard';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { logger } from '@/lib/logger';
import { createListResponse } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  return withApiAuth(req, async ({ user, roles }) => {
    try {
      const { searchParams } = new URL(req.url);
      const userId = searchParams.get('userId');

      if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
      }

      const supabase = await createClient();

      if (user.id !== userId && !roles.isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Get user favorites with song details
      const { data: favorites, error } = await supabase
        .from('user_favorites')
        .select(
          `
        *,
        song:song_id(*)
      `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.message?.includes('user_favorites') || error.message?.includes('schema cache')) {
          return NextResponse.json(createListResponse('favorites', [], { total: 0 }));
        }
        logger.error('Error fetching favorites:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const items = favorites ?? [];
      return NextResponse.json({
        ...createListResponse('favorites', items, { total: items.length }),
        total: items.length,
      });
    } catch (error) {
      logger.error('Error in favorites API:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

export async function POST(req: NextRequest) {
  return withApiAuth(req, async ({ user, roles, flags }) => {
    try {
      const supabase = await createClient();
      const body = await req.json();

      // Validate input data
      const parseResult = UserFavoriteInputSchema.safeParse(body);
      if (!parseResult.success) {
        return NextResponse.json(
          { error: 'Invalid favorite data', details: parseResult.error },
          { status: 400 }
        );
      }

      const { user_id, song_id } = parseResult.data;

      if (flags.isDevelopment) {
        return NextResponse.json({ error: TEST_ACCOUNT_MUTATION_ERROR }, { status: 403 });
      }

      if (user.id !== user_id && !roles.isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Check if song exists
      const { data: song } = await supabase.from('songs').select('id').eq('id', song_id).single();

      if (!song) {
        return NextResponse.json({ error: 'Song not found' }, { status: 404 });
      }

      // Check if favorite already exists
      const { data: existingFavorite } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', user_id)
        .eq('song_id', song_id)
        .single();

      if (existingFavorite) {
        return NextResponse.json({ error: 'Song is already in favorites' }, { status: 409 });
      }

      // Add to favorites
      const { data: favorite, error } = await supabase
        .from('user_favorites')
        .insert({ user_id, song_id })
        .select(
          `
        *,
        song:song_id(*)
      `
        )
        .single();

      if (error) {
        logger.error('Error adding favorite:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(favorite);
    } catch (error) {
      logger.error('Error in add favorite API:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

export async function DELETE(req: NextRequest) {
  return withApiAuth(req, async ({ user, roles, flags }) => {
    try {
      const { searchParams } = new URL(req.url);
      const userId = searchParams.get('userId');
      const songId = searchParams.get('songId');

      if (!userId || !songId) {
        return NextResponse.json({ error: 'User ID and Song ID are required' }, { status: 400 });
      }

      if (flags.isDevelopment) {
        return NextResponse.json({ error: TEST_ACCOUNT_MUTATION_ERROR }, { status: 403 });
      }

      if (user.id !== userId && !roles.isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const supabase = await createClient();

      // Remove from favorites
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('id', userId)
        .eq('song_id', songId);

      if (error) {
        logger.error('Error removing favorite:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      logger.error('Error in remove favorite API:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
