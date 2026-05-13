import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { UserFavoriteInputSchema } from '@/schemas/UserFavoriteSchema';
import { TEST_ACCOUNT_MUTATION_ERROR } from '@/lib/auth/test-account-guard';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const auth = await authenticateRequest(req);
    if (!auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
    }
    const supabase = createAdminClient();

    // Check if user is requesting their own favorites or is admin via profiles boolean flags
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', auth.user.id)
      .single();

    if (auth.user.id !== userId && !profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ favorites: [], total: 0 });
  } catch (error) {
    logger.error('Error in favorites API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
    }
    const supabase = createAdminClient();
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

    // Check if user is adding their own favorite or is admin via profiles boolean flags
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, is_development')
      .eq('id', auth.user.id)
      .single();

    if (profile?.is_development) {
      return NextResponse.json({ error: TEST_ACCOUNT_MUTATION_ERROR }, { status: 403 });
    }

    if (auth.user.id !== user_id && !profile?.is_admin) {
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
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const songId = searchParams.get('songId');

    if (!userId || !songId) {
      return NextResponse.json({ error: 'User ID and Song ID are required' }, { status: 400 });
    }

    const auth = await authenticateRequest(req);
    if (!auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
    }
    const supabase = createAdminClient();

    // Check if user is removing their own favorite or is admin via profiles boolean flags
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, is_development')
      .eq('id', auth.user.id)
      .single();

    if (profile?.is_development) {
      return NextResponse.json({ error: TEST_ACCOUNT_MUTATION_ERROR }, { status: 403 });
    }

    if (auth.user.id !== userId && !profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
}
