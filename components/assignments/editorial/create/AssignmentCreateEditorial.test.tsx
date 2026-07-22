/**
 * Verifies AssignmentAI is wired into the editorial assignment form (the
 * editorial redesign had orphaned it). Mocks the server actions + useAIStream.
 *
 * AssignmentAI is hidden in production behind SHOW_AI_FEATURES; this suite
 * forces the flag on so the wiring guard stays meaningful for when the feature
 * is re-enabled.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AssignmentCreateEditorial } from '@/components/assignments/editorial/create/AssignmentCreateEditorial';

jest.mock('@/lib/config/features', () => ({ SHOW_AI_FEATURES: true }));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));
jest.mock('@/app/actions/assignment-edit', () => ({
  createAssignmentAction: jest.fn(),
  updateAssignmentAction: jest.fn(),
}));
jest.mock('@/app/actions/ai', () => ({ generateAssignmentStream: jest.fn() }));

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

const students = [{ id: 's1', name: 'Emma Stone', email: null }];
const songs = [{ id: 'g1', title: 'Wonderwall', author: 'Oasis' }];

beforeEach(() => jest.clearAllMocks());

describe('AssignmentCreateEditorial — AI wiring', () => {
  it('renders the AssignmentAI generate button', () => {
    render(<AssignmentCreateEditorial mode="create" students={students} songs={songs} />);
    expect(screen.getByTestId('assignment-notes-ai')).toBeInTheDocument();
    expect(screen.getByText('Generate Assignment')).toBeInTheDocument();
  });

  it('enables AI and starts streaming once a student + title are set', () => {
    render(<AssignmentCreateEditorial mode="create" students={students} songs={songs} />);
    fireEvent.change(document.querySelector('#assignment-student')!, {
      target: { value: 's1' },
    });
    fireEvent.change(document.querySelector('#assignment-title')!, {
      target: { value: 'Barre chord drill' },
    });
    const btn = screen.getByText('Generate Assignment').closest('button')!;
    expect(btn).toBeEnabled();
    fireEvent.click(btn);
    expect(mockStart).toHaveBeenCalled();
  });
});
