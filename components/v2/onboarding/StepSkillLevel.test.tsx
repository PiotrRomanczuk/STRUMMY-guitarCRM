/**
 * Component tests: StepSkillLevel (onboarding wizard - skill level selection)
 *
 * @see components/v2/onboarding/StepSkillLevel.tsx
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

import { StepSkillLevel } from './StepSkillLevel';

describe('StepSkillLevel', () => {
  it('renders the step headline and all three skill level options', () => {
    render(<StepSkillLevel selectedLevel="beginner" onSelect={jest.fn()} />);

    expect(screen.getByText(/What's your/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Beginner/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Intermediate/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Advanced/i })).toBeInTheDocument();
    expect(screen.getByText('I know a few chords or am just starting out.')).toBeInTheDocument();
    expect(screen.getByText('I can play songs and know some scales.')).toBeInTheDocument();
    expect(screen.getByText('I understand theory and can improvise freely.')).toBeInTheDocument();
  });

  it('calls onSelect with "intermediate" when the Intermediate option is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    render(<StepSkillLevel selectedLevel="beginner" onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: /Intermediate/i }));

    expect(onSelect).toHaveBeenCalledWith('intermediate');
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('calls onSelect with "advanced" when the Advanced option is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    render(<StepSkillLevel selectedLevel="beginner" onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: /Advanced/i }));

    expect(onSelect).toHaveBeenCalledWith('advanced');
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('marks the selected level as pressed and leaves the others unpressed', () => {
    render(<StepSkillLevel selectedLevel="advanced" onSelect={jest.fn()} />);

    expect(screen.getByRole('button', { name: /Advanced/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: /Beginner/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(screen.getByRole('button', { name: /Intermediate/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });
});
