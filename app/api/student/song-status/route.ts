import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { SongStatusEnum } from '@/schemas';
import { logger } from '@/lib/logger';

const SongStatusUpdateSchema = z.object({
  songId: z.string().uuid('songId must be a valid UUID'),
  status: SongStatusEnum,
  notes: z.string().max(1000).optional().nullable(),
});

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = SongStatusUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { songId, status, notes } = parsed.data;

    // Get current status for logging
    const { data: currentRecord } = await supabase
      .from('student_songs')
      .select('status')
      .eq('student_id', user.id)
      .eq('song_id', songId)
      .single();

    // Update or insert student song status
    const { data, error } = await supabase
      .from('student_songs')
      .upsert(
        {
          student_id: user.id,
          song_id: songId,
          status,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'student_id,song_id',
        }
      )
      .select()
      .single();

    if (error) {
      logger.error('Error updating song status:', error);
      return NextResponse.json({ error: 'Failed to update song status' }, { status: 500 });
    }

    // Log a history row on initial insert AND on every status change. Skip
    // when the status is unchanged (re-saving the same status is a no-op for
    // history). The unbreakable spec requires that every transition is
    // recorded; previously this only fired on the initial insert.
    const previousStatus = currentRecord?.status ?? null;
    if (previousStatus !== status) {
      await supabase.from('song_status_history').insert({
        student_id: user.id,
        song_id: songId,
        previous_status: previousStatus,
        new_status: status,
        notes: notes || null,
      });
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Song status updated successfully',
    });
  } catch (error) {
    logger.error('Error in song status update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const songId = searchParams.get('songId');

    if (!songId) {
      return NextResponse.json({ error: 'Song ID is required' }, { status: 400 });
    }

    // Get status history for the song
    const { data, error } = await supabase
      .from('song_status_history')
      .select(
        `
        id,
        previous_status,
        new_status,
        changed_at,
        notes,
        song:songs(title, author)
      `
      )
      .eq('student_id', user.id)
      .eq('song_id', songId)
      .order('changed_at', { ascending: false });

    if (error) {
      logger.error('Error fetching status history:', error);
      return NextResponse.json({ error: 'Failed to fetch status history' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    logger.error('Error in status history fetch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
