import { GET } from './route';
import { createClient } from '@/lib/supabase/server';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('Admin Users API', () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('returns 401 if not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns 403 if not admin', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user1' } }, error: null });
    // Route checks: profiles.select('is_admin').eq('id', user.id).single()
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { is_admin: false },
            error: null,
          }),
        }),
      }),
    });

    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('returns users list if admin', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin1' } },
      error: null,
    });

    let callCount = 0;
    mockSupabase.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First call: profiles.select('is_admin').eq('id', user.id).single()
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { is_admin: true },
                error: null,
              }),
            }),
          }),
        };
      }
      // Second call: profiles.select('id, full_name, ...').order('full_name')
      return {
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'u1',
                full_name: 'User 1',
                is_admin: false,
                is_teacher: false,
                is_student: true,
              },
            ],
            error: null,
          }),
        }),
      };
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.users).toHaveLength(1);
    expect(data.users[0].is_student).toBe(true);
  });

  it('handles database error fetching users', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin1' } },
      error: null,
    });

    let callCount = 0;
    mockSupabase.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { is_admin: true },
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'DB Error' },
          }),
        }),
      };
    });

    const res = await GET();
    expect(res.status).toBe(500);
  });
});
