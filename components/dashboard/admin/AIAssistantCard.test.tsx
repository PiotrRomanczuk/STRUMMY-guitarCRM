/**
 * Drafted by local Gemma (gemma3:12b), corrected: mock useAIConversation,
 * useAIStream and the server actions (incl. getAvailableModels in the mount effect).
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AIAssistantCard } from '@/components/dashboard/admin/AIAssistantCard';

jest.mock('@/app/actions/ai', () => ({
  generateAIResponseStream: jest.fn(),
  getAvailableModels: jest.fn().mockResolvedValue({ models: [], providerName: 'OpenRouter' }),
}));

jest.mock('@/hooks/useAIConversation', () => ({
  useAIConversation: () => ({
    conversationId: null,
    conversations: [],
    isLoadingList: false,
    isLoadingConversation: false,
    startNewConversation: jest.fn().mockResolvedValue('c1'),
    clearCurrentConversation: jest.fn(),
    loadConversation: jest.fn().mockResolvedValue([]),
    removeConversation: jest.fn(),
    refreshConversationList: jest.fn(),
  }),
}));

jest.mock('@/hooks/useAIStream', () => ({
  useAIStream: () => ({
    status: 'idle',
    content: '',
    tokenCount: 0,
    error: null,
    reasoning: undefined,
    isStreaming: false,
    isError: false,
    start: jest.fn(),
    cancel: jest.fn(),
    reset: jest.fn(),
  }),
}));

describe('AIAssistantCard', () => {
  it('renders the assistant card with input', async () => {
    render(<AIAssistantCard firstName="Piotr" />);
    expect(await screen.findByText('AI Assistant')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ask me anything...')).toBeInTheDocument();
  });
});
