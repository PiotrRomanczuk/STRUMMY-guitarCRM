/**
 * Drafted by local Gemma (gemma3:12b), corrected: mock useAIStream + server action.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AssignmentAI } from '@/components/assignments/form/AssignmentAI';

const mockStart = jest.fn();
jest.mock('@/hooks/useAIStream', () => ({
  useAIStream: jest.fn(() => ({
    status: 'idle',
    content: '',
    tokenCount: 0,
    error: null,
    reasoning: undefined,
    isStreaming: false,
    isError: false,
    start: mockStart,
    cancel: jest.fn(),
    reset: jest.fn(),
  })),
}));
jest.mock('@/app/actions/ai', () => ({ generateAssignmentStream: jest.fn() }));

beforeEach(() => jest.clearAllMocks());

const baseProps = {
  studentName: 'Emma',
  studentLevel: 'beginner' as const,
  recentSongs: ['Wonderwall'],
  focusArea: 'Strumming',
  duration: '1 week',
  onAssignmentGenerated: jest.fn(),
};

describe('AssignmentAI', () => {
  it('renders the generate button', () => {
    render(<AssignmentAI {...baseProps} />);
    expect(screen.getByText('Generate Assignment')).toBeInTheDocument();
  });

  it('starts streaming when clicked with valid input', () => {
    render(<AssignmentAI {...baseProps} />);
    fireEvent.click(screen.getByText('Generate Assignment'));
    expect(mockStart).toHaveBeenCalled();
  });

  it('disables the button when focusArea is missing', () => {
    render(<AssignmentAI {...baseProps} focusArea="" />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
