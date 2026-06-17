/**
 * Drafted by local Gemma (gemma3:12b), corrected: mock useAIStream + server action.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LessonNotesAI } from '@/components/lessons/form/LessonNotesAI';

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
jest.mock('@/app/actions/ai', () => ({ generateLessonNotesStream: jest.fn() }));

beforeEach(() => jest.clearAllMocks());

const baseProps = {
  studentName: 'Emma',
  songsCovered: ['Wonderwall'],
  lessonTopic: 'Barre chords',
  onNotesGenerated: jest.fn(),
};

describe('LessonNotesAI', () => {
  it('renders the generate button', () => {
    render(<LessonNotesAI {...baseProps} />);
    expect(screen.getByText('Generate Lesson Notes')).toBeInTheDocument();
  });

  it('starts streaming when clicked with valid input', () => {
    render(<LessonNotesAI {...baseProps} />);
    fireEvent.click(screen.getByText('Generate Lesson Notes'));
    expect(mockStart).toHaveBeenCalled();
  });

  it('disables the button when required fields are missing', () => {
    render(<LessonNotesAI {...baseProps} lessonTopic="" />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
