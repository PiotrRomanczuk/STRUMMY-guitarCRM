/**
 * Practice Session Server Actions Tests
 *
 * Tests for logPracticeSession and getStudentRepertoireSongs
 */

import { logPracticeSession, getStudentRepertoireSongs } from '../practice';

// Mock getUserWithRolesSSR
jest.mock('@/lib/getUserWithRolesSSR', () => ({
  getUserWithRolesSSR: jest.fn(() =>
    Promise.resolve({ isDevelopment: false })
  ),
}));

// Mock chain helpers
const mockGetUser = jest.fn();
const mockSingle = jest.fn();
const mockSelectChain = jest.fn();
const mockInsertChain = jest.fn();
const mockEqChain = jest.fn();
const mockOrderChain = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

// Mock next/cache
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

const mockUser = { id: 'student-uuid-123', email: 'student@test.com' };

beforeEach(() => {
  jest.clearAllMocks();
  mockGetUser.mockResolvedValue({
    data: { user: mockUser },
    error: null,
  });
});

describe('logPracticeSession', () => {
  it('should return error when not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Unauthorized' },
    });

    const result = await logPracticeSession({ duration_minutes: 15 });
    expect(result).toEqual({ error: 'Unauthorized' });
  });

  it('should reject invalid duration (too low)', async () => {
    const result = await logPracticeSession({ duration_minutes: 0 });
    expect('error' in result).toBe(true);
  });

  it('should reject invalid duration (too high)', async () => {
    const result = await logPracticeSession({ duration_minutes: 481 });
    expect('error' in result).toBe(true);
  });

  it('should reject non-integer duration', async () => {
    const result = await logPracticeSession({ duration_minutes: 15.5 });
    expect('error' in result).toBe(true);
  });

  it('should reject notes exceeding 500 characters', async () => {
    const result = await logPracticeSession({
      duration_minutes: 15,
      notes: 'x'.repeat(501),
    });
    expect('error' in result).toBe(true);
  });

  it('should insert a practice session successfully', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'session-uuid-123' },
      error: null,
    });
    mockSelectChain.mockReturnValue({ single: mockSingle });
    mockInsertChain.mockReturnValue({ select: mockSelectChain });
    mockFrom.mockReturnValue({ insert: mockInsertChain });

    const result = await logPracticeSession({ duration_minutes: 30 });

    expect(result).toEqual({
      success: true,
      sessionId: 'session-uuid-123',
    });
    expect(mockFrom).toHaveBeenCalledWith('practice_sessions');
    expect(mockInsertChain).toHaveBeenCalledWith({
      student_id: 'student-uuid-123',
      song_id: null,
      duration_minutes: 30,
      notes: null,
    });
  });

  it('should pass song_id when provided', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'session-uuid-456' },
      error: null,
    });
    mockSelectChain.mockReturnValue({ single: mockSingle });
    mockInsertChain.mockReturnValue({ select: mockSelectChain });
    mockFrom.mockReturnValue({ insert: mockInsertChain });

    const songId = '550e8400-e29b-41d4-a716-446655440000';
    const result = await logPracticeSession({
      duration_minutes: 20,
      song_id: songId,
      notes: 'Worked on chorus',
    });

    expect(result).toEqual({
      success: true,
      sessionId: 'session-uuid-456',
    });
    expect(mockInsertChain).toHaveBeenCalledWith({
      student_id: 'student-uuid-123',
      song_id: songId,
      duration_minutes: 20,
      notes: 'Worked on chorus',
    });
  });

  it('should handle database errors gracefully', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'DB error' },
    });
    mockSelectChain.mockReturnValue({ single: mockSingle });
    mockInsertChain.mockReturnValue({ select: mockSelectChain });
    mockFrom.mockReturnValue({ insert: mockInsertChain });

    const result = await logPracticeSession({ duration_minutes: 15 });
    expect(result).toEqual({ error: 'DB error' });
  });

  it('should block test account mutations', async () => {
    const { getUserWithRolesSSR } = jest.requireMock(
      '@/lib/getUserWithRolesSSR'
    );
    getUserWithRolesSSR.mockResolvedValueOnce({ isDevelopment: true });

    const result = await logPracticeSession({ duration_minutes: 15 });
    expect('error' in result).toBe(true);
  });
});

describe('getStudentRepertoireSongs', () => {
  it('should return error when not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Unauthorized' },
    });

    const result = await getStudentRepertoireSongs();
    expect(result).toEqual({ error: 'Unauthorized' });
  });

  it('should return repertoire songs for authenticated student', async () => {
    const mockData = [
      {
        id: 'rep-1',
        song_id: 'song-1',
        song: { id: 'song-1', title: 'Wonderwall', author: 'Oasis' },
      },
      {
        id: 'rep-2',
        song_id: 'song-2',
        song: { id: 'song-2', title: 'Blackbird', author: 'The Beatles' },
      },
    ];

    mockOrderChain.mockResolvedValue({ data: mockData, error: null });
    mockEqChain.mockReturnValue({ order: mockOrderChain });
    const mockEq2 = jest.fn().mockReturnValue({ eq: mockEqChain });
    mockSelectChain.mockReturnValue({ eq: mockEq2 });
    mockFrom.mockReturnValue({ select: mockSelectChain });

    const result = await getStudentRepertoireSongs();
    expect('songs' in result).toBe(true);
    if ('songs' in result) {
      expect(result.songs).toHaveLength(2);
      expect(result.songs[0]).toEqual({
        songId: 'song-1',
        title: 'Wonderwall',
        author: 'Oasis',
      });
    }
  });

  it('should handle database errors', async () => {
    mockOrderChain.mockResolvedValue({
      data: null,
      error: { message: 'DB error' },
    });
    mockEqChain.mockReturnValue({ order: mockOrderChain });
    const mockEq2 = jest.fn().mockReturnValue({ eq: mockEqChain });
    mockSelectChain.mockReturnValue({ eq: mockEq2 });
    mockFrom.mockReturnValue({ select: mockSelectChain });

    const result = await getStudentRepertoireSongs();
    expect(result).toEqual({ error: 'DB error' });
  });
});
