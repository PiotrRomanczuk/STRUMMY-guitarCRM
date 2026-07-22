/**
 * Component tests: StepWelcome (onboarding wizard - final confirmation step)
 *
 * @see components/v2/onboarding/StepWelcome.tsx
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
  },
}));

import { StepWelcome } from './StepWelcome';

describe('StepWelcome', () => {
  it('greets the user by their first name', () => {
    render(<StepWelcome firstName="Kuba" />);
    expect(screen.getByText("You're all set, Kuba!")).toBeInTheDocument();
  });

  it('falls back to "there" when no firstName is provided', () => {
    render(<StepWelcome />);
    expect(screen.getByText("You're all set, there!")).toBeInTheDocument();
  });

  it('renders the confirmation copy', () => {
    render(<StepWelcome firstName="Kuba" />);
    expect(
      screen.getByText("Your profile is ready. Let's start your guitar journey.")
    ).toBeInTheDocument();
  });
});
