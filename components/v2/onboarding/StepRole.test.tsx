/**
 * Component tests: StepRole (onboarding wizard - role selection)
 *
 * @see components/v2/onboarding/StepRole.tsx
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

interface MockMotionButtonProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  'aria-pressed'?: boolean;
}

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
    button: ({
      children,
      className,
      onClick,
      type,
      'aria-pressed': ariaPressed,
    }: MockMotionButtonProps) => (
      <button type={type} className={className} onClick={onClick} aria-pressed={ariaPressed}>
        {children}
      </button>
    ),
  },
}));

import { StepRole } from './StepRole';

describe('StepRole', () => {
  it('renders the step headline and both role options', () => {
    render(<StepRole selectedRole={null} onSelect={jest.fn()} />);

    expect(screen.getByText(/What brings you to/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\bStudent\b/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\bTeacher\b/i })).toBeInTheDocument();
    expect(screen.getByText("I'm here to learn guitar and track my progress")).toBeInTheDocument();
    expect(screen.getByText('I teach guitar and want to manage my students')).toBeInTheDocument();
  });

  it('calls onSelect with "student" when the Student option is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    render(<StepRole selectedRole={null} onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: /\bStudent\b/i }));

    expect(onSelect).toHaveBeenCalledWith('student');
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('calls onSelect with "teacher" when the Teacher option is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    render(<StepRole selectedRole={null} onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: /\bTeacher\b/i }));

    expect(onSelect).toHaveBeenCalledWith('teacher');
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('marks the selected role as pressed and leaves the other unpressed', () => {
    render(<StepRole selectedRole="teacher" onSelect={jest.fn()} />);

    expect(screen.getByRole('button', { name: /\bTeacher\b/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: /\bStudent\b/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('marks neither role as pressed when no role is selected yet', () => {
    render(<StepRole selectedRole={null} onSelect={jest.fn()} />);

    expect(screen.getByRole('button', { name: /\bStudent\b/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(screen.getByRole('button', { name: /\bTeacher\b/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });
});
