/**
 * AssignmentStatusActions Component Tests
 *
 * Tests the contextual action buttons shown to students
 * for updating their assignment status.
 *
 * @see components/assignments/shared/AssignmentStatusActions.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AssignmentStatusActions } from '../AssignmentStatusActions';

// Mock the server action
const mockUpdateAssignmentStatus = jest.fn();
jest.mock('@/app/actions/assignments', () => ({
  updateAssignmentStatus: (...args: unknown[]) =>
    mockUpdateAssignmentStatus(...args),
}));

// Mock sonner toast
const mockToast = { success: jest.fn(), error: jest.fn() };
jest.mock('sonner', () => ({
  toast: mockToast,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Play: () => <span data-testid="icon-play" />,
  CheckCircle2: () => <span data-testid="icon-check" />,
  Loader2: () => <span data-testid="icon-loader" />,
}));

// Mock alert-dialog (render trigger and content inline)
jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogTrigger: ({
    children,
    asChild,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => <div data-testid="dialog-trigger">{asChild ? children : children}</div>,
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  AlertDialogAction: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button data-testid="confirm-complete" onClick={onClick}>
      {children}
    </button>
  ),
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => (
    <button>{children}</button>
  ),
}));

describe('AssignmentStatusActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders "Start Working" button for not_started assignments', () => {
    render(
      <AssignmentStatusActions
        assignmentId="test-id"
        currentStatus="not_started"
      />
    );

    expect(screen.getByText('Start Working')).toBeInTheDocument();
    expect(screen.queryByText('Mark Complete')).not.toBeInTheDocument();
  });

  it('renders "Mark Complete" button for in_progress assignments', () => {
    render(
      <AssignmentStatusActions
        assignmentId="test-id"
        currentStatus="in_progress"
      />
    );

    expect(screen.queryByText('Start Working')).not.toBeInTheDocument();
    expect(screen.getByText('Mark Complete')).toBeInTheDocument();
  });

  it('renders both buttons for overdue assignments', () => {
    render(
      <AssignmentStatusActions
        assignmentId="test-id"
        currentStatus="overdue"
      />
    );

    expect(screen.getByText('Start Working')).toBeInTheDocument();
    expect(screen.getByText('Mark Complete')).toBeInTheDocument();
  });

  it('renders nothing for completed assignments', () => {
    const { container } = render(
      <AssignmentStatusActions
        assignmentId="test-id"
        currentStatus="completed"
      />
    );

    expect(container.innerHTML).toBe('');
  });

  it('renders nothing for cancelled assignments', () => {
    const { container } = render(
      <AssignmentStatusActions
        assignmentId="test-id"
        currentStatus="cancelled"
      />
    );

    expect(container.innerHTML).toBe('');
  });

  it('calls server action when "Start Working" is clicked', async () => {
    mockUpdateAssignmentStatus.mockResolvedValue({
      success: true,
      assignmentId: 'test-id',
      newStatus: 'in_progress',
    });

    const onStatusChanged = jest.fn();

    render(
      <AssignmentStatusActions
        assignmentId="test-id"
        currentStatus="not_started"
        onStatusChanged={onStatusChanged}
      />
    );

    fireEvent.click(screen.getByText('Start Working'));

    await waitFor(() => {
      expect(mockUpdateAssignmentStatus).toHaveBeenCalledWith(
        'test-id',
        'in_progress'
      );
    });

    await waitFor(() => {
      expect(onStatusChanged).toHaveBeenCalledWith('in_progress');
    });

    expect(mockToast.success).toHaveBeenCalled();
  });

  it('calls server action when complete is confirmed', async () => {
    mockUpdateAssignmentStatus.mockResolvedValue({
      success: true,
      assignmentId: 'test-id',
      newStatus: 'completed',
    });

    const onStatusChanged = jest.fn();

    render(
      <AssignmentStatusActions
        assignmentId="test-id"
        currentStatus="in_progress"
        onStatusChanged={onStatusChanged}
      />
    );

    // Click the confirm button inside the dialog
    fireEvent.click(screen.getByTestId('confirm-complete'));

    await waitFor(() => {
      expect(mockUpdateAssignmentStatus).toHaveBeenCalledWith(
        'test-id',
        'completed'
      );
    });

    await waitFor(() => {
      expect(onStatusChanged).toHaveBeenCalledWith('completed');
    });
  });

  it('shows error toast on server action failure', async () => {
    mockUpdateAssignmentStatus.mockResolvedValue({
      error: 'You can only update your own assignments',
    });

    render(
      <AssignmentStatusActions
        assignmentId="test-id"
        currentStatus="not_started"
      />
    );

    fireEvent.click(screen.getByText('Start Working'));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        'You can only update your own assignments'
      );
    });
  });
});
