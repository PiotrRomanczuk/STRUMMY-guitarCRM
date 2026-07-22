/**
 * Component tests: StepGoals (onboarding wizard - goal multi-select)
 *
 * @see components/v2/onboarding/StepGoals.tsx
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

import { StepGoals } from './StepGoals';

const ALL_GOAL_LABELS = ['Learn songs', 'Music theory', 'Performance', 'Songwriting', 'Technique'];

describe('StepGoals', () => {
  it('renders the step headline and every goal option', () => {
    render(<StepGoals selectedGoals={[]} onToggle={jest.fn()} />);

    expect(screen.getByText(/What are your/i)).toBeInTheDocument();
    for (const label of ALL_GOAL_LABELS) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('shows the "pick at least one" hint when nothing is selected', () => {
    render(<StepGoals selectedGoals={[]} onToggle={jest.fn()} />);
    expect(screen.getByText('Pick at least one goal to continue.')).toBeInTheDocument();
  });

  it('hides the hint once at least one goal is selected', () => {
    render(<StepGoals selectedGoals={['learn-songs']} onToggle={jest.fn()} />);
    expect(screen.queryByText('Pick at least one goal to continue.')).not.toBeInTheDocument();
  });

  it('calls onToggle with the goal id when a goal chip is clicked', async () => {
    const user = userEvent.setup();
    const onToggle = jest.fn();
    render(<StepGoals selectedGoals={[]} onToggle={onToggle} />);

    await user.click(screen.getByRole('button', { name: 'Music theory' }));

    expect(onToggle).toHaveBeenCalledWith('music-theory');
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('marks selected goals as pressed and leaves the rest unpressed', () => {
    render(<StepGoals selectedGoals={['performance', 'technique']} onToggle={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Performance' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Technique' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Learn songs' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });
});
