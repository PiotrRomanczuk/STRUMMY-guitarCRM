import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  TEST_ACCOUNT_MUTATION_ERROR,
  isDemoMutationBlocked,
} from '@/lib/auth/test-account-guard';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check permissions
  const { data: profile } = await supabase
    .from('user_overview')
    .select('is_admin, is_teacher')
    .eq('user_id', user.id)
    .single();

  if (!profile?.is_admin && !profile?.is_teacher) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Check if user is a test/development account
  const { data: devProfile } = await supabase
    .from('profiles')
    .select('is_development')
    .eq('id', user.id)
    .single();

  if (devProfile?.is_development) {
    return NextResponse.json({ error: TEST_ACCOUNT_MUTATION_ERROR }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { matchId } = body;

    if (!matchId) {
      return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
    }

    // Update the match status to rejected
    const { error } = await supabase
      .from('spotify_matches')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq('id', matchId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Match rejected',
    });
  } catch (error) {
    logger.error('Failed to reject match:', error);
    return NextResponse.json(
      {
        error: 'Failed to reject match',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
