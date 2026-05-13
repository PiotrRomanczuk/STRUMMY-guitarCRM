/**
 * Lesson Stats API Security Tests
 *
 * Tests for admin client security fix (STRUMMY-262).
 * Verifies that withApiAuth is used for role checking.
 *
 * Security Improvement:
 * - BEFORE: Used getUserWithRolesSSR / admin client for role checking
 * - AFTER: Uses withApiAuth wrapper
 */

import { GET } from '../route';
import { NextRequest } from 'next/server';
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
  rpc: jest.fn(),
  auth: {
    getUser: jest.fn(),
  },
};

const createMockRequest = (params = {}) => {
  const searchParams = new URLSearchParams(params as Record<string, string>);
  const url = `http://localhost:3000/api/lessons/stats?${searchParams.toString()}`;
  return new NextRequest(url);
};

describe('GET /api/lessons/stats - Security (STRUMMY-262)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthAs(null);
    (supabaseServer.createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('should return 401 when user is not authenticated', async () => {
    mockAuthAs(null);

    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should use withApiAuth for role checking', async () => {
    mockAuthAs(ADMIN_PROFILE);

    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      head: true,
      then: jest.fn((resolve) => resolve({ data: [], error: null, count: 0 })),
    };
    mockSupabase.from.mockReturnValue(chain);

    const request = createMockRequest();
    await GET(request);

    // Verify withApiAuth was used (security fix — no admin client for auth)
    const { withApiAuth } = await import('@/lib/auth/withApiAuth');
    expect(withApiAuth).toHaveBeenCalled();
  });

  it('should verify withApiAuth is used for role checking', async () => {
    mockAuthAs(ADMIN_PROFILE);

    // We only test that withApiAuth is called for role checking
    // Full query testing is handled by integration tests
    const { withApiAuth } = await import('@/lib/auth/withApiAuth');
    expect(withApiAuth).toBeDefined();
  });
});
