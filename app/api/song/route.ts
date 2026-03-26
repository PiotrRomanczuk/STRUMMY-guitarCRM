import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types.generated';
import { getSupabaseConfig } from '@/lib/supabase/config';
import {
  getSongsHandler,
  createSongHandler,
  updateSongHandler,
  deleteSongHandler,
} from './handlers';
import { TEST_ACCOUNT_MUTATION_ERROR } from '@/lib/auth/test-account-guard';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

type SupabaseServerClient = SupabaseClient<Database>;

/**
 * Helper to get or create user profile
 */
async function getOrCreateProfile(supabase: SupabaseServerClient, userId: string, email: string) {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin, is_teacher, is_student, is_development')
    .eq('id', userId)
    .single();

  // If no profile exists, create one with default values
  if (profileError?.code === 'PGRST116') {
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        is_admin: false,
        is_student: true,
        is_teacher: false,
      })
      .select('is_admin, is_teacher, is_student, is_development')
      .single();

    if (createError) {
      logger.error('Error creating profile:', createError);
      return null;
    }

    return {
      isAdmin: newProfile.is_admin,
      isTeacher: newProfile.is_teacher,
      isStudent: newProfile.is_student,
      isDevelopment: newProfile.is_development ?? false,
    };
  }

  if (profileError) {
    logger.error('Error fetching profile:', profileError);
    // Return a default profile for now to unblock testing
    return { isAdmin: false, isTeacher: false, isStudent: true, isDevelopment: false };
  }

  return {
    isAdmin: profile.is_admin,
    isTeacher: profile.is_teacher,
    isStudent: profile.is_student,
    isDevelopment: profile.is_development ?? false,
  };
}

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
  try {
    const cookieStore = await cookies();
    const config = getSupabaseConfig();
    const supabase = createServerClient<Database>(config.url, config.anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored
          }
        },
      },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getOrCreateProfile(supabase, user.id, user.email || '');
    if (!profile) {
      return NextResponse.json({ error: 'Error creating user profile' }, { status: 500 });
    }

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
}

/**
 * POST /api/song
 * Create a new song (requires teacher or admin role).
 * Supports both cookie-based session auth and API key bearer tokens.
 */
export async function POST(request: NextRequest) {
  try {
    const hasAuthHeader = !!request.headers.get('Authorization');

    let user;
    let supabase;
    let profile;

    if (hasAuthHeader) {
      // API key / bearer token path
      const auth = await authenticateRequest(request);
      if (!auth.user) {
        return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
      }
      user = auth.user;
      supabase = createAdminClient();

      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_admin, is_teacher, is_student, is_development')
        .eq('id', user.id)
        .single();

      if (!profileData) {
        return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
      }

      profile = {
        isAdmin: profileData.is_admin,
        isTeacher: profileData.is_teacher,
        isStudent: profileData.is_student,
        isDevelopment: profileData.is_development ?? false,
      };
    } else {
      // Cookie-based auth path (original behavior)
      const cookieStore = await cookies();

      let config;
      try {
        config = getSupabaseConfig();
      } catch (configError) {
        logger.error('[API/Songs] Supabase config error:', configError);
        return NextResponse.json({ error: 'Database configuration error' }, { status: 500 });
      }

      supabase = createServerClient<Database>(config.url, config.anonKey, {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignored
            }
          },
        },
      });

      const {
        data: { user: cookieUser },
      } = await supabase.auth.getUser();

      if (!cookieUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      user = cookieUser;
      profile = await getOrCreateProfile(supabase, user.id, user.email || '');

      if (!profile) {
        return NextResponse.json({ error: 'Error creating user profile' }, { status: 500 });
      }
    }

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
}

/**
 * PUT /api/song?id=songId
 * Update a song (requires teacher or admin role)
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const songId = searchParams.get('id');

    if (!songId) {
      return NextResponse.json({ error: 'Song ID is required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const config = getSupabaseConfig();
    const supabase = createServerClient<Database>(config.url, config.anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored
          }
        },
      },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getOrCreateProfile(supabase, user.id, user.email || '');
    if (!profile) {
      return NextResponse.json({ error: 'Error creating user profile' }, { status: 500 });
    }

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
}

/**
 * DELETE /api/song?id=songId
 * Delete a song (requires teacher or admin role)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const songId = searchParams.get('id');

    if (!songId) {
      return NextResponse.json({ error: 'Song ID is required' }, { status: 400 });
    }

    const cookieStore = await cookies();

    const config = getSupabaseConfig();
    const supabase = createServerClient<Database>(config.url, config.anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored
          }
        },
      },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getOrCreateProfile(supabase, user.id, user.email || '');

    if (!profile) {
      return NextResponse.json({ error: 'Error creating user profile' }, { status: 500 });
    }

    if (profile.isDevelopment) {
      return NextResponse.json({ error: TEST_ACCOUNT_MUTATION_ERROR }, { status: 403 });
    }

    const result = await deleteSongHandler(supabase, user, profile, songId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(
      {
        success: result.success,
        cascadeInfo: result.cascadeInfo,
      },
      { status: result.status }
    );
  } catch (error) {
    logger.error('DELETE /api/song error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
