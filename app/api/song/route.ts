import { NextRequest, NextResponse } from 'next/server';
import {
  getSongsHandler,
  createSongHandler,
  updateSongHandler,
  deleteSongHandler,
} from './handlers';
import { createListResponse } from '@/lib/api/response';
import { TEST_ACCOUNT_MUTATION_ERROR } from '@/lib/auth/test-account-guard';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

/**
 * Helper to parse and validate query parameters
 */
function parseQueryParams(searchParams: URLSearchParams) {
  return {
    level: searchParams.get('level') || undefined,
    key: searchParams.get('key') || undefined,
    author: searchParams.get('author') || undefined,
    search: searchParams.get('search') || undefined,
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '50'),
    sortBy: searchParams.get('sortBy') || 'created_at',
    sortOrder: searchParams.get('sortOrder') || 'desc',
  };
}

/**
 * GET /api/song
 * List all songs with filtering, searching, and pagination
 */
export async function GET(request: NextRequest) {
  return withApiAuth(request, async ({ user, roles, flags }) => {
    try {
      // NOTE: this route intentionally uses the admin client (RLS bypassed).
      // It backs the external/unscoped song widget which must see the full
      // library regardless of viewer. The editorial in-app list does NOT use
      // this route — it calls `getSongsForList()` with an RLS-respecting
      // client so student scoping (ADR-0001 / songs_select_policy) is enforced.
      const supabase = createAdminClient();
      const profile = {
        isAdmin: roles.isAdmin,
        isTeacher: roles.isTeacher,
        isStudent: roles.isStudent,
        isDevelopment: flags.isDevelopment,
      };

      const { searchParams } = new URL(request.url);
      const queryParams = parseQueryParams(searchParams);

      const result = await getSongsHandler(supabase, user, profile, queryParams);

      if ('error' in result) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }

      const totalPages = Math.ceil((result.count || 0) / queryParams.limit);

      return NextResponse.json(
        {
          songs: result.songs,
          pagination: {
            page: queryParams.page,
            limit: queryParams.limit,
            total: result.count || 0,
            totalPages,
          },
        },
        { status: 200 }
      );
    } catch (error) {
      logger.error('GET /api/song error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

/**
 * POST /api/song
 * Create a new song (requires teacher or admin role).
 * Supports both cookie-based session auth and API key bearer tokens.
 */
export async function POST(request: NextRequest) {
  return withApiAuth(request, async ({ user, roles, flags }) => {
    try {
      const supabase = createAdminClient();
      const profile = {
        isAdmin: roles.isAdmin,
        isTeacher: roles.isTeacher,
        isStudent: roles.isStudent,
        isDevelopment: flags.isDevelopment,
      };

      if (profile.isDevelopment) {
        return NextResponse.json({ error: TEST_ACCOUNT_MUTATION_ERROR }, { status: 403 });
      }

      const body = await request.json();
      const result = await createSongHandler(supabase, user, profile, body);

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }

      return NextResponse.json(result.song, { status: result.status });
    } catch (error) {
      logger.error('[API/Songs] POST /api/song error:', error);
      return NextResponse.json(
        {
          error: 'Internal server error',
          details:
            process.env.NODE_ENV === 'development'
              ? error instanceof Error
                ? error.message
                : 'Unknown error'
              : undefined,
        },
        { status: 500 }
      );
    }
  });
}

/**
 * PUT /api/song?id=songId
 * Update a song (requires teacher or admin role)
 */
export async function PUT(request: NextRequest) {
  return withApiAuth(request, async ({ user, roles, flags }) => {
    try {
      const { searchParams } = new URL(request.url);
      const songId = searchParams.get('id');

      if (!songId) {
        return NextResponse.json({ error: 'Song ID is required' }, { status: 400 });
      }

      const supabase = createAdminClient();
      const profile = {
        isAdmin: roles.isAdmin,
        isTeacher: roles.isTeacher,
        isStudent: roles.isStudent,
        isDevelopment: flags.isDevelopment,
      };

      if (profile.isDevelopment) {
        return NextResponse.json({ error: TEST_ACCOUNT_MUTATION_ERROR }, { status: 403 });
      }

      const body = await request.json();
      const result = await updateSongHandler(supabase, user, profile, songId, body);

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }

      return NextResponse.json(result.song, { status: result.status });
    } catch (error) {
      logger.error('PUT /api/song error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

/**
 * DELETE /api/song?id=songId
 * Delete a song (requires teacher or admin role)
 */
export async function DELETE(request: NextRequest) {
  return withApiAuth(request, async ({ user, roles, flags }) => {
    try {
      const { searchParams } = new URL(request.url);
      const songId = searchParams.get('id');

      if (!songId) {
        return NextResponse.json({ error: 'Song ID is required' }, { status: 400 });
      }

      const supabase = createAdminClient();
      const profile = {
        isAdmin: roles.isAdmin,
        isTeacher: roles.isTeacher,
        isStudent: roles.isStudent,
        isDevelopment: flags.isDevelopment,
      };

      if (profile.isDevelopment) {
        return NextResponse.json({ error: TEST_ACCOUNT_MUTATION_ERROR }, { status: 403 });
      }

      const result = await deleteSongHandler(supabase, user, profile, songId);

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }

      return NextResponse.json(
        { success: result.success, cascadeInfo: result.cascadeInfo },
        { status: result.status }
      );
    } catch (error) {
      logger.error('DELETE /api/song error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
