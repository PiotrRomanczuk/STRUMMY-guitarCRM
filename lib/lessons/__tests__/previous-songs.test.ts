/**
 * Tests for getLastLessonSongs server action.
 *
 * Since this is a server action that calls Supabase,
 * we test the exported function interface with mocked dependencies.
 */

// Mock Supabase client
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockNot = jest.fn();
const mockOrder = jest.fn();
const mockLimit = jest.fn();

const mockFrom = jest.fn(() => ({
  select: mockSelect,
}));

mockSelect.mockReturnValue({ eq: mockEq });
mockEq.mockReturnValue({ eq: mockEq, not: mockNot });
mockNot.mockReturnValue({ order: mockOrder });
mockOrder.mockReturnValue({ limit: mockLimit });

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: mockFrom,
    })
  ),
}));

jest.mock('@/lib/getUserWithRolesSSR', () => ({
  getUserWithRolesSSR: jest.fn(() =>
    Promise.resolve({
      user: { id: 'teacher-uuid-1' },
      isAdmin: false,
      isTeacher: true,
      isDevelopment: false,
    })
  ),
}));

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

import { getLastLessonSongs } from '@/app/dashboard/lessons/previous-songs-action';

describe('getLastLessonSongs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ eq: mockEq, not: mockNot });
    mockNot.mockReturnValue({ order: mockOrder });
    mockOrder.mockReturnValue({ limit: mockLimit });
  });

  it('returns error for invalid studentId', async () => {
    const result = await getLastLessonSongs('not-a-uuid');
    expect(result).toEqual({ error: 'Invalid student ID' });
  });

  it('returns empty songs when no lessons found', async () => {
    mockLimit.mockResolvedValue({ data: [], error: null });

    const result = await getLastLessonSongs('a1111111-1111-4111-a111-111111111111');
    expect(result).toEqual({ songs: [], lessonDate: null });
  });

  it('returns empty songs when lessons have no lesson_songs', async () => {
    mockLimit.mockResolvedValue({
      data: [
        { id: 'lesson-1', scheduled_at: '2026-01-01T10:00:00Z', lesson_songs: [] },
      ],
      error: null,
    });

    const result = await getLastLessonSongs('a1111111-1111-4111-a111-111111111111');
    expect(result).toEqual({ songs: [], lessonDate: null });
  });

  it('returns songs from the most recent lesson with songs', async () => {
    mockLimit.mockResolvedValue({
      data: [
        { id: 'lesson-1', scheduled_at: '2026-03-20T15:00:00Z', lesson_songs: [] },
        {
          id: 'lesson-2',
          scheduled_at: '2026-03-13T15:00:00Z',
          lesson_songs: [
            {
              song_id: 'song-uuid-1',
              status: 'started',
              song: { id: 'song-uuid-1', title: 'Wonderwall', author: 'Oasis' },
            },
            {
              song_id: 'song-uuid-2',
              status: 'to_learn',
              song: { id: 'song-uuid-2', title: 'Blackbird', author: 'Beatles' },
            },
          ],
        },
      ],
      error: null,
    });

    const result = await getLastLessonSongs('a1111111-1111-4111-a111-111111111111');

    expect(result).not.toHaveProperty('error');
    if (!('error' in result)) {
      expect(result.songs).toHaveLength(2);
      expect(result.songs[0]).toEqual({
        songId: 'song-uuid-1',
        title: 'Wonderwall',
        author: 'Oasis',
        status: 'started',
      });
      expect(result.songs[1]).toEqual({
        songId: 'song-uuid-2',
        title: 'Blackbird',
        author: 'Beatles',
        status: 'to_learn',
      });
      expect(result.lessonDate).toBe('2026-03-13T15:00:00Z');
    }
  });

  it('returns error on Supabase query failure', async () => {
    mockLimit.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    const result = await getLastLessonSongs('a1111111-1111-4111-a111-111111111111');
    expect(result).toEqual({ error: 'Failed to fetch previous lesson songs' });
  });

  it('filters out lesson_songs with null song references', async () => {
    mockLimit.mockResolvedValue({
      data: [
        {
          id: 'lesson-1',
          scheduled_at: '2026-03-20T15:00:00Z',
          lesson_songs: [
            {
              song_id: 'song-uuid-1',
              status: 'started',
              song: { id: 'song-uuid-1', title: 'Wonderwall', author: 'Oasis' },
            },
            {
              song_id: 'deleted-song',
              status: 'to_learn',
              song: null,
            },
          ],
        },
      ],
      error: null,
    });

    const result = await getLastLessonSongs('a1111111-1111-4111-a111-111111111111');

    if (!('error' in result)) {
      expect(result.songs).toHaveLength(1);
      expect(result.songs[0].title).toBe('Wonderwall');
    }
  });
});
