import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// Mock lucide-react Star icon
jest.mock('lucide-react', () => ({
  Star: ({ className }: { className?: string }) => (
    <svg data-testid="star-icon" className={className} />
  ),
}));

// Mock the server action
const mockUpdateSelfRating = jest.fn();
jest.mock('@/app/actions/self-rating', () => ({
  updateSelfRatingAction: (...args: unknown[]) => mockUpdateSelfRating(...args),
}));

// Mock SELF_RATING_LABELS
jest.mock('@/schemas/SelfRatingSchema', () => ({
  SELF_RATING_LABELS: {
    1: 'Struggling',
    2: 'Needs Work',
    3: 'Okay',
    4: 'Comfortable',
    5: 'Mastered',
  } as Record<number, string>,
}));

import { SelfRating } from '@/components/v2/repertoire/SelfRating';

// ──────────────────────────────────────────────────────────────────────────────
// SelfRating
// ──────────────────────────────────────────────────────────────────────────────
describe('SelfRating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateSelfRating.mockResolvedValue({});
  });

  it('renders exactly 5 star buttons', () => {
    render(
      <SelfRating
        repertoireId="rep-1"
        currentRating={3}
        updatedAt={null}
      />
    );
    const starButtons = screen.getAllByRole('button');
    expect(starButtons).toHaveLength(5);
  });

  it('renders star buttons with accessible labels', () => {
    render(
      <SelfRating
        repertoireId="rep-1"
        currentRating={null}
        updatedAt={null}
      />
    );
    expect(screen.getByRole('button', { name: /1 - struggling/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /2 - needs work/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /3 - okay/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /4 - comfortable/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /5 - mastered/i })).toBeInTheDocument();
  });

  it('star buttons have 48px touch target sizing (w-12 h-12)', () => {
    render(
      <SelfRating
        repertoireId="rep-1"
        currentRating={2}
        updatedAt={null}
      />
    );
    const starButtons = screen.getAllByRole('button');
    starButtons.forEach((btn) => {
      // w-12 = 48px, h-12 = 48px
      expect(btn.className).toContain('w-12');
      expect(btn.className).toContain('h-12');
    });
  });

  it('calls updateSelfRatingAction with correct rating when clicked', () => {
    render(
      <SelfRating
        repertoireId="rep-1"
        currentRating={null}
        updatedAt={null}
      />
    );
    const star4 = screen.getByRole('button', { name: /4 - comfortable/i });
    fireEvent.click(star4);
    expect(mockUpdateSelfRating).toHaveBeenCalledWith('rep-1', 4);
  });

  it('calls with correct value for star 1', () => {
    render(
      <SelfRating
        repertoireId="rep-2"
        currentRating={null}
        updatedAt={null}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /1 - struggling/i }));
    expect(mockUpdateSelfRating).toHaveBeenCalledWith('rep-2', 1);
  });

  it('calls with correct value for star 5', () => {
    render(
      <SelfRating
        repertoireId="rep-3"
        currentRating={null}
        updatedAt={null}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /5 - mastered/i }));
    expect(mockUpdateSelfRating).toHaveBeenCalledWith('rep-3', 5);
  });

  it('displays "Tap to rate" label when no rating is selected', () => {
    render(
      <SelfRating
        repertoireId="rep-1"
        currentRating={null}
        updatedAt={null}
      />
    );
    expect(screen.getByText('Tap to rate')).toBeInTheDocument();
  });

  it('displays the rating label for the current rating', () => {
    render(
      <SelfRating
        repertoireId="rep-1"
        currentRating={3}
        updatedAt={null}
      />
    );
    expect(screen.getByText('Okay')).toBeInTheDocument();
  });

  it('disables star buttons when isReadOnly is true', () => {
    render(
      <SelfRating
        repertoireId="rep-1"
        currentRating={4}
        updatedAt="2026-03-10T10:00:00Z"
        isReadOnly
      />
    );
    const starButtons = screen.getAllByRole('button');
    starButtons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it('does not call updateSelfRatingAction when read-only', () => {
    render(
      <SelfRating
        repertoireId="rep-1"
        currentRating={3}
        updatedAt={null}
        isReadOnly
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /5 - mastered/i }));
    expect(mockUpdateSelfRating).not.toHaveBeenCalled();
  });

  it('renders formatted date when isReadOnly and updatedAt is provided', () => {
    render(
      <SelfRating
        repertoireId="rep-1"
        currentRating={4}
        updatedAt="2026-03-10T10:00:00Z"
        isReadOnly
      />
    );
    // Should show something like "(Mar 10)" depending on locale
    const dateText = screen.getByText(/mar/i);
    expect(dateText).toBeInTheDocument();
  });

  it('renders the radiogroup role when not read-only', () => {
    render(
      <SelfRating
        repertoireId="rep-1"
        currentRating={null}
        updatedAt={null}
      />
    );
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it('does not render radiogroup role when read-only', () => {
    render(
      <SelfRating
        repertoireId="rep-1"
        currentRating={3}
        updatedAt={null}
        isReadOnly
      />
    );
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('applies filled styling to stars at or below current rating', () => {
    render(
      <SelfRating
        repertoireId="rep-1"
        currentRating={3}
        updatedAt={null}
      />
    );
    const starIcons = screen.getAllByTestId('star-icon');
    // Stars 1-3 should have fill-amber-400 class
    expect(starIcons[0].getAttribute('class')).toContain('fill-amber-400');
    expect(starIcons[1].getAttribute('class')).toContain('fill-amber-400');
    expect(starIcons[2].getAttribute('class')).toContain('fill-amber-400');
    // Stars 4-5 should have fill-none
    expect(starIcons[3].getAttribute('class')).toContain('fill-none');
    expect(starIcons[4].getAttribute('class')).toContain('fill-none');
  });
});
