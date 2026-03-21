import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// Mock lucide-react (includes icons used by StepWizardForm)
jest.mock('lucide-react', () => ({
  ArrowLeft: () => <span data-testid="icon-arrow-left" />,
  ArrowRight: () => <span data-testid="icon-arrow-right" />,
  Check: () => <span data-testid="icon-check" />,
  Loader2: () => <span data-testid="icon-loader" />,
  ChevronLeft: () => <span data-testid="icon-chevron-left" />,
  ChevronRight: () => <span data-testid="icon-chevron-right" />,
}));

// Mock useAssignmentMutations
const mockCreateAssignment = jest.fn();
const mockUpdateAssignment = jest.fn();
let mockIsLoading = false;

jest.mock('@/components/assignments/hooks/useAssignmentMutations', () => ({
  useAssignmentMutations: () => ({
    createAssignment: mockCreateAssignment,
    updateAssignment: mockUpdateAssignment,
    isLoading: mockIsLoading,
  }),
}));

// Mock the Step components to be simple and testable
jest.mock('@/components/v2/assignments/AssignmentForm.Steps', () => ({
  StepStudent: ({
    students,
    selectedId,
    onSelect,
  }: {
    students: Array<{ id: string; full_name: string | null; email: string }>;
    selectedId: string;
    onSelect: (id: string) => void;
  }) => (
    <div data-testid="step-student">
      <select
        data-testid="student-select"
        value={selectedId}
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="">Choose student</option>
        {students.map((s) => (
          <option key={s.id} value={s.id}>
            {s.full_name || s.email}
          </option>
        ))}
      </select>
    </div>
  ),
  StepContent: ({
    title,
    onTitleChange,
    description,
    onDescriptionChange,
  }: {
    title: string;
    description: string;
    onTitleChange: (v: string) => void;
    onDescriptionChange: (v: string) => void;
  }) => (
    <div data-testid="step-content">
      <input
        data-testid="title-input"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Title"
      />
      <textarea
        data-testid="description-input"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="Description"
      />
    </div>
  ),
  StepSchedule: ({
    dueDate,
    onDueDateChange,
  }: {
    dueDate: string;
    onDueDateChange: (v: string) => void;
  }) => (
    <div data-testid="step-schedule">
      <input
        data-testid="due-date-input"
        type="date"
        value={dueDate}
        onChange={(e) => onDueDateChange(e.target.value)}
      />
    </div>
  ),
}));

import { AssignmentForm } from '@/components/v2/assignments/AssignmentForm';

const defaultStudents = [
  { id: 'student-1', full_name: 'Alice Smith', email: 'alice@example.com' },
  { id: 'student-2', full_name: 'Bob Jones', email: 'bob@example.com' },
];

const defaultProps = {
  mode: 'create' as const,
  students: defaultStudents,
  teacherId: 'teacher-1',
};

describe('AssignmentForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsLoading = false;
  });

  describe('step navigation and canAdvance validation', () => {
    it('starts on step 0 (Student selection)', () => {
      render(<AssignmentForm {...defaultProps} />);
      expect(screen.getByTestId('step-student')).toBeInTheDocument();
    });

    it('blocks advancing from step 0 without selecting a student', () => {
      render(<AssignmentForm {...defaultProps} />);
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
      expect(screen.getByTestId('step-student')).toBeInTheDocument();
    });

    it('Next button is disabled when canAdvance is false at step 0', () => {
      render(<AssignmentForm {...defaultProps} />);
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    it('allows advancing to step 1 after selecting a student', () => {
      render(<AssignmentForm {...defaultProps} />);
      fireEvent.change(screen.getByTestId('student-select'), {
        target: { value: 'student-1' },
      });
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).not.toBeDisabled();
      fireEvent.click(nextButton);
      expect(screen.getByTestId('step-content')).toBeInTheDocument();
    });

    it('blocks advancing from step 1 without entering a title', () => {
      render(<AssignmentForm {...defaultProps} />);
      fireEvent.change(screen.getByTestId('student-select'), {
        target: { value: 'student-1' },
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    it('allows advancing from step 1 to step 2 after entering title', () => {
      render(<AssignmentForm {...defaultProps} />);
      fireEvent.change(screen.getByTestId('student-select'), {
        target: { value: 'student-1' },
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      fireEvent.change(screen.getByTestId('title-input'), {
        target: { value: 'Practice scales' },
      });
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).not.toBeDisabled();
      fireEvent.click(nextButton);
      expect(screen.getByTestId('step-schedule')).toBeInTheDocument();
    });

    it('validates ALL required fields at the final step (step 2)', () => {
      render(<AssignmentForm {...defaultProps} />);
      fireEvent.change(screen.getByTestId('student-select'), {
        target: { value: 'student-1' },
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      fireEvent.change(screen.getByTestId('title-input'), {
        target: { value: 'Practice chords' },
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      const createButton = screen.getByRole('button', { name: /create/i });
      expect(createButton).not.toBeDisabled();
    });
  });

  describe('form submission', () => {
    it('calls createAssignment on submit in create mode', async () => {
      mockCreateAssignment.mockResolvedValueOnce({ id: 'new-1' });
      render(<AssignmentForm {...defaultProps} />);
      fireEvent.change(screen.getByTestId('student-select'), {
        target: { value: 'student-1' },
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      fireEvent.change(screen.getByTestId('title-input'), {
        target: { value: 'Scale practice' },
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      fireEvent.click(screen.getByRole('button', { name: /create/i }));
      await waitFor(() => {
        expect(mockCreateAssignment).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Scale practice',
            student_id: 'student-1',
          })
        );
      });
    });

    it('disables submit button when isLoading is true on final step', () => {
      mockIsLoading = true;
      render(
        <AssignmentForm
          {...defaultProps}
          mode="edit"
          initialData={{
            id: 'assign-1',
            title: 'Test Assignment',
            description: null,
            due_date: null,
            status: 'pending',
            student_id: 'student-1',
          }}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      const updateButton = screen.getByRole('button', { name: /update/i });
      expect(updateButton).toBeDisabled();
    });
  });

  describe('edit mode', () => {
    it('pre-populates with initial data in edit mode', () => {
      render(
        <AssignmentForm
          {...defaultProps}
          mode="edit"
          initialData={{
            id: 'assign-1',
            title: 'Existing Assignment',
            description: 'Practice daily',
            due_date: '2026-04-01T00:00:00Z',
            status: 'pending',
            student_id: 'student-1',
          }}
        />
      );
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).not.toBeDisabled();
    });

    it('shows Update label on final step in edit mode', () => {
      render(
        <AssignmentForm
          {...defaultProps}
          mode="edit"
          initialData={{
            id: 'assign-1',
            title: 'Existing',
            description: null,
            due_date: null,
            status: 'pending',
            student_id: 'student-1',
          }}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
    });
  });

  describe('step indicators', () => {
    it('renders step count indicator', () => {
      render(<AssignmentForm {...defaultProps} />);
      expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
    });

    it('shows current step label', () => {
      render(<AssignmentForm {...defaultProps} />);
      expect(screen.getByText('Student')).toBeInTheDocument();
    });
  });
});
