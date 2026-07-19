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

describe('POST /api/spotify/matches/approve', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('should return 401 if user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/spotify/matches/approve', {
      method: 'POST',
      body: JSON.stringify({ matchId: 'match-123', songId: 'song-456' }),
    });

    await POST(request);

    expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' }, { status: 401 });
  });

  it('should return 403 if user is not admin or teacher', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { is_admin: false, is_teacher: false },
            error: null,
          }),
        }),
      }),
    });

    mockSupabase.from = mockFrom;

    const request = new NextRequest('http://localhost:3000/api/spotify/matches/approve', {
      method: 'POST',
      body: JSON.stringify({ matchId: 'match-123', songId: 'song-456' }),
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

    const request = new NextRequest('http://localhost:3000/api/spotify/matches/approve', {
      method: 'POST',
      body: JSON.stringify({ songId: 'song-456' }), // Missing matchId
    });

    await POST(request);

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'matchId and songId are required' },
      { status: 400 }
    );
  });

  it('should return 400 if songId is missing', async () => {
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

    const request = new NextRequest('http://localhost:3000/api/spotify/matches/approve', {
      method: 'POST',
      body: JSON.stringify({ matchId: 'match-123' }), // Missing songId
    });

    await POST(request);

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'matchId and songId are required' },
      { status: 400 }
    );
  });

  it('should return 404 if match is not found', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    let callCount = 0;
    mockSupabase.from = jest.fn((_table) => {
      callCount++;
      if (callCount === 1) {
        // First call: user_overview
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
        // Second call: profiles (test-account guard)
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
        // Third call: spotify_matches
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        };
      }
    });

    const request = new NextRequest('http://localhost:3000/api/spotify/matches/approve', {
      method: 'POST',
      body: JSON.stringify({ matchId: 'invalid-match', songId: 'song-456' }),
    });

    await POST(request);

    expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Match not found' }, { status: 404 });
  });

  it('should successfully approve match and update song', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const mockMatch = {
      id: 'match-123',
      song_id: 'song-456',
      spotify_url: 'https://open.spotify.com/track/abc123',
      spotify_duration_ms: 180000,
      spotify_release_date: '1975-11-21',
      spotify_artist_name: 'Queen',
      spotify_cover_image_url: 'https://i.scdn.co/image/cover.jpg',
    };

    let callCount = 0;
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
      } else if (callCount === 3) {
        // spotify_matches SELECT
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockMatch,
              error: null,
            }),
          }),
        };
      } else if (callCount === 4) {
        // songs UPDATE
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        };
      } else if (callCount === 5) {
        // spotify_matches UPDATE — reject any previous approved match for the same track
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnThis(),
            neq: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      } else {
        // spotify_matches UPDATE — set this match to approved
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        };
      }
    });

    const request = new NextRequest('http://localhost:3000/api/spotify/matches/approve', {
      method: 'POST',
      body: JSON.stringify({ matchId: 'match-123', songId: 'song-456' }),
    });

    await POST(request);

    expect(NextResponse.json).toHaveBeenCalledWith({
      success: true,
      message: 'Match approved and song updated',
    });

    // Verify songs table was updated
    expect(mockSupabase.from).toHaveBeenCalledWith('songs');

    // Verify spotify_matches table was updated with status
    expect(mockSupabase.from).toHaveBeenCalledWith('spotify_matches');
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
      } else if (callCount === 3) {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'match-123',
                song_id: 'song-456',
                spotify_url: 'https://open.spotify.com/track/abc123',
                spotify_duration_ms: 180000,
                spotify_release_date: '1975-11-21',
              },
              error: null,
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

    const request = new NextRequest('http://localhost:3000/api/spotify/matches/approve', {
      method: 'POST',
      body: JSON.stringify({ matchId: 'match-123', songId: 'song-456' }),
    });

    await POST(request);

    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Failed to approve match',
      }),
      { status: 500 }
    );
  });

  it('should update song with all Spotify fields correctly', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const mockMatch = {
      id: 'match-123',
      song_id: 'song-456',
      spotify_url: 'https://open.spotify.com/track/abc123',
      spotify_duration_ms: 240000,
      spotify_release_date: '1980-05-15',
      spotify_artist_name: 'Test Artist',
      spotify_cover_image_url: 'https://i.scdn.co/image/test.jpg',
    };

    let callCount = 0;
    let capturedUpdate: any;

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
      } else if (callCount === 3) {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockMatch,
              error: null,
            }),
          }),
        };
      } else if (callCount === 4) {
        return {
          update: jest.fn((data) => {
            capturedUpdate = data;
            return {
              eq: jest.fn().mockResolvedValue({ data: null, error: null }),
            };
          }),
        };
      } else if (callCount === 5) {
        // spotify_matches UPDATE — reject any previous approved match for the same track
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnThis(),
            neq: jest.fn().mockResolvedValue({ data: null, error: null }),
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

    const request = new NextRequest('http://localhost:3000/api/spotify/matches/approve', {
      method: 'POST',
      body: JSON.stringify({ matchId: 'match-123', songId: 'song-456' }),
    });

    await POST(request);

    expect(capturedUpdate).toMatchObject({
      spotify_link_url: 'https://open.spotify.com/track/abc123',
      duration_ms: 240000,
      release_year: 1980,
      author: 'Test Artist',
      cover_image_url: 'https://i.scdn.co/image/test.jpg',
    });

    expect(capturedUpdate.updated_at).toBeDefined();
  });

  it('should set reviewed_by and reviewed_at on match', async () => {
    const userId = 'reviewer-789';
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    let callCount = 0;
    let capturedMatchUpdate: any;

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
      } else if (callCount === 3) {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'match-123',
                song_id: 'song-456',
                spotify_url: 'https://open.spotify.com/track/abc123',
                spotify_duration_ms: 180000,
                spotify_release_date: '2020-01-01',
              },
              error: null,
            }),
          }),
        };
      } else if (callCount === 4) {
        // songs UPDATE
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      } else if (callCount === 5) {
        // spotify_matches UPDATE — reject any previous approved match for the same track
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnThis(),
            neq: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      } else {
        return {
          update: jest.fn((data) => {
            capturedMatchUpdate = data;
            return {
              eq: jest.fn().mockResolvedValue({ data: null, error: null }),
            };
          }),
        };
      }
    });

    const request = new NextRequest('http://localhost:3000/api/spotify/matches/approve', {
      method: 'POST',
      body: JSON.stringify({ matchId: 'match-123', songId: 'song-456' }),
    });

    await POST(request);

    expect(capturedMatchUpdate).toMatchObject({
      status: 'approved',
      reviewed_by: userId,
    });

    expect(capturedMatchUpdate.reviewed_at).toBeDefined();
  });
});
