/**
 * Verifies AssignmentAI is wired into the editorial assignment form (the
 * editorial redesign had orphaned it). Mocks the server actions + useAIStream.
 *
 * AssignmentAI is hidden in production behind SHOW_AI_FEATURES; this suite
 * forces the flag on so the wiring guard stays meaningful for when the feature
 * is re-enabled.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AssignmentCreateEditorial } from '@/components/assignments/editorial/create/AssignmentCreateEditorial';
import { createAssignmentAction, updateAssignmentAction } from '@/app/actions/assignment-edit';

jest.mock('@/lib/config/features', () => ({ SHOW_AI_FEATURES: true }));
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
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

describe('AssignmentCreateEditorial — form fields, validation, submit', () => {
  it('renders create-mode fields: student, title, due date, song, brief', () => {
    render(<AssignmentCreateEditorial mode="create" students={students} songs={songs} />);
    expect(screen.getByRole('heading', { name: 'Set an assignment' })).toBeInTheDocument();
    expect(screen.getByLabelText('Student')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Due date')).toBeInTheDocument();
    expect(screen.getByLabelText('Song (optional)')).toBeInTheDocument();
    expect(screen.getByText('Wonderwall — Oasis')).toBeInTheDocument();
    expect(screen.getByLabelText('Brief')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create assignment' })).toBeInTheDocument();
  });

  it('requires a student and a title before submitting', async () => {
    const { container } = render(
      <AssignmentCreateEditorial mode="create" students={students} songs={songs} />
    );
    // Neither field is HTML-required (no native-validation short-circuit),
    // so a normal submit event is enough to reach the form's own validation.
    fireEvent.submit(container.querySelector('form')!);

    expect(await screen.findByText('Choose a student.')).toBeInTheDocument();
    expect(screen.getByText('Give the assignment a title.')).toBeInTheDocument();
    expect(createAssignmentAction).not.toHaveBeenCalled();
  });

  it('submits create assignments and redirects to the new assignment', async () => {
    (createAssignmentAction as jest.Mock).mockResolvedValue({ assignmentId: 'new-assignment-id' });
    render(<AssignmentCreateEditorial mode="create" students={students} songs={songs} />);

    fireEvent.change(screen.getByLabelText('Student'), { target: { value: 's1' } });
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Practise the C–Am–F–G loop' },
    });
    fireEvent.change(screen.getByLabelText('Due date'), { target: { value: '2026-04-30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create assignment' }));

    await waitFor(() => expect(createAssignmentAction).toHaveBeenCalled());
    expect(createAssignmentAction).toHaveBeenCalledWith(
      expect.objectContaining({ studentId: 's1', title: 'Practise the C–Am–F–G loop' })
    );
    expect(mockPush).toHaveBeenCalledWith('/dashboard/assignments/new-assignment-id');
  });

  it('surfaces a server error without navigating', async () => {
    (createAssignmentAction as jest.Mock).mockResolvedValue({ error: 'Something went wrong.' });
    render(<AssignmentCreateEditorial mode="create" students={students} songs={songs} />);

    fireEvent.change(screen.getByLabelText('Student'), { target: { value: 's1' } });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Warm-up drill' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create assignment' }));

    expect(await screen.findByText('Something went wrong.')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('edit mode pre-fills fields and submits via updateAssignmentAction', async () => {
    (updateAssignmentAction as jest.Mock).mockResolvedValue({ assignmentId: 'a1' });
    render(
      <AssignmentCreateEditorial
        mode="edit"
        students={students}
        songs={songs}
        initial={{
          assignmentId: 'a1',
          studentId: 's1',
          title: 'Existing assignment',
          description: null,
          dueDate: '2026-04-30T00:00:00.000Z',
          songId: 'g1',
        }}
      />
    );

    expect(screen.getByRole('heading', { name: 'Edit assignment' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing assignment')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(updateAssignmentAction).toHaveBeenCalledWith('a1', expect.anything())
    );
    expect(mockPush).toHaveBeenCalledWith('/dashboard/assignments/a1');
  });
});
