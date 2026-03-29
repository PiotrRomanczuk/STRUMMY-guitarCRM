import { renderHook, waitFor } from '@testing-library/react';
import { useStudentSongProgress } from '../useStudentSongProgress';
import { getStudentSongProgressAction } from '@/app/actions/repertoire';

jest.mock('@/app/actions/repertoire', () => ({
  getStudentSongProgressAction: jest.fn(),
}));

const mockAction = getStudentSongProgressAction as jest.MockedFunction<
  typeof getStudentSongProgressAction
>;

describe('useStudentSongProgress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty map when no studentId', () => {
    const { result } = renderHook(() => useStudentSongProgress(undefined));
    expect(result.current.progressMap).toEqual({});
    expect(result.current.isLoading).toBe(false);
  });

  it('fetches progress when studentId is provided', async () => {
    const mockMap = {
      'song-1': {
        current_status: 'started',
        last_practiced_at: '2026-03-20T10:00:00Z',
        total_practice_minutes: 30,
        self_rating: 3,
      },
    };

    mockAction.mockResolvedValue({ progressMap: mockMap });

    const { result } = renderHook(() => useStudentSongProgress('student-123'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.progressMap).toEqual(mockMap);
    expect(mockAction).toHaveBeenCalledWith('student-123');
  });

  it('resets progress when studentId changes to empty', async () => {
    const mockMap = {
      'song-1': {
        current_status: 'mastered',
        last_practiced_at: null,
        total_practice_minutes: 0,
        self_rating: null,
      },
    };

    mockAction.mockResolvedValue({ progressMap: mockMap });

    const { result, rerender } = renderHook(
      ({ id }: { id: string | undefined }) => useStudentSongProgress(id),
      { initialProps: { id: 'student-123' } }
    );

    await waitFor(() => {
      expect(result.current.progressMap).toEqual(mockMap);
    });

    rerender({ id: undefined });

    expect(result.current.progressMap).toEqual({});
  });

  it('handles error response gracefully', async () => {
    mockAction.mockResolvedValue({ error: 'Unauthorized' });

    const { result } = renderHook(() => useStudentSongProgress('student-456'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // On error, progressMap stays empty (doesn't crash)
    expect(result.current.progressMap).toEqual({});
  });
});
