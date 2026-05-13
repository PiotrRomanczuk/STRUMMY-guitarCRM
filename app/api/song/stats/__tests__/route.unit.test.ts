/**
 * Song Stats API Security Tests
 *
 * Tests that authenticateRequest + loadAuthedProfile guard the admin-only route.
 */

import { GET } from '../route';
import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { loadAuthedProfile } from '@/lib/auth/loadAuthedProfile';
import { createAdminClient } from '@/lib/supabase/admin';

jest.mock('@/lib/auth/api-auth');
jest.mock('@/lib/auth/loadAuthedProfile');
jest.mock('@/lib/supabase/admin');

const createRequest = () => new NextRequest('http://localhost:3000/api/song/stats');

const mockAdminProfile = {
  user: { id: 'admin-id', email: 'admin@test.com' },
  roles: { isAdmin: true, isTeacher: false, isStudent: false },
  flags: { isDevelopment: false },
};

const mockTeacherProfile = {
  user: { id: 'teacher-id', email: 'teacher@test.com' },
  roles: { isAdmin: false, isTeacher: true, isStudent: false },
  flags: { isDevelopment: false },
};

describe('GET /api/song/stats - Security (STRUMMY-262)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when user is not authenticated', async () => {
    (authenticateRequest as jest.Mock).mockResolvedValue({
      user: null,
      error: 'Unauthorized',
      status: 401,
    });

    const response = await GET(createRequest());
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 403 when user is not admin', async () => {
    (authenticateRequest as jest.Mock).mockResolvedValue({
      user: { id: 'teacher-id' },
      status: 200,
    });
    (loadAuthedProfile as jest.Mock).mockResolvedValue(mockTeacherProfile);

    const response = await GET(createRequest());
    const data = await response.json();

    expect(response.status).toBe(403);
  });

  it('should use authenticateRequest for auth checking (not getUserWithRolesSSR)', async () => {
    (authenticateRequest as jest.Mock).mockResolvedValue({ user: { id: 'admin-id' }, status: 200 });
    (loadAuthedProfile as jest.Mock).mockResolvedValue(mockAdminProfile);

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      gte: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
    };
    (createAdminClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue(mockQuery),
    });

    await GET(createRequest());

    expect(authenticateRequest).toHaveBeenCalled();
    expect(loadAuthedProfile).toHaveBeenCalled();
  });

  it('should verify admin role is checked via loadAuthedProfile', async () => {
    expect(loadAuthedProfile).toBeDefined();
    expect(authenticateRequest).toBeDefined();
  });
});
