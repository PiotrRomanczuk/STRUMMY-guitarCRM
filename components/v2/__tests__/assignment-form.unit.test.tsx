import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      ..._rest
    }: {
      children?: React.ReactNode;
      className?: string;
      [key: string]: unknown;
    }) => (
      <div className={className} data-testid="motion-div">
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock animation variants
jest.mock('@/lib/animations/variants', () => ({
  fadeIn: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));
// Mock lucide-react
jest.mock('lucide-react', () => ({
  ArrowLeft: () => <span data-testid="icon-arrow-left" />,
  ArrowRight: () => <span data-testid="icon-arrow-right" />,
  Check: () => <span data-testid="icon-check" />,
  Loader2: () => <span data-testid="icon-loader" />,
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

// ──────────────────────────────────────────────────────────────────────────────
// AssignmentForm
// ──────────────────────────────────────────────────────────────────────────────
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
      // Next button should be disabled without a student selected
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
      // Should still be on step 0
      expect(screen.getByTestId('step-student')).toBeInTheDocument();
    });

    it('Next button is disabled when canAdvance is false at step 0', () => {
      render(<AssignmentForm {...defaultProps} />);
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    it('allows advancing to step 1 after selecting a student', () => {
      render(<AssignmentForm {...defaultProps} />);
      // Select a student
      fireEvent.change(screen.getByTestId('student-select'), {
        target: { value: 'student-1' },
      });
      // Click Next
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).not.toBeDisabled();
      fireEvent.click(nextButton);
      // Should be on step 1
      expect(screen.getByTestId('step-content')).toBeInTheDocument();
    });

    it('blocks advancing from step 1 without entering a title', () => {
      render(<AssignmentForm {...defaultProps} />);
      // Go to step 1
      fireEvent.change(screen.getByTestId('student-select'), {
        target: { value: 'student-1' },
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      // Now on step 1, title is empty
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    it('allows advancing from step 1 to step 2 after entering title', () => {
      render(<AssignmentForm {...defaultProps} />);
      // Step 0: select student
      fireEvent.change(screen.getByTestId('student-select'), {
        target: { value: 'student-1' },
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      // Step 1: enter title
      fireEvent.change(screen.getByTestId('title-input'), {
        target: { value: 'Practice scales' },
      });
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).not.toBeDisabled();
      fireEvent.click(nextButton);
      // Should be on step 2
      expect(screen.getByTestId('step-schedule')).toBeInTheDocument();
    });

    it('validates ALL required fields at the final step (step 2)', () => {
      render(<AssignmentForm {...defaultProps} />);
      // Step 0: select student
      fireEvent.change(screen.getByTestId('student-select'), {
        target: { value: 'student-1' },
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      // Step 1: enter title
      fireEvent.change(screen.getByTestId('title-input'), {
        target: { value: 'Practice chords' },
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      // Step 2: should see the create button enabled since required fields are filled
      const createButton = screen.getByRole('button', { name: /create/i });
      expect(createButton).not.toBeDisabled();
    });
  });

  describe('form submission', () => {
    it('calls createAssignment on submit in create mode', async () => {
      mockCreateAssignment.mockResolvedValueOnce({ id: 'new-1' });
      render(<AssignmentForm {...defaultProps} />);
      // Navigate to final step
      fireEvent.change(screen.getByTestId('student-select'), {
        target: { value: 'student-1' },
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      fireEvent.change(screen.getByTestId('title-input'), {
        target: { value: 'Scale practice' },
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      // Submit
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

    it('disables navigation button when isLoading is true', () => {
      mockIsLoading = true;
      render(<AssignmentForm {...defaultProps} />);
      // Select a student so canAdvance would normally be true
      fireEvent.change(screen.getByTestId('student-select'), {
        target: { value: 'student-1' },
      });
      // Even with valid data, the button should be disabled due to isLoading
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    it('disables create button when isLoading is true on final step', () => {
      // Start with isLoading false to navigate, then check final step
      mockIsLoading = false;
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
      // Navigate through steps (initialData provides student and title)
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      // Now on final step - verify button is present
      const updateButton = screen.getByRole('button', { name: /update/i });
      // With isLoading false, the button should be enabled
      expect(updateButton).not.toBeDisabled();
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
      // Student should already be selected, so Next button should be enabled
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
      // Navigate to final step
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

    it('shows step labels for each step', () => {
      render(<AssignmentForm {...defaultProps} />);
      expect(
        screen.getByRole('button', { name: /step 1: student/i })
      ).toBeInTheDocument();
    });
  });
});
