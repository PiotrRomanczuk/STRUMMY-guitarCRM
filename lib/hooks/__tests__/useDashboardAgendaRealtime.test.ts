/**
 * useDashboardAgendaRealtime Hook Tests
 *
 * Verifies that the hook:
 * - Subscribes to the `lessons` and `assignments` tables on mount
 * - Calls router.refresh() (debounced) when a relevant event fires
 * - Unsubscribes from the channel on unmount
 * - Gracefully no-ops when Supabase client creation fails
 *
 * @see lib/hooks/useDashboardAgendaRealtime.ts
 */

import { renderHook, act } from '@testing-library/react';
import { useDashboardAgendaRealtime } from '../useDashboardAgendaRealtime';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TODAY = new Date().toISOString().slice(0, 10);

const makeInitialItems = () => [
  {
    id: 'item-1',
    type: 'lesson' as const,
    title: 'Lesson with Alice',
    status: 'upcoming' as const,
  },
];

// ---------------------------------------------------------------------------
// Channel mock helpers
// ---------------------------------------------------------------------------

type ChangeHandler = (payload: Record<string, unknown>) => void;

interface ChannelHandlers {
  lessons: ChangeHandler[];
  assignments: ChangeHandler[];
}

// Mutable objects so we can reset between tests.
const channelHandlers: ChannelHandlers = { lessons: [], assignments: [] };
const mockRemoveChannel = jest.fn().mockResolvedValue(undefined);
const mockSubscribe = jest.fn().mockReturnThis();

function buildMockChannel() {
  const channel = {
    on: jest.fn((_event: string, opts: { table: string }, handler: ChangeHandler) => {
      if (opts.table === 'lessons') channelHandlers.lessons.push(handler);
      if (opts.table === 'assignments') channelHandlers.assignments.push(handler);
      return channel;
    }),
    subscribe: mockSubscribe,
  };
  return channel;
}

// Start with a fresh channel; reset in beforeEach.
let mockChannel = buildMockChannel();

// mockCreateClient is declared here so jest.mock hoisting can reference it.
const mockCreateClient = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));

// ---------------------------------------------------------------------------
// Router mock
// ---------------------------------------------------------------------------

const mockRouterRefresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRouterRefresh }),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useDashboardAgendaRealtime', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    // Reset captured handlers and build a fresh channel for each test.
    channelHandlers.lessons = [];
    channelHandlers.assignments = [];
    mockChannel = buildMockChannel();

    // Default: createClient() returns a working Supabase-like client.
    mockCreateClient.mockReturnValue({
      channel: jest.fn(() => mockChannel),
      removeChannel: mockRemoveChannel,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the initial items unchanged on first render', () => {
    const items = makeInitialItems();
    const { result } = renderHook(() => useDashboardAgendaRealtime(items));
    expect(result.current).toEqual(items);
  });

  it('subscribes to lessons and assignments channels on mount', () => {
    renderHook(() => useDashboardAgendaRealtime(makeInitialItems()));

    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({ table: 'lessons' }),
      expect.any(Function)
    );
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({ table: 'assignments' }),
      expect.any(Function)
    );
    expect(mockSubscribe).toHaveBeenCalledTimes(1);
  });

  it('calls router.refresh() after 1 s debounce when a lesson event fires for today', () => {
    renderHook(() => useDashboardAgendaRealtime(makeInitialItems()));

    act(() => {
      channelHandlers.lessons[0]?.({
        new: { id: 'lesson-x', scheduled_at: `${TODAY}T10:00:00Z` },
        old: {},
      });
    });

    // Debounce not yet expired — no refresh.
    expect(mockRouterRefresh).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockRouterRefresh).toHaveBeenCalledTimes(1);
  });

  it('does NOT call router.refresh() when the lesson event is for a different day', () => {
    renderHook(() => useDashboardAgendaRealtime(makeInitialItems()));

    act(() => {
      channelHandlers.lessons[0]?.({
        new: { id: 'lesson-y', scheduled_at: '2000-01-01T10:00:00Z' },
        old: {},
      });
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockRouterRefresh).not.toHaveBeenCalled();
  });

  it('debounces rapid events into a single refresh', () => {
    renderHook(() => useDashboardAgendaRealtime(makeInitialItems()));

    act(() => {
      for (let i = 0; i < 5; i++) {
        channelHandlers.lessons[0]?.({
          new: { id: `lesson-${i}`, scheduled_at: `${TODAY}T10:00:00Z` },
          old: {},
        });
      }
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockRouterRefresh).toHaveBeenCalledTimes(1);
  });

  it('calls router.refresh() when an assignment event fires for today', () => {
    renderHook(() => useDashboardAgendaRealtime(makeInitialItems()));

    act(() => {
      channelHandlers.assignments[0]?.({
        new: { id: 'assign-1', due_date: TODAY },
        old: {},
      });
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockRouterRefresh).toHaveBeenCalledTimes(1);
  });

  it('removes the channel subscription on unmount', () => {
    const { unmount } = renderHook(() => useDashboardAgendaRealtime(makeInitialItems()));

    unmount();

    expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel);
  });

  it('clears the debounce timer on unmount (no refresh fires after unmount)', () => {
    const { unmount } = renderHook(() => useDashboardAgendaRealtime(makeInitialItems()));

    act(() => {
      channelHandlers.lessons[0]?.({
        new: { id: 'lesson-z', scheduled_at: `${TODAY}T11:00:00Z` },
        old: {},
      });
    });

    // Unmount before debounce fires.
    unmount();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockRouterRefresh).not.toHaveBeenCalled();
  });

  it('gracefully no-ops when Supabase client creation throws', () => {
    mockCreateClient.mockImplementation(() => {
      throw new Error('Supabase not configured');
    });

    expect(() => {
      renderHook(() => useDashboardAgendaRealtime(makeInitialItems()));
    }).not.toThrow();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockRouterRefresh).not.toHaveBeenCalled();
  });
});
