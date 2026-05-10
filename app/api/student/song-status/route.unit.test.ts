/**
 * @jest-environment node
 *
 * Locks `repertoire:status-change-writes-history-atomically` —
 * /api/student/song-status PUT must write a `song_status_history` row on the
 * initial insert AND on every subsequent transition. The previous code only
 * wrote on the first insert.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mockGetUser = jest.fn();
const mockHistoryInsert = jest.fn();
const mockUpsertSingle = jest.fn();
const mockSelectSingle = jest.fn();
const mockUpsert = jest.fn();
const mockSelect = jest.fn();
const mockEq2 = jest.fn();
const mockEq1 = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: jest.fn((table: string) => {
        if (table === 'song_status_history') {
          return { insert: mockHistoryInsert };
        }
        // student_songs: .from().select().eq().eq().single()  +  .from().upsert(...).select().single()
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({ single: mockSelectSingle })),
            })),
          })),
          upsert: jest.fn(() => ({
            select: jest.fn(() => ({ single: mockUpsertSingle })),
          })),
        };
      }),
    })
  ),
}));

const USER_ID = 'aaaaaaaa-1111-4111-8111-111111111111';
const SONG_ID = 'aaaaaaaa-2222-4222-8222-222222222222';

async function loadRoute() {
  jest.resetModules();
  return import('./route');
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/student/song-status', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetUser.mockResolvedValue({
    data: { user: { id: USER_ID } },
    error: null,
  });
  mockHistoryInsert.mockResolvedValue({ error: null });
  mockUpsertSingle.mockResolvedValue({ data: { id: 'row-1' }, error: null });
  void mockUpsert;
  void mockSelect;
  void mockEq1;
  void mockEq2;
});

describe('PUT /api/student/song-status — history writes', () => {
  it('writes history with previous_status=null on the initial insert', async () => {
    mockSelectSingle.mockResolvedValue({ data: null, error: null });

    const { PUT } = await loadRoute();
    const res = await PUT(makeRequest({ songId: SONG_ID, status: 'to_learn' }));
    expect(res.status).toBe(200);
    expect(mockHistoryInsert).toHaveBeenCalledTimes(1);
    expect(mockHistoryInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        student_id: USER_ID,
        song_id: SONG_ID,
        previous_status: null,
        new_status: 'to_learn',
      })
    );
  });

  it('writes history with previous_status set when status changes', async () => {
    mockSelectSingle.mockResolvedValue({
      data: { status: 'to_learn' },
      error: null,
    });

    const { PUT } = await loadRoute();
    const res = await PUT(makeRequest({ songId: SONG_ID, status: 'started' }));
    expect(res.status).toBe(200);
    expect(mockHistoryInsert).toHaveBeenCalledTimes(1);
    expect(mockHistoryInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        previous_status: 'to_learn',
        new_status: 'started',
      })
    );
  });

  it('does NOT write history when the status is unchanged (no-op resave)', async () => {
    mockSelectSingle.mockResolvedValue({
      data: { status: 'started' },
      error: null,
    });

    const { PUT } = await loadRoute();
    const res = await PUT(makeRequest({ songId: SONG_ID, status: 'started' }));
    expect(res.status).toBe(200);
    expect(mockHistoryInsert).not.toHaveBeenCalled();
  });

  it('returns 401 for unauthenticated callers', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const { PUT } = await loadRoute();
    const res = await PUT(makeRequest({ songId: SONG_ID, status: 'to_learn' }));
    expect(res.status).toBe(401);
    expect(mockHistoryInsert).not.toHaveBeenCalled();
  });

  it('returns 400 for malformed payload', async () => {
    const { PUT } = await loadRoute();
    const res = await PUT(makeRequest({ songId: 'not-uuid', status: 'oops' }));
    expect(res.status).toBe(400);
    expect(mockHistoryInsert).not.toHaveBeenCalled();
  });
});
