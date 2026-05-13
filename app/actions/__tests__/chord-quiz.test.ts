import { submitChordQuizSession } from '../chord-quiz';

jest.mock('@/lib/getUserWithRolesSSR', () => ({
  getUserWithRolesSSR: jest.fn(() => Promise.resolve({ isDevelopment: false })),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

const mockGetUser = jest.fn();
const mockInsert = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    })
  ),
}));

const STUDENT_ID = 'student-uuid-123';
const validAttempt = {
  chord_id: 'C',
  selected_answer: 'C',
  is_correct: true,
  response_time_ms: 800,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetUser.mockResolvedValue({
    data: { user: { id: STUDENT_ID } },
    error: null,
  });
  mockInsert.mockResolvedValue({ error: null });
  mockFrom.mockReturnValue({ insert: mockInsert });
});

describe('submitChordQuizSession', () => {
  it('returns Unauthorized when no user is in session', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'no session' },
    });
    const result = await submitChordQuizSession([validAttempt]);
    expect(result).toEqual({ error: 'Unauthorized' });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('blocks mutations from the test account in development', async () => {
    const { getUserWithRolesSSR } = jest.requireMock('@/lib/getUserWithRolesSSR');
    getUserWithRolesSSR.mockResolvedValueOnce({ isDevelopment: true });
    const result = await submitChordQuizSession([validAttempt]);
    expect('error' in result).toBe(true);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('rejects an empty session payload', async () => {
    const result = await submitChordQuizSession([]);
    expect('error' in result).toBe(true);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('rejects malformed input', async () => {
    const result = await submitChordQuizSession([{ chord_id: '' }]);
    expect('error' in result).toBe(true);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('inserts attempts with student_id derived from the session, not the input', async () => {
    const result = await submitChordQuizSession([
      { ...validAttempt, /* hostile */ student_id: 'hijack-id' },
    ]);
    expect(result).toEqual({ success: true, inserted: 1 });
    expect(mockFrom).toHaveBeenCalledWith('chord_quiz_attempts');
    expect(mockInsert).toHaveBeenCalledWith([
      {
        student_id: STUDENT_ID,
        chord_id: validAttempt.chord_id,
        selected_answer: validAttempt.selected_answer,
        is_correct: validAttempt.is_correct,
        response_time_ms: validAttempt.response_time_ms,
      },
    ]);
  });

  it('persists null when response_time_ms is omitted', async () => {
    const { response_time_ms, ...rest } = validAttempt;
    void response_time_ms;
    await submitChordQuizSession([rest]);
    expect(mockInsert).toHaveBeenCalledWith([expect.objectContaining({ response_time_ms: null })]);
  });

  it('reports the row count when a multi-attempt session succeeds', async () => {
    const session = Array.from({ length: 5 }, () => validAttempt);
    const result = await submitChordQuizSession(session);
    expect(result).toEqual({ success: true, inserted: 5 });
  });

  it('surfaces the database error when insert fails', async () => {
    mockInsert.mockResolvedValueOnce({
      error: { message: 'permission denied' },
    });
    const result = await submitChordQuizSession([validAttempt]);
    expect(result).toEqual({ error: 'permission denied' });
  });
});
