/**
 * Song Request Server Actions Tests
 *
 * Tests for submitSongRequest, getSongRequests, and reviewSongRequest
 */

import { submitSongRequest, getSongRequests, reviewSongRequest } from '../song-requests';

// The real Zod schemas do the parsing; the override exists only to reach the
// defensive `?? 'Invalid form data'` fallback, which a real ZodError (always
// carrying at least one issue with a message) cannot produce.
let formParseOverride: { success: false; error: { issues: { message?: string }[] } } | null = null;
jest.mock('@/schemas/SongRequestSchema', () => {
  const actual = jest.requireActual('@/schemas/SongRequestSchema');
  return {
    ...actual,
    SongRequestFormSchema: {
      safeParse: (value: unknown) =>
        formParseOverride ?? actual.SongRequestFormSchema.safeParse(value),
    },
  };
});

// This action uses the bare `logger` singleton (not createLogger). The arrow
// indirection keeps the spy resolution lazy.
const mockLogError = jest.fn();
jest.mock('@/lib/logger', () => ({
  logger: {
    error: (...args: unknown[]) => mockLogError(...args),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock data
const mockStudentUser = {
  id: 'student-uuid-123',
  email: 'student@test.com',
};

const mockTeacherUser = {
  id: 'teacher-uuid-456',
  email: 'teacher@test.com',
};

const mockSongRequest = {
  id: 'request-uuid-789',
  student_id: 'student-uuid-123',
  title: 'Wonderwall',
  artist: 'Oasis',
  notes: null,
  url: null,
  status: 'pending',
  reviewed_by: null,
  review_notes: null,
  song_id: null,
  created_at: '2026-02-26T00:00:00Z',
  updated_at: '2026-02-26T00:00:00Z',
};

// Mock chain helpers
const mockSingle = jest.fn();
const mockSelectChain = jest.fn();
const mockInsertChain = jest.fn();
const mockUpdateChain = jest.fn();
const mockOrderChain = jest.fn();
const mockEqChain = jest.fn();

const mockFrom = jest.fn();

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

// Mock getUserWithRolesSSR
const mockGetUserWithRoles = jest.fn();
jest.mock('@/lib/getUserWithRolesSSR', () => ({
  getUserWithRolesSSR: () => mockGetUserWithRoles(),
}));

// Mock next/cache
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  formParseOverride = null;
});

describe('submitSongRequest', () => {
  it('should reject unauthenticated users', async () => {
    mockGetUserWithRoles.mockResolvedValue({
      user: null,
      isAdmin: false,
      isTeacher: false,
      isStudent: false,
      isDevelopment: false,
    });

    const result = await submitSongRequest({ title: 'Wonderwall' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('should reject non-student users', async () => {
    mockGetUserWithRoles.mockResolvedValue({
      user: mockTeacherUser,
      isAdmin: false,
      isTeacher: true,
      isStudent: false,
      isDevelopment: false,
    });

    const result = await submitSongRequest({ title: 'Wonderwall' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Only students can submit song requests');
  });

  it('should reject invalid form data', async () => {
    mockGetUserWithRoles.mockResolvedValue({
      user: mockStudentUser,
      isAdmin: false,
      isTeacher: false,
      isStudent: true,
      isDevelopment: false,
    });

    const result = await submitSongRequest({ title: '' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Song title is required');
  });

  it('should submit a valid song request', async () => {
    mockGetUserWithRoles.mockResolvedValue({
      user: mockStudentUser,
      isAdmin: false,
      isTeacher: false,
      isStudent: true,
      isDevelopment: false,
    });

    mockSingle.mockResolvedValue({ data: mockSongRequest, error: null });
    mockSelectChain.mockReturnValue({ single: mockSingle });
    mockInsertChain.mockReturnValue({ select: mockSelectChain });
    mockFrom.mockReturnValue({ insert: mockInsertChain });

    const result = await submitSongRequest({
      title: 'Wonderwall',
      artist: 'Oasis',
    });

    expect(result.success).toBe(true);
    expect(result.request).toEqual(mockSongRequest);
    expect(mockFrom).toHaveBeenCalledWith('song_requests');
  });

  it('should handle database errors gracefully', async () => {
    mockGetUserWithRoles.mockResolvedValue({
      user: mockStudentUser,
      isAdmin: false,
      isTeacher: false,
      isStudent: true,
      isDevelopment: false,
    });

    mockSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } });
    mockSelectChain.mockReturnValue({ single: mockSingle });
    mockInsertChain.mockReturnValue({ select: mockSelectChain });
    mockFrom.mockReturnValue({ insert: mockInsertChain });

    const result = await submitSongRequest({ title: 'Test' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to submit request');
    expect(mockLogError).toHaveBeenCalledWith('[submitSongRequest] Error:', {
      message: 'DB error',
    });
  });

  it('should block demo/test accounts before any auth or validation work', async () => {
    mockGetUserWithRoles.mockResolvedValue({
      user: mockStudentUser,
      isAdmin: false,
      isTeacher: false,
      isStudent: true,
      isDevelopment: true,
    });

    const result = await submitSongRequest({ title: 'Wonderwall' });

    expect(result).toEqual({
      success: false,
      error: 'This action is not available on test accounts',
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('should fall back to a generic message when validation reports no issue detail', async () => {
    // Defensive branch: a real ZodError always carries an issue with a message,
    // but the action must not surface `undefined` as the error string.
    mockGetUserWithRoles.mockResolvedValue({
      user: mockStudentUser,
      isAdmin: false,
      isTeacher: false,
      isStudent: true,
      isDevelopment: false,
    });

    formParseOverride = { success: false, error: { issues: [] } };

    const result = await submitSongRequest({ title: 'Wonderwall' });

    expect(result).toEqual({ success: false, error: 'Invalid form data' });
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe('getSongRequests', () => {
  it('should reject unauthenticated users', async () => {
    mockGetUserWithRoles.mockResolvedValue({
      user: null,
      isAdmin: false,
      isTeacher: false,
      isStudent: false,
      isDevelopment: false,
    });

    const result = await getSongRequests();
    expect(result.requests).toEqual([]);
    expect(result.error).toBe('Not authenticated');
  });

  it('should load requests for students (filtered to own)', async () => {
    mockGetUserWithRoles.mockResolvedValue({
      user: mockStudentUser,
      isAdmin: false,
      isTeacher: false,
      isStudent: true,
      isDevelopment: false,
    });

    mockEqChain.mockResolvedValue({ data: [mockSongRequest], error: null });
    mockOrderChain.mockReturnValue({ eq: mockEqChain });
    mockSelectChain.mockReturnValue({ order: mockOrderChain });
    mockFrom.mockReturnValue({ select: mockSelectChain });

    const result = await getSongRequests();
    expect(result.requests).toHaveLength(1);
    expect(result.error).toBeUndefined();
  });

  it('should load all requests for teachers', async () => {
    mockGetUserWithRoles.mockResolvedValue({
      user: mockTeacherUser,
      isAdmin: false,
      isTeacher: true,
      isStudent: false,
      isDevelopment: false,
    });

    mockOrderChain.mockResolvedValue({ data: [mockSongRequest], error: null });
    mockSelectChain.mockReturnValue({ order: mockOrderChain });
    mockFrom.mockReturnValue({ select: mockSelectChain });

    const result = await getSongRequests();
    expect(result.requests).toHaveLength(1);
  });

  it('should filter by status', async () => {
    mockGetUserWithRoles.mockResolvedValue({
      user: mockTeacherUser,
      isAdmin: false,
      isTeacher: true,
      isStudent: false,
      isDevelopment: false,
    });

    mockEqChain.mockResolvedValue({ data: [], error: null });
    mockOrderChain.mockReturnValue({ eq: mockEqChain });
    mockSelectChain.mockReturnValue({ order: mockOrderChain });
    mockFrom.mockReturnValue({ select: mockSelectChain });

    const result = await getSongRequests('approved');
    expect(result.requests).toEqual([]);
  });

  it('should surface a generic error and log details when the query fails', async () => {
    mockGetUserWithRoles.mockResolvedValue({
      user: mockTeacherUser,
      isAdmin: false,
      isTeacher: true,
      isStudent: false,
      isDevelopment: false,
    });

    const dbError = { message: 'relation does not exist' };
    mockOrderChain.mockResolvedValue({ data: null, error: dbError });
    mockSelectChain.mockReturnValue({ order: mockOrderChain });
    mockFrom.mockReturnValue({ select: mockSelectChain });

    const result = await getSongRequests();

    expect(result.requests).toEqual([]);
    expect(result.error).toBe('Failed to load requests');
    expect(mockLogError).toHaveBeenCalledWith('[getSongRequests] Error:', dbError);
  });

  it('should return an empty list when the query succeeds with a null payload', async () => {
    mockGetUserWithRoles.mockResolvedValue({
      user: mockTeacherUser,
      isAdmin: false,
      isTeacher: true,
      isStudent: false,
      isDevelopment: false,
    });

    mockOrderChain.mockResolvedValue({ data: null, error: null });
    mockSelectChain.mockReturnValue({ order: mockOrderChain });
    mockFrom.mockReturnValue({ select: mockSelectChain });

    const result = await getSongRequests();

    expect(result.requests).toEqual([]);
    expect(result.error).toBeUndefined();
  });
});

describe('reviewSongRequest', () => {
  it('should reject unauthenticated users', async () => {
    mockGetUserWithRoles.mockResolvedValue({
      user: null,
      isAdmin: false,
      isTeacher: false,
      isStudent: false,
      isDevelopment: false,
    });

    const result = await reviewSongRequest('id', { status: 'approved' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('should reject students', async () => {
    mockGetUserWithRoles.mockResolvedValue({
      user: mockStudentUser,
      isAdmin: false,
      isTeacher: false,
      isStudent: true,
      isDevelopment: false,
    });

    const result = await reviewSongRequest('id', { status: 'approved' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('should reject invalid review data', async () => {
    mockGetUserWithRoles.mockResolvedValue({
      user: mockTeacherUser,
      isAdmin: false,
      isTeacher: true,
      isStudent: false,
      isDevelopment: false,
    });

    // @ts-expect-error - testing invalid status on purpose
    const result = await reviewSongRequest('id', { status: 'pending' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid review data');
  });

  it('should approve a request successfully', async () => {
    mockGetUserWithRoles.mockResolvedValue({
      user: mockTeacherUser,
      isAdmin: false,
      isTeacher: true,
      isStudent: false,
      isDevelopment: false,
    });

    mockEqChain.mockResolvedValue({ data: null, error: null });
    mockUpdateChain.mockReturnValue({ eq: mockEqChain });
    mockFrom.mockReturnValue({ update: mockUpdateChain });

    const result = await reviewSongRequest('request-uuid-789', {
      status: 'approved',
      reviewNotes: 'Great choice!',
    });

    expect(result.success).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('song_requests');
  });

  it('should handle database errors on review', async () => {
    mockGetUserWithRoles.mockResolvedValue({
      user: mockTeacherUser,
      isAdmin: false,
      isTeacher: true,
      isStudent: false,
      isDevelopment: false,
    });

    mockEqChain.mockResolvedValue({ data: null, error: { message: 'DB error' } });
    mockUpdateChain.mockReturnValue({ eq: mockEqChain });
    mockFrom.mockReturnValue({ update: mockUpdateChain });

    const result = await reviewSongRequest('request-uuid-789', {
      status: 'rejected',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to review request');
    expect(mockLogError).toHaveBeenCalledWith('[reviewSongRequest] Error:', {
      message: 'DB error',
    });
  });

  it('should block demo/test accounts before any auth or validation work', async () => {
    mockGetUserWithRoles.mockResolvedValue({
      user: mockTeacherUser,
      isAdmin: false,
      isTeacher: true,
      isStudent: false,
      isDevelopment: true,
    });

    const result = await reviewSongRequest('request-uuid-789', { status: 'approved' });

    expect(result).toEqual({
      success: false,
      error: 'This action is not available on test accounts',
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
