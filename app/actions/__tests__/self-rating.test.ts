import { updateSelfRatingAction } from '../self-rating';

jest.mock('@/lib/getUserWithRolesSSR', () => ({
  getUserWithRolesSSR: jest.fn(() => Promise.resolve({ isDevelopment: false })),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

const mockGetUser = jest.fn();
const mockSingle = jest.fn();
const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockUpdateEq = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    })
  ),
}));

const STUDENT_ID = 'aaaaaaaa-1111-4111-8111-111111111111';
const REPERTOIRE_ID = 'aaaaaaaa-2222-4222-8222-222222222222';

function setOwnership(studentId: string | null, fetchError: unknown = null) {
  mockSingle.mockResolvedValue({
    data: studentId ? { student_id: studentId } : null,
    error: fetchError,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetUser.mockResolvedValue({
    data: { user: { id: STUDENT_ID } },
    error: null,
  });
  setOwnership(STUDENT_ID);
  mockEq.mockReturnValue({ single: mockSingle });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockUpdateEq.mockResolvedValue({ error: null });
  mockUpdate.mockReturnValue({ eq: mockUpdateEq });
  mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate });
});

describe('updateSelfRatingAction', () => {
  it('returns Unauthorized when no user is in session', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'no session' },
    });
    expect(await updateSelfRatingAction(REPERTOIRE_ID, 4)).toEqual({
      error: 'Unauthorized',
    });
  });

  it('blocks the test account in development', async () => {
    const { getUserWithRolesSSR } = jest.requireMock('@/lib/getUserWithRolesSSR');
    getUserWithRolesSSR.mockResolvedValueOnce({ isDevelopment: true });
    const result = await updateSelfRatingAction(REPERTOIRE_ID, 3);
    expect('error' in result).toBe(true);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it.each([0, 6, 1.5])('rejects invalid rating %p', async (r) => {
    const result = await updateSelfRatingAction(REPERTOIRE_ID, r);
    expect('error' in result).toBe(true);
  });

  it('rejects malformed repertoireId', async () => {
    const result = await updateSelfRatingAction('not-a-uuid', 4);
    expect('error' in result).toBe(true);
  });

  it('returns "not found" when the repertoire row does not exist', async () => {
    setOwnership(null, { code: 'PGRST116' });
    expect(await updateSelfRatingAction(REPERTOIRE_ID, 4)).toEqual({
      error: 'Repertoire entry not found',
    });
  });

  it("refuses to rate another student's repertoire entry", async () => {
    setOwnership('different-student-uuid');
    expect(await updateSelfRatingAction(REPERTOIRE_ID, 4)).toEqual({
      error: 'You can only rate your own repertoire songs',
    });
  });

  it('updates the rating with a fresh self_rating_updated_at timestamp', async () => {
    const before = Date.now();
    const result = await updateSelfRatingAction(REPERTOIRE_ID, 5);
    const after = Date.now();
    expect(result).toEqual({ success: true });

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const payload = mockUpdate.mock.calls[0][0];
    expect(payload.self_rating).toBe(5);
    const stamp = new Date(payload.self_rating_updated_at).getTime();
    expect(stamp).toBeGreaterThanOrEqual(before);
    expect(stamp).toBeLessThanOrEqual(after);
  });

  it('surfaces the database error when the update fails', async () => {
    mockUpdateEq.mockResolvedValueOnce({
      error: { message: 'permission denied' },
    });
    expect(await updateSelfRatingAction(REPERTOIRE_ID, 5)).toEqual({
      error: 'permission denied',
    });
  });
});
