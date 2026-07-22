/**
 * EmptyState (default export, `components/shared/EmptyState.tsx`) — generic
 * empty-list/table placeholder. Verifies the audit gap flagged in
 * `docs/app-blueprint/93-design-mockup-audit.md` ("Strummy - Empty State.html"
 * row — 0% line coverage, no dedicated test file).
 *
 * NOTE: this is the default-exported `components/shared/EmptyState.tsx`, not
 * the unrelated named-export `components/dashboard/states/EmptyState.tsx`.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Music } from 'lucide-react';

import EmptyState from '@/components/shared/EmptyState';

describe('EmptyState', () => {
  it('renders the title, description, and icon for the default variant', () => {
    const { container } = render(
      <EmptyState icon={Music} title="No songs yet" description="Add your first song" />
    );

    expect(screen.getByText('No songs yet')).toBeInTheDocument();
    expect(screen.getByText('Add your first song')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();

    // Default variant: plain padded div, no Card wrapper
    expect(container.querySelector('[data-slot="card"]')).not.toBeInTheDocument();
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('py-12');
  });

  it('renders without a description when none is provided', () => {
    render(<EmptyState title="No songs yet" />);

    expect(screen.getByText('No songs yet')).toBeInTheDocument();
    expect(screen.queryByText('Add your first song')).not.toBeInTheDocument();
  });

  it('wraps content in a Card for the card variant', () => {
    const { container } = render(
      <EmptyState variant="card" title="No lessons scheduled" description="Schedule one" />
    );

    expect(container.querySelector('[data-slot="card"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="card-content"]')).toHaveClass('py-12');
    expect(screen.getByText('No lessons scheduled')).toBeInTheDocument();
  });

  it('renders a compact padded div (no Card) for the table-cell variant', () => {
    const { container } = render(
      <EmptyState variant="table-cell" icon={Music} title="No students found" />
    );

    expect(container.querySelector('[data-slot="card"]')).not.toBeInTheDocument();
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('py-8');
    expect(wrapper).not.toHaveClass('py-12');
  });

  it('produces structurally distinct output across all three variants', () => {
    const { container: defaultContainer } = render(<EmptyState title="Default" />);
    const { container: cardContainer } = render(<EmptyState variant="card" title="Card" />);
    const { container: tableCellContainer } = render(
      <EmptyState variant="table-cell" title="Table cell" />
    );

    expect(defaultContainer.querySelector('[data-slot="card"]')).toBeNull();
    expect(cardContainer.querySelector('[data-slot="card"]')).not.toBeNull();
    expect(tableCellContainer.querySelector('[data-slot="card"]')).toBeNull();

    expect((defaultContainer.firstChild as HTMLElement).className).not.toBe(
      (tableCellContainer.firstChild as HTMLElement).className
    );
  });

  it('renders an action link when action.href is provided', () => {
    render(<EmptyState title="No songs yet" action={{ label: 'Add Song', href: '/songs/new' }} />);

    const link = screen.getByRole('link', { name: 'Add Song' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/songs/new');
  });

  it('renders an action button that calls onClick when action.onClick is provided', () => {
    const onClick = jest.fn();
    render(<EmptyState title="No lessons scheduled" action={{ label: 'Schedule', onClick }} />);

    const button = screen.getByRole('button', { name: 'Schedule' });
    expect(button).toBeInTheDocument();
    button.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders no action element when action is not provided', () => {
    render(<EmptyState title="No students found" />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders the icon only when no illustration is provided, and vice versa', () => {
    const { container, rerender } = render(<EmptyState title="No songs yet" icon={Music} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(container.querySelector('img')).not.toBeInTheDocument();

    rerender(
      <EmptyState title="No songs yet" icon={Music} illustration="/images/empty-songs.svg" />
    );
    expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute('src', '/images/empty-songs.svg');
  });
});
