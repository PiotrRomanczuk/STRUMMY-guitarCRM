/**
 * @jest-environment node
 */

import { GET } from './route';
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server');
jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const ADMIN_ID = 'aaaaaaaa-1111-4111-8111-111111111111';

interface RowResponse<T> {
  data: T;
  error: null | { message: string };
}

function buildClient(opts: {
  user?: { id: string } | null;
  rolesRow?: RowResponse<{ is_admin: boolean; is_teacher: boolean } | null>;
  profilesList?: RowResponse<unknown[]>;
}) {
  const fromCalls: string[] = [];
  let call = 0;

  const fromMock = jest.fn((table: string) => {
    fromCalls.push(table);
    const idx = call++;

    if (idx === 0) {
      // role lookup: .from('profiles').select(...).eq('id', uid).single()
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve(opts.rolesRow ?? { data: null, error: null })),
          })),
        })),
      };
    }

    // list: .from('profiles').select(...).order(...)
    return {
      select: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve(opts.profilesList ?? { data: [], error: null })),
      })),
    };
  });

  return {
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: opts.user ?? null } })),
    },
    from: fromMock,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/profiles', () => {
  it('returns 401 when not authenticated', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildClient({ user: null }));
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns 403 for a non-admin / non-teacher caller', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildClient({
        user: { id: ADMIN_ID },
        rolesRow: {
          data: { is_admin: false, is_teacher: false },
          error: null,
        },
      })
    );
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('returns the list when caller is admin', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildClient({
        user: { id: ADMIN_ID },
        rolesRow: { data: { is_admin: true, is_teacher: false }, error: null },
        profilesList: {
          data: [
            { id: 'p1', email: 'real@example.com', is_shadow: false },
            { id: 'p2', email: 'real2@example.com', is_shadow: false },
          ],
          error: null,
        },
      })
    );
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0].email).toBe('real@example.com');
  });

  it('masks shadow placeholder emails to null in the list', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildClient({
        user: { id: ADMIN_ID },
        rolesRow: { data: { is_admin: true, is_teacher: true }, error: null },
        profilesList: {
          data: [
            { id: 'r1', email: 'real@example.com', is_shadow: false },
            {
              id: 's1',
              email: 'shadow_a1b2c3d4-e5f6-7890-abcd-ef1234567890@placeholder.com',
              is_shadow: true,
            },
          ],
          error: null,
        },
      })
    );
    const res = await GET();
    const body = await res.json();
    expect(body[0].email).toBe('real@example.com');
    expect(body[1].email).toBeNull();
    expect(JSON.stringify(body)).not.toContain('@placeholder.com');
  });

  it('returns 500 when the database list call fails', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildClient({
        user: { id: ADMIN_ID },
        rolesRow: { data: { is_admin: true, is_teacher: false }, error: null },
        profilesList: { data: [], error: { message: 'rls denied' } },
      })
    );
    const res = await GET();
    expect(res.status).toBe(500);
  });
});
