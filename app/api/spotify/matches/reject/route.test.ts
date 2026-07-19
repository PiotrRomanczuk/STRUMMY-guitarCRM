/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { POST } from './route';
import { createClient } from '@/lib/supabase/server';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('next/server', () => ({
  NextRequest: class {
    url: string;
    method: string;
    body: unknown;
    constructor(url: string, init?: { method?: string; body?: unknown }) {
      this.url = url;
      this.method = init?.method || 'GET';
      this.body = init?.body;
    }
    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    }
  },
  NextResponse: {
    json: jest.fn((data, init) => ({ data, init })),
  },
}));

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

describe('POST /api/spotify/matches/reject', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('should return 401 if user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/spotify/matches/reject', {
      method: 'POST',
      body: JSON.stringify({ matchId: 'match-123' }),
    });

    await POST(request);

    expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' }, { status: 401 });
  });

  it('should return 403 if user is not admin or teacher', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockSupabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { is_admin: false, is_teacher: false },
            error: null,
          }),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/spotify/matches/reject', {
      method: 'POST',
      body: JSON.stringify({ matchId: 'match-123' }),
    });

    await POST(request);

    expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Forbidden' }, { status: 403 });
  });

  it('should return 400 if matchId is missing', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockSupabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { is_admin: true, is_teacher: true },
            error: null,
          }),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/spotify/matches/reject', {
      method: 'POST',
      body: JSON.stringify({}), // Missing matchId
    });

    await POST(request);

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'matchId is required' },
      { status: 400 }
    );
  });

  it('should successfully reject a match', async () => {
    const userId = 'user-123';
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    let callCount = 0;
    let capturedUpdate: any;

    mockSupabase.from = jest.fn((_table) => {
      callCount++;
      if (callCount === 1) {
        // user_overview
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { is_admin: true, is_teacher: true },
                error: null,
              }),
            }),
          }),
        };
      } else if (callCount === 2) {
        // profiles (test-account guard)
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { is_development: false },
                error: null,
              }),
            }),
          }),
        };
      } else {
        // spotify_matches UPDATE
        return {
          update: jest.fn((data) => {
            capturedUpdate = data;
            return {
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            };
          }),
        };
      }
    });

    const request = new NextRequest('http://localhost:3000/api/spotify/matches/reject', {
      method: 'POST',
      body: JSON.stringify({ matchId: 'match-123' }),
    });

    await POST(request);

    expect(NextResponse.json).toHaveBeenCalledWith({
      success: true,
      message: 'Match rejected',
    });

    expect(capturedUpdate).toMatchObject({
      status: 'rejected',
      reviewed_by: userId,
    });

    expect(capturedUpdate.reviewed_at).toBeDefined();
  });

  it('should handle database errors gracefully', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    let callCount = 0;
    mockSupabase.from = jest.fn((_table) => {
      callCount++;
      if (callCount === 1) {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { is_admin: true, is_teacher: true },
                error: null,
              }),
            }),
          }),
        };
      } else if (callCount === 2) {
        // profiles (test-account guard)
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { is_development: false },
                error: null,
              }),
            }),
          }),
        };
      } else {
        // Database error on update
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        };
      }
    });

    const request = new NextRequest('http://localhost:3000/api/spotify/matches/reject', {
      method: 'POST',
      body: JSON.stringify({ matchId: 'match-123' }),
    });

    await POST(request);

    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Failed to reject match',
      }),
      { status: 500 }
    );
  });

  it('should allow teacher to reject matches', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'teacher-456' } },
      error: null,
    });

    let callCount = 0;
    mockSupabase.from = jest.fn((_table) => {
      callCount++;
      if (callCount === 1) {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { is_admin: false, is_teacher: true }, // Teacher but not admin
                error: null,
              }),
            }),
          }),
        };
      } else if (callCount === 2) {
        // profiles (test-account guard)
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { is_development: false },
                error: null,
              }),
            }),
          }),
        };
      } else {
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      }
    });

    const request = new NextRequest('http://localhost:3000/api/spotify/matches/reject', {
      method: 'POST',
      body: JSON.stringify({ matchId: 'match-789' }),
    });

    await POST(request);

    expect(NextResponse.json).toHaveBeenCalledWith({
      success: true,
      message: 'Match rejected',
    });
  });

  it('should allow admin to reject matches', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-789' } },
      error: null,
    });

    let callCount = 0;
    mockSupabase.from = jest.fn((_table) => {
      callCount++;
      if (callCount === 1) {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { is_admin: true, is_teacher: false }, // Admin but not teacher
                error: null,
              }),
            }),
          }),
        };
      } else if (callCount === 2) {
        // profiles (test-account guard)
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { is_development: false },
                error: null,
              }),
            }),
          }),
        };
      } else {
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      }
    });

    const request = new NextRequest('http://localhost:3000/api/spotify/matches/reject', {
      method: 'POST',
      body: JSON.stringify({ matchId: 'match-999' }),
    });

    await POST(request);

    expect(NextResponse.json).toHaveBeenCalledWith({
      success: true,
      message: 'Match rejected',
    });
  });

  it('should prevent students from rejecting matches', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'student-111' } },
      error: null,
    });

    mockSupabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { is_admin: false, is_teacher: false }, // Student
            error: null,
          }),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/spotify/matches/reject', {
      method: 'POST',
      body: JSON.stringify({ matchId: 'match-123' }),
    });

    await POST(request);

    expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Forbidden' }, { status: 403 });
  });

  it('should handle malformed JSON gracefully', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockSupabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { is_admin: true, is_teacher: true },
            error: null,
          }),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/spotify/matches/reject', {
      method: 'POST',
      body: 'invalid json{',
    });

    await POST(request);

    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Failed to reject match',
      }),
      { status: 500 }
    );
  });
});
