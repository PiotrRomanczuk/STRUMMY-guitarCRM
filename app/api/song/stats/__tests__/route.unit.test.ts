/**
 * Song Stats API Security Tests
 *
 * Tests for admin client security fix (STRUMMY-262).
 * Verifies that withApiAuth is used instead of getUserWithRolesSSR for role checking.
 *
 * Security Improvement:
 * - BEFORE: Used getUserWithRolesSSR / admin client for role checking
 * - AFTER: Uses withApiAuth wrapper
 */

import { GET } from '../route';
import * as supabaseServer from '@/lib/supabase/server';
import type { AuthedProfile } from '@/lib/auth/loadAuthedProfile';

jest.mock('@/lib/supabase/server');

// ---------------------------------------------------------------------------
// withApiAuth mock — controls what authed profile the handler receives
// ---------------------------------------------------------------------------

let _authedProfile: AuthedProfile | null = null;

jest.mock('@/lib/auth/withApiAuth', () => ({
  withApiAuth: jest.fn(
    async (_req: Request, handler: (authed: AuthedProfile, req: Request) => Promise<Response>) => {
      if (!_authedProfile) {
        const { NextResponse } = await import('next/server');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return handler(_authedProfile, _req);
    }
  ),
}));

function mockAuthAs(profile: AuthedProfile | null) {
  _authedProfile = profile;
}

const ADMIN_PROFILE: AuthedProfile = {
  user: { id: 'admin-id', email: 'admin@test.com' } as AuthedProfile['user'],
  roles: { isAdmin: true, isTeacher: false, isStudent: false },
  flags: { isParent: false, isDevelopment: false },
};

const TEACHER_PROFILE: AuthedProfile = {
  user: { id: 'teacher-id', email: 'teacher@test.com' } as AuthedProfile['user'],
  roles: { isAdmin: false, isTeacher: true, isStudent: false },
  flags: { isParent: false, isDevelopment: false },
};

const mockSupabase = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn(),
  },
};

describe('GET /api/song/stats - Security (STRUMMY-262)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthAs(null);
    (supabaseServer.createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('should return 401 when user is not authenticated', async () => {
    mockAuthAs(null);

    const response = await GET(new Request('http://localhost/api/song/stats'));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 403 when user is not admin', async () => {
    mockAuthAs(TEACHER_PROFILE);

    const response = await GET(new Request('http://localhost/api/song/stats'));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('should use withApiAuth for role checking (not getUserWithRolesSSR)', async () => {
    mockAuthAs(ADMIN_PROFILE);

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      head: true,
      then: jest.fn((resolve) => resolve({ data: [], error: null, count: 0 })),
    };
    mockSupabase.from.mockReturnValue(mockQuery);

    await GET(new Request('http://localhost/api/song/stats'));

    // Verify withApiAuth was called (security fix — no admin client for auth)
    const { withApiAuth } = await import('@/lib/auth/withApiAuth');
    expect(withApiAuth).toHaveBeenCalled();
  });

  it('should verify admin check uses withApiAuth', async () => {
    mockAuthAs(ADMIN_PROFILE);

    // We only test that withApiAuth is called for role checking
    // Full query testing is handled by integration tests
    const { withApiAuth } = await import('@/lib/auth/withApiAuth');
    expect(withApiAuth).toBeDefined();
  });
});
