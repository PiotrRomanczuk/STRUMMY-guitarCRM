/**
 * @jest-environment node
 */

import { GET } from './route';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/getUserWithRolesSSR');
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const ADMIN_ID = 'aaaaaaaa-1111-4111-8111-111111111111';
const TARGET_ID = 'aaaaaaaa-2222-4222-8222-222222222222';

interface RowResponse<T> {
  data: T;
  error: null | { message: string };
}

function mockProfileRow(row: RowResponse<unknown>) {
  (createClient as jest.Mock).mockResolvedValue({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve(row)),
        })),
      })),
    })),
  });
}

function mockRoles(opts: { user: { id: string } | null; isAdmin: boolean }) {
  (getUserWithRolesSSR as jest.Mock).mockResolvedValue({
    user: opts.user,
    isAdmin: opts.isAdmin,
    isTeacher: false,
    isStudent: false,
    isDevelopment: false,
  });
}

function makeRequest(): Request {
  return new Request(`http://localhost/api/users/${TARGET_ID}`);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/users/[id]', () => {
  it('returns 401 when caller is not authenticated', async () => {
    mockRoles({ user: null, isAdmin: false });
    const res = await GET(makeRequest(), {
      params: Promise.resolve({ id: TARGET_ID }),
    });
    expect(res.status).toBe(401);
  });

  it('returns 401 when caller is authenticated but not admin', async () => {
    mockRoles({ user: { id: ADMIN_ID }, isAdmin: false });
    const res = await GET(makeRequest(), {
      params: Promise.resolve({ id: TARGET_ID }),
    });
    expect(res.status).toBe(401);
  });

  it('returns 404 when the target profile does not exist', async () => {
    mockRoles({ user: { id: ADMIN_ID }, isAdmin: true });
    mockProfileRow({ data: null, error: { message: 'not found' } });
    const res = await GET(makeRequest(), {
      params: Promise.resolve({ id: TARGET_ID }),
    });
    expect(res.status).toBe(404);
  });

  it('returns the profile with email intact for non-shadow users', async () => {
    mockRoles({ user: { id: ADMIN_ID }, isAdmin: true });
    mockProfileRow({
      data: {
        id: TARGET_ID,
        email: 'real@example.com',
        full_name: 'Real Person',
        is_shadow: false,
      },
      error: null,
    });
    const res = await GET(makeRequest(), {
      params: Promise.resolve({ id: TARGET_ID }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email).toBe('real@example.com');
  });

  it('masks the shadow placeholder email to null', async () => {
    mockRoles({ user: { id: ADMIN_ID }, isAdmin: true });
    mockProfileRow({
      data: {
        id: TARGET_ID,
        email: 'shadow_a1b2c3d4-e5f6-7890-abcd-ef1234567890@placeholder.com',
        full_name: 'Shadow Student',
        is_shadow: true,
      },
      error: null,
    });
    const res = await GET(makeRequest(), {
      params: Promise.resolve({ id: TARGET_ID }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email).toBeNull();
    expect(JSON.stringify(body)).not.toContain('@placeholder.com');
  });
});
