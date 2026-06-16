import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/api/unified-db';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { logger } from '@/lib/logger';

/**
 * External Song by ID API Handler
 *
 * Requires bearer token authentication via API key.
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiAuth(request, async () => {
    try {
      const { id } = await params;

      if (!id) {
        return NextResponse.json({ error: 'Song ID is required' }, { status: 400 });
      }

      // Get song through unified API
      const result = await db.songs.findById(id);

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

      if (!result.data) {
        return NextResponse.json({ error: 'Song not found' }, { status: 404 });
      }

      return NextResponse.json({
        song: result.data,
        meta: {
          database: result.isLocal ? 'local' : 'remote',
        },
      });
    } catch (error) {
      logger.error('❌ [External API] Song GET error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiAuth(request, async () => {
    try {
      const { id } = await params;
      const body = await request.json();

      if (!id) {
        return NextResponse.json({ error: 'Song ID is required' }, { status: 400 });
      }

      // Update song through unified API
      const result = await db.songs.update(id, {
        ...(body.title && { title: body.title }),
        ...(body.author && { author: body.author }),
        ...(body.level && { level: body.level }),
        ...(body.key && { key: body.key }),
        ...(body.ultimate_guitar_link !== undefined && {
          ultimate_guitar_link: body.ultimate_guitar_link,
        }),
        ...(body.chords !== undefined && { chords: body.chords }),
        ...(body.short_title !== undefined && { short_title: body.short_title }),
        ...(body.youtube_url !== undefined && { youtube_url: body.youtube_url }),
        ...(body.gallery_images !== undefined && { gallery_images: body.gallery_images }),
      });

      if (result.error) {
        return NextResponse.json(
          {
            error: 'Failed to update song',
            details: result.error.message,
            database: result.isLocal ? 'local' : 'remote',
          },
          { status: result.status || 500 }
        );
      }

      return NextResponse.json({
        song: result.data?.[0] || null,
        meta: {
          database: result.isLocal ? 'local' : 'remote',
          updated: true,
        },
      });
    } catch (error) {
      logger.error('❌ [External API] Song PUT error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiAuth(request, async () => {
    try {
      const { id } = await params;

      if (!id) {
        return NextResponse.json({ error: 'Song ID is required' }, { status: 400 });
      }

      // Soft delete song through unified API (using RPC function)
      const result = await db.rpc.softDeleteSong(id, 'system-user-id'); // You'd get user ID from auth

      if (result.error) {
        return NextResponse.json(
          {
            error: 'Failed to delete song',
            details: result.error.message,
            database: result.isLocal ? 'local' : 'remote',
          },
          { status: result.status || 500 }
        );
      }

      return NextResponse.json({
        message: 'Song deleted successfully',
        meta: {
          database: result.isLocal ? 'local' : 'remote',
          deleted: true,
        },
      });
    } catch (error) {
      logger.error('❌ [External API] Song DELETE error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
