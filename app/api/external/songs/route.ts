import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/api/unified-db';
import { extractBearerToken, authenticateWithBearerToken } from '@/lib/bearer-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

/**
 * External Songs API Handler
 *
 * Demonstrates the unified database API routing to local/remote based on environment.
 * This endpoint can be used by external applications and automatically adapts
 * to your database configuration.
 *
 * Requires bearer token authentication via API key.
 */

export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const token = extractBearerToken(request.headers.get('Authorization') ?? undefined);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Bearer token required' },
        { status: 401 }
      );
    }
    const auth = await authenticateWithBearerToken(token);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or inactive API key' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
    const offset = searchParams.get('offset')
      ? parseInt(searchParams.get('offset')!, 10)
      : undefined;
    const search = searchParams.get('search') || undefined;
    const level = searchParams.get('level') || undefined;
    const key = searchParams.get('key') || undefined;

    // Build filter
    const filter: Record<string, unknown> = {};
    if (level) filter.level = level;
    if (key) filter.key = key;

    // Execute query through unified API
    const result = await db.songs.findAll({
      filter,
      limit,
      offset,
      order: 'created_at.desc',
    });

    if (result.error) {
      return NextResponse.json(
        {
          error: 'Database query failed',
          details: result.error.message,
          database: result.isLocal ? 'local' : 'remote',
        },
        { status: result.status || 500 }
      );
    }

    // Filter by search term if provided (client-side filtering for demo)
    let songs = result.data || [];
    if (search) {
      const searchTerm = search.toLowerCase();
      songs = songs.filter(
        (song) =>
          song.title?.toLowerCase().includes(searchTerm) ||
          song.author?.toLowerCase().includes(searchTerm)
      );
    }

    return NextResponse.json({
      songs,
      meta: {
        count: songs.length,
        database: result.isLocal ? 'local' : 'remote',
        endpoint: db.songs.findAll.toString().includes('local') ? 'local' : 'remote',
      },
    });
  } catch (error) {
    logger.error('❌ [External API] Songs GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    const token = extractBearerToken(request.headers.get('Authorization') ?? undefined);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Bearer token required' },
        { status: 401 }
      );
    }
    const auth = await authenticateWithBearerToken(token);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or inactive API key' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.author || !body.level || !body.key) {
      return NextResponse.json(
        { error: 'Missing required fields: title, author, level, key' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS — request is already authenticated via bearer token
    const supabase = createAdminClient();
    const { data: song, error: insertError } = await supabase
      .from('songs')
      .insert({
        title: body.title,
        author: body.author,
        level: body.level,
        key: body.key,
        ultimate_guitar_link: body.ultimate_guitar_link || '',
        chords: body.chords || null,
        short_title: body.short_title || null,
        youtube_url: body.youtube_url || null,
        gallery_images: body.gallery_images || null,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        {
          error: 'Failed to create song',
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        song,
        meta: {
          created: true,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('❌ [External API] Songs POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
