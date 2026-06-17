/**
 * Drafted by local Gemma (gemma3:12b), corrected: mock useLayoutMode, useAIChat
 * and the child layouts; verify it renders the right layout per mode.
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AIAssistant } from '@/components/v2/ai/AIAssistant';

const mockUseLayoutMode = jest.fn();
jest.mock('@/hooks/use-is-widescreen', () => ({
  useLayoutMode: () => mockUseLayoutMode(),
}));

const refreshConversations = jest.fn();
jest.mock('@/components/v2/ai/useAIChat', () => ({
  useAIChat: () => ({
    messages: [],
    isStreaming: false,
    conversations: [],
    currentConversationId: null,
    isLoadingConversations: false,
    sendMessage: jest.fn(),
    clearChat: jest.fn(),
    loadConversation: jest.fn(),
    startNewConversation: jest.fn(),
    removeConversation: jest.fn(),
    refreshConversations,
  }),
}));

jest.mock('@/components/v2/ai/AIAssistant.Mobile', () => ({
  AIAssistantMobile: () => <div data-testid="mobile-layout">mobile</div>,
}));
jest.mock('@/components/v2/ai/AIAssistant.Desktop', () => ({
  __esModule: true,
  default: () => <div data-testid="desktop-layout">desktop</div>,
}));

beforeEach(() => jest.clearAllMocks());

describe('AIAssistant', () => {
  it('renders the mobile layout in mobile mode', () => {
    mockUseLayoutMode.mockReturnValue('mobile');
    render(<AIAssistant />);
    expect(screen.getByTestId('mobile-layout')).toBeInTheDocument();
  });

  it('refreshes conversations on mount', () => {
    mockUseLayoutMode.mockReturnValue('mobile');
    render(<AIAssistant />);
    expect(refreshConversations).toHaveBeenCalled();
  });
});
