/**
 * Drafted by local Gemma (gemma3:12b), corrected: mock useAIConversation,
 * useAIStream and the server action; assert the real chat state machine.
 */
import { renderHook, act } from '@testing-library/react';
import { useAIChat } from '@/components/v2/ai/useAIChat';

const mockStart = jest.fn();
const mockStartNewConversation = jest.fn();
jest.mock('@/hooks/useAIConversation', () => ({
  useAIConversation: () => ({
    conversationId: null,
    conversations: [],
    isLoadingList: false,
    isLoadingConversation: false,
    startNewConversation: mockStartNewConversation,
    clearCurrentConversation: jest.fn(),
    loadConversation: jest.fn().mockResolvedValue([]),
    removeConversation: jest.fn(),
    refreshConversationList: jest.fn(),
  }),
}));
jest.mock('@/hooks/useAIStream', () => ({
  useAIStream: () => ({ isStreaming: false, status: 'idle', start: mockStart, reset: jest.fn() }),
}));
jest.mock('@/app/actions/ai', () => ({ generateAIResponseStream: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  mockStartNewConversation.mockResolvedValue('conv-1');
});

describe('useAIChat', () => {
  it('starts with a single welcome message', () => {
    const { result } = renderHook(() => useAIChat());
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe('system');
  });

  it('appends user + assistant messages and starts the stream on send', async () => {
    const { result } = renderHook(() => useAIChat());
    await act(async () => {
      await result.current.sendMessage('How do I practice barre chords?');
    });
    expect(mockStartNewConversation).toHaveBeenCalled();
    expect(mockStart).toHaveBeenCalled();
    expect(result.current.messages).toHaveLength(3); // welcome + user + assistant
    expect(result.current.messages[1]).toMatchObject({ role: 'user' });
  });

  it('ignores empty messages', async () => {
    const { result } = renderHook(() => useAIChat());
    await act(async () => {
      await result.current.sendMessage('   ');
    });
    expect(mockStart).not.toHaveBeenCalled();
  });

  it('clearChat resets to the welcome message', async () => {
    const { result } = renderHook(() => useAIChat());
    await act(async () => {
      await result.current.sendMessage('hi');
    });
    act(() => result.current.clearChat());
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe('system');
  });
});
