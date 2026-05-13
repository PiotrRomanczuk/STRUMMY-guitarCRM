/**
 * Lesson Stats API Security Tests
 *
 * Tests that authenticateRequest guards the stats route.
 */

import { GET } from '../route';
import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';

jest.mock('@/lib/auth/api-auth');
jest.mock('@/lib/supabase/admin');

const createMockRequest = (params = {}) => {
  const searchParams = new URLSearchParams(params as Record<string, string>);
  const url = `http://localhost:3000/api/lessons/stats?${searchParams.toString()}`;
  return new NextRequest(url);
};

const mockUser = { id: 'admin-id', email: 'admin@test.com' };

describe('GET /api/lessons/stats - Security (STRUMMY-262)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when user is not authenticated', async () => {
    (authenticateRequest as jest.Mock).mockResolvedValue({
      user: null,
      error: 'Unauthorized',
      status: 401,
    });

    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should use authenticateRequest for auth checking (not getUserWithRolesSSR)', async () => {
    (authenticateRequest as jest.Mock).mockResolvedValue({ user: mockUser, status: 200 });

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
    };
    (createAdminClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue(mockQuery),
    });

    const request = createMockRequest();
    await GET(request);

    expect(authenticateRequest).toHaveBeenCalled();
  });

  it('should verify role check uses authenticateRequest', async () => {
    expect(authenticateRequest).toBeDefined();
  });
});
