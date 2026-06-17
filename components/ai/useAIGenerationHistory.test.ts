/**
 * Drafted by local Gemma (gemma3:12b), corrected to mock the real data source
 * ('@/app/actions/ai-history') and assert the hook's actual return shape.
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAIGenerationHistory } from '@/components/ai/useAIGenerationHistory';

const mockGet = jest.fn();
const mockToggleStar = jest.fn();
const mockDelete = jest.fn();

jest.mock('@/app/actions/ai-history', () => ({
  getAIGenerations: (...a: unknown[]) => mockGet(...a),
  toggleAIGenerationStar: (...a: unknown[]) => mockToggleStar(...a),
  deleteAIGeneration: (...a: unknown[]) => mockDelete(...a),
}));

const row = (id: string, starred = false) => ({
  id,
  generation_type: 'lesson_notes',
  is_starred: starred,
  output_content: 'x',
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockResolvedValue({ data: [row('1'), row('2')], total: 2, error: null });
  mockToggleStar.mockResolvedValue({ success: true });
  mockDelete.mockResolvedValue({ success: true });
});

describe('useAIGenerationHistory', () => {
  it('loads generations on mount', async () => {
    const { result } = renderHook(() => useAIGenerationHistory());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.generations).toHaveLength(2);
    expect(result.current.total).toBe(2);
    expect(mockGet).toHaveBeenCalled();
  });

  it('toggles a star optimistically', async () => {
    const { result } = renderHook(() => useAIGenerationHistory());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.handleToggleStar('1');
    });
    expect(mockToggleStar).toHaveBeenCalledWith('1');
    expect(result.current.generations.find((g) => g.id === '1')?.is_starred).toBe(true);
  });

  it('deletes a generation and decrements total', async () => {
    const { result } = renderHook(() => useAIGenerationHistory());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.handleDelete('1');
    });
    expect(mockDelete).toHaveBeenCalledWith('1');
    expect(result.current.generations.find((g) => g.id === '1')).toBeUndefined();
    expect(result.current.total).toBe(1);
  });

  it('re-fetches when a filter changes', async () => {
    const { result } = renderHook(() => useAIGenerationHistory());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    mockGet.mockClear();

    act(() => result.current.setTypeFilter('assignment'));
    await waitFor(() => expect(mockGet).toHaveBeenCalled());
  });
});
