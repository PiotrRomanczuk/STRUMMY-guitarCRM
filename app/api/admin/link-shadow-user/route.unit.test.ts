/**
 * @jest-environment node
 */

import { POST } from './route';
import { createAdminClient } from '@/lib/supabase/admin';
import type { AuthedProfile } from '@/lib/auth/loadAuthedProfile';

jest.mock('@/lib/supabase/admin');
jest.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));
jest.mock('@sentry/nextjs', () => ({
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

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

// ---------------------------------------------------------------------------
// Constants (must be valid UUID v4 for Zod validation)
// ---------------------------------------------------------------------------

const SHADOW_ID = '45085573-07bc-475b-b8f2-baeae18ffb4e';
const REAL_USER_ID = '69590a6f-5873-428b-8e37-9c1306f26757';
const ADMIN_ID = '8f842809-facd-4de4-9b8d-4de8444b145a';

const ADMIN_PROFILE: AuthedProfile = {
  user: { id: ADMIN_ID, email: 'admin@test.com' } as AuthedProfile['user'],
  roles: { isAdmin: true, isTeacher: false, isStudent: false },
  flags: { isParent: false, isDevelopment: false },
};

const TEACHER_PROFILE: AuthedProfile = {
  user: { id: ADMIN_ID, email: 'teacher@test.com' } as AuthedProfile['user'],
  roles: { isAdmin: false, isTeacher: true, isStudent: false },
  flags: { isParent: false, isDevelopment: false },
};

const STUDENT_PROFILE: AuthedProfile = {
  user: { id: ADMIN_ID, email: 'student@test.com' } as AuthedProfile['user'],
  roles: { isAdmin: false, isTeacher: false, isStudent: true },
  flags: { isParent: false, isDevelopment: false },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost:3000/api/admin/link-shadow-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * Build a properly chained Supabase query mock.
 * Terminal methods (single, maybeSingle) return promises.
 * The chain itself is also thenable for direct await.
 */
function buildQueryChain(finalResult: {
  data?: unknown;
  error?: { message: string } | null;
  count?: number | null;
}) {
  const resolved = Promise.resolve(finalResult);

  const chain = (): Record<
    string,
    jest.Mock | ((resolve: (v: unknown) => void, reject: (e: unknown) => void) => Promise<void>)
  > => ({
    select: jest.fn(() => chain()),
    insert: jest.fn(() => chain()),
    update: jest.fn(() => chain()),
    delete: jest.fn(() => chain()),
    eq: jest.fn(() => chain()),
    is: jest.fn(() => chain()),
    in: jest.fn(() => chain()),
    single: jest.fn(() => resolved),
    maybeSingle: jest.fn(() => resolved),
    then: (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
      resolved.then(resolve, reject),
  });

  return chain();
}

/**
 * Create a mock supabase client where from() returns different chains
 * based on call order.
 */
function createMockSupabase(
  fromResponses: Array<{
    data?: unknown;
    error?: { message: string } | null;
    count?: number | null;
  }>,
  authAdminMock?: { getUserById: jest.Mock },
  rpcResult?: { data?: unknown; error?: { message: string } | null }
) {
  let callIndex = 0;

  return {
    from: jest.fn(() => {
      const idx = callIndex;
      callIndex++;
      const response = fromResponses[idx] ?? fromResponses[fromResponses.length - 1];
      return buildQueryChain(response);
    }),
    rpc: jest.fn().mockResolvedValue(rpcResult ?? { data: {}, error: null }),
    auth: {
      admin: authAdminMock ?? {
        getUserById: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'not configured' },
        }),
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/admin/link-shadow-user', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthAs(null);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthAs(null);

    const res = await POST(
      makeRequest({
        shadowProfileId: SHADOW_ID,
        realUserId: REAL_USER_ID,
      })
    );

    expect(res.status).toBe(401);
  });

  it('returns 403 when caller is not admin or teacher', async () => {
    mockAuthAs(STUDENT_PROFILE);

    // No DB calls needed — role check is in withApiAuth layer
    (createAdminClient as jest.Mock).mockReturnValue(createMockSupabase([]));

    const res = await POST(
      makeRequest({
        shadowProfileId: SHADOW_ID,
        realUserId: REAL_USER_ID,
      })
    );

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Forbidden');
  });

  it('returns 400 for invalid body (missing fields)', async () => {
    mockAuthAs(ADMIN_PROFILE);

    (createAdminClient as jest.Mock).mockReturnValue(createMockSupabase([]));

    const res = await POST(makeRequest({ shadowProfileId: 'not-a-uuid' }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Validation failed');
  });

  it('returns 400 for non-JSON body', async () => {
    mockAuthAs(ADMIN_PROFILE);

    (createAdminClient as jest.Mock).mockReturnValue(createMockSupabase([]));

    const req = new Request('http://localhost:3000/api/admin/link-shadow-user', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'not json',
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid JSON body');
  });

  it('returns 404 when shadow profile does not exist', async () => {
    mockAuthAs(ADMIN_PROFILE);

    const mock = createMockSupabase([
      // shadow profile lookup - not found
      { data: null, error: { message: 'not found' } },
    ]);
    (createAdminClient as jest.Mock).mockReturnValue(mock);

    const res = await POST(
      makeRequest({
        shadowProfileId: SHADOW_ID,
        realUserId: REAL_USER_ID,
      })
    );

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Shadow profile not found');
  });

  it('returns 400 when profile is not a shadow', async () => {
    mockAuthAs(ADMIN_PROFILE);

    const mock = createMockSupabase([
      {
        data: { id: SHADOW_ID, email: 'test@test.com', full_name: 'Test', is_shadow: false },
        error: null,
      },
    ]);
    (createAdminClient as jest.Mock).mockReturnValue(mock);

    const res = await POST(
      makeRequest({
        shadowProfileId: SHADOW_ID,
        realUserId: REAL_USER_ID,
      })
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Profile is not a shadow profile');
  });

  it('returns 404 when real user not found in auth.users', async () => {
    mockAuthAs(ADMIN_PROFILE);

    const mock = createMockSupabase(
      [
        {
          data: {
            id: SHADOW_ID,
            email: 'shadow@placeholder.com',
            full_name: 'Shadow',
            is_shadow: true,
          },
          error: null,
        },
      ],
      {
        getUserById: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'User not found' },
        }),
      }
    );
    (createAdminClient as jest.Mock).mockReturnValue(mock);

    const res = await POST(
      makeRequest({
        shadowProfileId: SHADOW_ID,
        realUserId: REAL_USER_ID,
      })
    );

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Real user not found in auth.users');
  });

  it('returns 409 when real user already has a profile', async () => {
    mockAuthAs(ADMIN_PROFILE);

    const mock = createMockSupabase(
      [
        {
          data: {
            id: SHADOW_ID,
            email: 'shadow@placeholder.com',
            full_name: 'Shadow',
            is_shadow: true,
          },
          error: null,
        },
        { data: { id: REAL_USER_ID }, error: null },
      ],
      {
        getUserById: jest.fn().mockResolvedValue({
          data: { user: { id: REAL_USER_ID, email: 'real@test.com' } },
          error: null,
        }),
      }
    );
    (createAdminClient as jest.Mock).mockReturnValue(mock);

    const res = await POST(
      makeRequest({
        shadowProfileId: SHADOW_ID,
        realUserId: REAL_USER_ID,
      })
    );

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe('Real user already has a profile. Cannot link.');
  });

  it('returns 200 and transfers references on success', async () => {
    mockAuthAs(ADMIN_PROFILE);

    const newProfile = {
      id: REAL_USER_ID,
      email: 'real@test.com',
      full_name: 'Shadow Student',
      is_shadow: false,
      is_student: true,
    };

    const mock = createMockSupabase(
      [
        {
          data: {
            id: SHADOW_ID,
            email: 'shadow@placeholder.com',
            full_name: 'Shadow Student',
            is_shadow: true,
          },
          error: null,
        },
        { data: null, error: null },
        { data: newProfile, error: null },
        { data: null, error: null, count: 2 },
      ],
      {
        getUserById: jest.fn().mockResolvedValue({
          data: { user: { id: REAL_USER_ID, email: 'real@test.com' } },
          error: null,
        }),
      }
    );
    (createAdminClient as jest.Mock).mockReturnValue(mock);

    const res = await POST(
      makeRequest({
        shadowProfileId: SHADOW_ID,
        realUserId: REAL_USER_ID,
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.profile).toBeDefined();
    expect(body.profile.id).toBe(REAL_USER_ID);
    expect(body.profile.is_shadow).toBe(false);
    expect(body.transferred).toBeDefined();
  });

  it('allows teachers (not just admins) to link shadow users', async () => {
    mockAuthAs(TEACHER_PROFILE);

    const newProfile = {
      id: REAL_USER_ID,
      email: 'real@test.com',
      full_name: 'Student',
      is_shadow: false,
      is_student: true,
    };

    const mock = createMockSupabase(
      [
        {
          data: {
            id: SHADOW_ID,
            email: 'shadow@placeholder.com',
            full_name: 'Student',
            is_shadow: true,
          },
          error: null,
        },
        { data: null, error: null },
        { data: newProfile, error: null },
        { data: null, error: null, count: 0 },
      ],
      {
        getUserById: jest.fn().mockResolvedValue({
          data: { user: { id: REAL_USER_ID, email: 'real@test.com' } },
          error: null,
        }),
      }
    );
    (createAdminClient as jest.Mock).mockReturnValue(mock);

    const res = await POST(
      makeRequest({
        shadowProfileId: SHADOW_ID,
        realUserId: REAL_USER_ID,
      })
    );

    expect(res.status).toBe(200);
  });
});
