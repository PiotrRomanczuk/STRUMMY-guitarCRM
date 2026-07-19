/**
 * @jest-environment node
 */
import { GET } from './route';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resetCircuitBreaker, clearTokenCache } from '@/lib/spotify';

// Mock global fetch
global.fetch = jest.fn();

// Route requires an authenticated user (calls cookies() via createClient()),
// so createClient() must be mocked — otherwise cookies() throws outside a
// Next.js request scope.
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

const originalEnv = process.env;

describe('Spotify Search API', () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resetCircuitBreaker();
    clearTokenCache();
    process.env = {
      ...originalEnv,
      SPOTIFY_CLIENT_ID: 'test-client-id',
      SPOTIFY_CLIENT_SECRET: 'test-client-secret',
    };
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return 401 if user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = new NextRequest('http://localhost:3000/api/spotify/search?q=Wonderwall');
    const response = await GET(req);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 if no query is provided', async () => {
    const req = new NextRequest('http://localhost:3000/api/spotify/search');
    const response = await GET(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Query parameter "q" is required');
  });

  it('should return mapped tracks', async () => {
    const mockTokenResponse = {
      access_token: 'mock-token',
      token_type: 'Bearer',
      expires_in: 3600,
    };

    const mockSearchResponse = {
      tracks: {
        items: [
          {
            id: 'track1',
            name: 'Wonderwall',
            artists: [{ name: 'Oasis' }],
            album: {
              name: "(What's The Story) Morning Glory?",
              release_date: '1995-10-02',
              images: [{ url: 'image-url' }],
            },
            external_urls: { spotify: 'spotify-url' },
            duration_ms: 258000,
          },
        ],
      },
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResponse,
      });

    const req = new NextRequest('http://localhost:3000/api/spotify/search?q=Wonderwall');
    const response = await GET(req);

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.results).toHaveLength(1);
    expect(data.results[0]).toEqual({
      id: 'track1',
      name: 'Wonderwall',
      artist: 'Oasis',
      album: "(What's The Story) Morning Glory?",
      url: 'spotify-url',
      coverUrl: 'image-url',
      duration_ms: 258000,
      release_date: '1995-10-02',
    });
  });

  it('should handle Spotify API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Spotify API Error'));

    const req = new NextRequest('http://localhost:3000/api/spotify/search?q=Wonderwall');
    const response = await GET(req);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Internal Server Error');
  });
});
