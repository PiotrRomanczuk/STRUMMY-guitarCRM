/**
 * Drafted by local Gemma (gemma3:12b), corrected: mock useAIStream + server action.
 * canGenerate = studentName && songsPracticed.length > 0.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PostLessonSummaryAI } from '@/components/lessons/PostLessonSummaryAI';

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
jest.mock('@/app/actions/ai', () => ({ generatePostLessonSummaryStream: jest.fn() }));

beforeEach(() => jest.clearAllMocks());

const baseProps = {
  studentName: 'Emma',
  duration: 30,
  songsPracticed: ['Wonderwall'],
  onSummaryGenerated: jest.fn(),
};

describe('PostLessonSummaryAI', () => {
  it('renders the generate button', () => {
    render(<PostLessonSummaryAI {...baseProps} />);
    expect(screen.getByText('Generate Summary')).toBeInTheDocument();
  });

  it('starts streaming when clicked with valid input', () => {
    render(<PostLessonSummaryAI {...baseProps} />);
    fireEvent.click(screen.getByText('Generate Summary'));
    expect(mockStart).toHaveBeenCalled();
  });

  it('disables the button when no songs were practiced', () => {
    render(<PostLessonSummaryAI {...baseProps} songsPracticed={[]} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
