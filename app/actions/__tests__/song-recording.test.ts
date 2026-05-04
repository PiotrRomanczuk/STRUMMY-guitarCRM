/**
 * Song Recording State Server Actions Tests
 *
 * Covers the recording-queue state machine and auth gating:
 *   - setSongRecordingState  — direct state set
 *   - cycleSongRecordingState — idle → queued → recorded → idle
 *
 * @see app/actions/songs.ts
 */

import { setSongRecordingState, cycleSongRecordingState } from '../songs';

const mockGetUserWithRolesSSR = jest.fn();
jest.mock('@/lib/getUserWithRolesSSR', () => ({
  getUserWithRolesSSR: () => mockGetUserWithRolesSSR(),
}));

interface SongRow {
  recording_queued_at: string | null;
  recorded_at: string | null;
}

const mockUpdate = jest.fn();
const mockSelectSingle = jest.fn();
let songRow: SongRow | null = { recording_queued_at: null, recorded_at: null };
let updateError: { message: string } | null = null;
let fetchError: { message: string } | null = null;

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: (_table: string) => ({
        update: (data: Partial<SongRow>) => {
          mockUpdate(data);
          return {
            eq: (_field: string, _value: string) => Promise.resolve({ error: updateError }),
          };
        },
        select: (_fields: string) => ({
          eq: (_field: string, _value: string) => ({
            single: () => {
              mockSelectSingle();
              return Promise.resolve({ data: songRow, error: fetchError });
            },
          }),
        }),
      }),
    })
  ),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

const SONG_ID = '550e8400-e29b-41d4-a716-446655440000';

const teacherSession = {
  isAdmin: false,
  isTeacher: true,
  isDevelopment: false,
};
const adminSession = {
  isAdmin: true,
  isTeacher: false,
  isDevelopment: false,
};
const studentSession = {
  isAdmin: false,
  isTeacher: false,
  isDevelopment: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  songRow = { recording_queued_at: null, recorded_at: null };
  updateError = null;
  fetchError = null;
});

describe('setSongRecordingState', () => {
  it('queues a song for recording when called with "queued"', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue(teacherSession);

    const result = await setSongRecordingState(SONG_ID, 'queued');

    expect(result.success).toBe(true);
    expect(result.state).toBe('queued');
    expect(result.recordingQueuedAt).not.toBeNull();
    expect(result.recordedAt).toBeNull();
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ recorded_at: null, recording_queued_at: expect.any(String) })
    );
  });

  it('marks a song as recorded when called with "recorded"', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue(adminSession);

    const result = await setSongRecordingState(SONG_ID, 'recorded');

    expect(result.success).toBe(true);
    expect(result.state).toBe('recorded');
    expect(result.recordingQueuedAt).toBeNull();
    expect(result.recordedAt).not.toBeNull();
  });

  it('clears both timestamps when called with "idle"', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue(teacherSession);

    const result = await setSongRecordingState(SONG_ID, 'idle');

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({ recording_queued_at: null, recorded_at: null });
  });

  it('rejects students with Unauthorized', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue(studentSession);

    const result = await setSongRecordingState(SONG_ID, 'queued');

    expect(result).toEqual({
      success: false,
      state: 'idle',
      recordingQueuedAt: null,
      recordedAt: null,
      error: 'Unauthorized',
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('throws on test accounts', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({ ...teacherSession, isDevelopment: true });

    await expect(setSongRecordingState(SONG_ID, 'queued')).rejects.toThrow(
      'This action is not available on test accounts'
    );
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns the supabase error when the update fails', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue(teacherSession);
    updateError = { message: 'permission denied for table songs' };

    const result = await setSongRecordingState(SONG_ID, 'queued');

    expect(result.success).toBe(false);
    expect(result.error).toBe('permission denied for table songs');
  });
});

describe('cycleSongRecordingState', () => {
  it('cycles idle → queued', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue(teacherSession);
    songRow = { recording_queued_at: null, recorded_at: null };

    const result = await cycleSongRecordingState(SONG_ID);

    expect(result.success).toBe(true);
    expect(result.state).toBe('queued');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ recording_queued_at: expect.any(String), recorded_at: null })
    );
  });

  it('cycles queued → recorded', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue(teacherSession);
    songRow = { recording_queued_at: '2026-05-01T00:00:00.000Z', recorded_at: null };

    const result = await cycleSongRecordingState(SONG_ID);

    expect(result.success).toBe(true);
    expect(result.state).toBe('recorded');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ recording_queued_at: null, recorded_at: expect.any(String) })
    );
  });

  it('cycles recorded → idle', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue(teacherSession);
    songRow = {
      recording_queued_at: null,
      recorded_at: '2026-05-02T00:00:00.000Z',
    };

    const result = await cycleSongRecordingState(SONG_ID);

    expect(result.success).toBe(true);
    expect(result.state).toBe('idle');
    expect(mockUpdate).toHaveBeenCalledWith({ recording_queued_at: null, recorded_at: null });
  });

  it('treats rows with both timestamps set as "recorded" (defensive)', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue(adminSession);
    songRow = {
      recording_queued_at: '2026-05-01T00:00:00.000Z',
      recorded_at: '2026-05-02T00:00:00.000Z',
    };

    const result = await cycleSongRecordingState(SONG_ID);

    // recorded → idle
    expect(result.state).toBe('idle');
  });

  it('rejects students with Unauthorized and skips the fetch', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue(studentSession);

    const result = await cycleSongRecordingState(SONG_ID);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
    expect(mockSelectSingle).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns "Song not found" when the row is missing', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue(teacherSession);
    songRow = null;

    const result = await cycleSongRecordingState(SONG_ID);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Song not found');
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
