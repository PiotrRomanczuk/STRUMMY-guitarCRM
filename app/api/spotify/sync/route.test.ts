import { POST } from './route';
import { createClient } from '@/lib/supabase/server';
import { searchSongsWithAI } from '@/lib/services/enhanced-spotify-search';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Route now delegates matching to the AI-enhanced search service instead of
// calling the raw Spotify search client directly (see enhanced-spotify-search.ts).
jest.mock('@/lib/services/enhanced-spotify-search', () => ({
  searchSongsWithAI: jest.fn(),
}));

describe('Spotify Sync API', () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
    select: jest.fn(),
    eq: jest.fn(),
    single: jest.fn(),
    is: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    // Setup chainable mocks
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
    mockSupabase.single.mockReturnValue(mockSupabase);
    mockSupabase.is.mockReturnValue(mockSupabase);
    mockSupabase.update.mockReturnValue(mockSupabase);
  });

  it('returns 401 if not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await POST(
      new NextRequest('http://localhost/api/spotify/sync', { method: 'POST' })
    );
    expect(res.status).toBe(401);
  });

  it('returns 403 if not admin or teacher', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user1' } }, error: null });
    mockSupabase.single.mockResolvedValue({
      data: { is_admin: false, is_teacher: false },
      error: null,
    });

    const res = await POST(
      new NextRequest('http://localhost/api/spotify/sync', { method: 'POST' })
    );
    expect(res.status).toBe(403);
  });

  it('syncs songs successfully', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user1' } }, error: null });

    const profileBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { is_admin: true }, error: null }),
    };

    const song1 = { id: '1', title: 'Song 1', author: 'Artist 1' };
    const song2 = { id: '2', title: 'Song 2', author: 'Artist 2' };

    const songsBuilder = {
      select: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: [song1, song2],
        error: null,
      }),
    };

    const updateBuilder = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };

    mockSupabase.from
      .mockReturnValueOnce(profileBuilder)
      .mockReturnValueOnce(songsBuilder)
      .mockReturnValue(updateBuilder);

    // Song 1 gets a high-confidence AI match (>= 85) so it's updated directly.
    // Song 2 gets no match at all, so it's skipped.
    (searchSongsWithAI as jest.Mock).mockResolvedValue([
      {
        song: song1,
        match: {
          confidence: 90,
          found: true,
          track: {
            external_urls: { spotify: 'https://spotify.com/track/1' },
            duration_ms: 200000,
            artists: [{ name: 'Artist 1' }],
            album: {
              release_date: '2023-01-01',
              images: [{ url: 'https://image.url/1' }],
            },
          },
          searchQuery: 'Song 1 Artist 1',
          reasoning: 'High confidence match',
          suggestions: [],
        },
        executionTime: 500,
        queriesUsed: 1,
      },
      {
        song: song2,
        match: {
          confidence: 0,
          found: false,
          track: undefined,
          searchQuery: 'Song 2 Artist 2',
          reasoning: 'No matches found in Spotify',
          suggestions: [],
        },
        executionTime: 300,
        queriesUsed: 3,
      },
    ]);

    const res = await POST(
      new NextRequest('http://localhost/api/spotify/sync', { method: 'POST' })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.total).toBe(2);
    expect(data.updated).toBe(1);
    expect(data.skipped).toBe(1);
    expect(searchSongsWithAI).toHaveBeenCalledTimes(1);
    expect(updateBuilder.update).toHaveBeenCalledTimes(1);
    expect(updateBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        cover_image_url: 'https://image.url/1',
      })
    );
  });
});
