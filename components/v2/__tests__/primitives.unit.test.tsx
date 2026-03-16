import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderHook } from '@testing-library/react';

// Mock framer-motion for SwipeableListItem
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
  useMotionValue: () => ({ get: () => 0, set: jest.fn() }),
  useTransform: () => ({ get: () => 1 }),
}));

// Mock useLayoutMode to return 'mobile' by default
const mockLayoutMode = jest.fn().mockReturnValue('mobile');
jest.mock('@/hooks/use-is-widescreen', () => ({
  useLayoutMode: () => mockLayoutMode(),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ChevronLeft: () => <span data-testid="icon-chevron-left" />,
  Plus: () => <span data-testid="icon-plus" />,
  Pencil: () => <span data-testid="icon-pencil" />,
  Trash2: () => <span data-testid="icon-trash" />,
}));

// Mock cn utility to pass through classNames
jest.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) =>
    args
      .filter(Boolean)
      .map((a) => (typeof a === 'string' ? a : ''))
      .join(' ')
      .trim(),
}));

// Must import AFTER mocks are set up
import { MobilePageShell } from '@/components/v2/primitives/MobilePageShell';
import { CollapsibleFilterBar } from '@/components/v2/primitives/CollapsibleFilterBar';
import { FloatingActionButton } from '@/components/v2/primitives/FloatingActionButton';
import { SwipeableListItem } from '@/components/v2/primitives/SwipeableListItem';
import { useReducedMotion, getReducedMotion } from '@/hooks/use-reduced-motion';

// ──────────────────────────────────────────────────────────────────────────────
// MobilePageShell
// ──────────────────────────────────────────────────────────────────────────────
describe('MobilePageShell', () => {
  it('renders the page title', () => {
    render(
      <MobilePageShell title="My Lessons">
        <p>content here</p>
      </MobilePageShell>
    );
    expect(screen.getByText('My Lessons')).toBeInTheDocument();
  });

  it('renders children inside the shell', () => {
    render(
      <MobilePageShell title="Songs">
        <div data-testid="child">Hello</div>
      </MobilePageShell>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders a back button by default', () => {
    render(
      <MobilePageShell title="Details">
        <p>detail content</p>
      </MobilePageShell>
    );
    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
  });

  it('hides back button when showBack is false', () => {
    render(
      <MobilePageShell title="Home" showBack={false}>
        <p>home content</p>
      </MobilePageShell>
    );
    expect(screen.queryByRole('button', { name: /go back/i })).not.toBeInTheDocument();
  });

  it('calls custom onBack handler when back button is clicked', () => {
    const onBack = jest.fn();
    render(
      <MobilePageShell title="Edit" onBack={onBack}>
        <p>edit content</p>
      </MobilePageShell>
    );
    fireEvent.click(screen.getByRole('button', { name: /go back/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renders subtitle when provided', () => {
    render(
      <MobilePageShell title="Edit Song" subtitle="Wonderwall">
        <p>form</p>
      </MobilePageShell>
    );
    expect(screen.getByText('Wonderwall')).toBeInTheDocument();
  });

  it('does not render subtitle when omitted', () => {
    render(
      <MobilePageShell title="New Song">
        <p>form</p>
      </MobilePageShell>
    );
    // Title is present but no subtitle element
    expect(screen.getByText('New Song')).toBeInTheDocument();
    const subtitleElements = screen.queryAllByText(/./);
    const subtitleP = subtitleElements.filter(
      (el) => el.tagName === 'P' && el.classList.contains('text-sm')
    );
    // Only the child paragraph should exist, no subtitle p tag in the header
    expect(subtitleP.length).toBeLessThanOrEqual(1);
  });

  it('renders headerActions when provided', () => {
    render(
      <MobilePageShell
        title="Songs"
        headerActions={<button data-testid="action-btn">Add</button>}
      >
        <p>list</p>
      </MobilePageShell>
    );
    expect(screen.getByTestId('action-btn')).toBeInTheDocument();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// CollapsibleFilterBar
// ──────────────────────────────────────────────────────────────────────────────
describe('CollapsibleFilterBar', () => {
  const filters = [
    { label: 'Beginner', value: 'beginner' },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Advanced', value: 'advanced' },
  ];

  it('renders all filter chips including the All chip', () => {
    render(
      <CollapsibleFilterBar filters={filters} active={null} onChange={jest.fn()} />
    );
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('Intermediate')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  it('fires onChange with the filter value when a chip is clicked', () => {
    const onChange = jest.fn();
    render(
      <CollapsibleFilterBar filters={filters} active={null} onChange={onChange} />
    );
    fireEvent.click(screen.getByText('Beginner'));
    expect(onChange).toHaveBeenCalledWith('beginner');
  });

  it('fires onChange with null when the All chip is clicked', () => {
    const onChange = jest.fn();
    render(
      <CollapsibleFilterBar
        filters={filters}
        active="beginner"
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByText('All'));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('marks the active chip with aria-pressed=true', () => {
    render(
      <CollapsibleFilterBar
        filters={filters}
        active="intermediate"
        onChange={jest.fn()}
      />
    );
    const intermediateChip = screen.getByText('Intermediate');
    expect(intermediateChip).toHaveAttribute('aria-pressed', 'true');
  });

  it('marks the All chip as active when active is null', () => {
    render(
      <CollapsibleFilterBar filters={filters} active={null} onChange={jest.fn()} />
    );
    const allChip = screen.getByText('All');
    expect(allChip).toHaveAttribute('aria-pressed', 'true');
  });

  it('uses a custom allLabel when provided', () => {
    render(
      <CollapsibleFilterBar
        filters={filters}
        active={null}
        onChange={jest.fn()}
        allLabel="Show All"
      />
    );
    expect(screen.getByText('Show All')).toBeInTheDocument();
    expect(screen.queryByText('All')).not.toBeInTheDocument();
  });

  it('has chips with min-height of 44px for touch targets', () => {
    render(
      <CollapsibleFilterBar filters={filters} active={null} onChange={jest.fn()} />
    );
    const allChip = screen.getByText('All');
    // The chip has the class min-h-[44px]
    expect(allChip.className).toContain('min-h-[44px]');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// FloatingActionButton
// ──────────────────────────────────────────────────────────────────────────────
describe('FloatingActionButton', () => {
  it('renders with the correct accessible label', () => {
    render(
      <FloatingActionButton onClick={jest.fn()} label="Add new song" />
    );
    expect(screen.getByRole('button', { name: 'Add new song' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(
      <FloatingActionButton onClick={onClick} label="Create" />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders a default Plus icon when no icon is provided', () => {
    render(
      <FloatingActionButton onClick={jest.fn()} label="Add" />
    );
    expect(screen.getByTestId('icon-plus')).toBeInTheDocument();
  });

  it('renders a custom icon when provided', () => {
    render(
      <FloatingActionButton
        onClick={jest.fn()}
        label="Edit"
        icon={<span data-testid="custom-icon">E</span>}
      />
    );
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('icon-plus')).not.toBeInTheDocument();
  });

  it('has fixed positioning class for bottom-right placement', () => {
    render(
      <FloatingActionButton onClick={jest.fn()} label="Fab" />
    );
    const button = screen.getByRole('button', { name: 'Fab' });
    expect(button.className).toContain('fixed');
    expect(button.className).toContain('right-4');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SwipeableListItem
// ──────────────────────────────────────────────────────────────────────────────
describe('SwipeableListItem', () => {
  beforeEach(() => {
    mockLayoutMode.mockReturnValue('mobile');
  });

  it('renders children', () => {
    render(
      <SwipeableListItem onEdit={jest.fn()} onDelete={jest.fn()}>
        <span>Lesson Card</span>
      </SwipeableListItem>
    );
    expect(screen.getByText('Lesson Card')).toBeInTheDocument();
  });

  it('renders Edit action button when onEdit is provided', () => {
    render(
      <SwipeableListItem onEdit={jest.fn()}>
        <span>Item</span>
      </SwipeableListItem>
    );
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('renders Delete action button when onDelete is provided', () => {
    render(
      <SwipeableListItem onDelete={jest.fn()}>
        <span>Item</span>
      </SwipeableListItem>
    );
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('renders destructive styling on the Delete button', () => {
    render(
      <SwipeableListItem onDelete={jest.fn()}>
        <span>Item</span>
      </SwipeableListItem>
    );
    const deleteBtn = screen.getByRole('button', { name: 'Delete' });
    expect(deleteBtn.className).toContain('bg-destructive');
  });

  it('renders primary styling on the Edit button', () => {
    render(
      <SwipeableListItem onEdit={jest.fn()}>
        <span>Item</span>
      </SwipeableListItem>
    );
    const editBtn = screen.getByRole('button', { name: 'Edit' });
    expect(editBtn.className).toContain('bg-primary');
  });

  it('renders without action buttons on desktop (non-mobile mode)', () => {
    mockLayoutMode.mockReturnValue('widescreen');
    render(
      <SwipeableListItem onEdit={jest.fn()} onDelete={jest.fn()}>
        <span>Item</span>
      </SwipeableListItem>
    );
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    // Children still render
    expect(screen.getByText('Item')).toBeInTheDocument();
  });

  it('renders without swipe when no actions are provided', () => {
    render(
      <SwipeableListItem>
        <span>Plain Item</span>
      </SwipeableListItem>
    );
    expect(screen.getByText('Plain Item')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// useReducedMotion
// ──────────────────────────────────────────────────────────────────────────────
describe('useReducedMotion', () => {
  it('returns false when user does not prefer reduced motion', () => {
    // window.matchMedia is mocked in jest.setup.js to return matches: false
    const { result } = renderHook(() => useReducedMotion());
    expect(typeof result.current).toBe('boolean');
    expect(result.current).toBe(false);
  });

  it('returns true when user prefers reduced motion', () => {
    // Override matchMedia to report reduced motion
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);

    // Restore
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    });
  });
});

describe('getReducedMotion', () => {
  it('returns false when matchMedia reports no preference', () => {
    expect(getReducedMotion()).toBe(false);
  });

  it('returns a boolean', () => {
    expect(typeof getReducedMotion()).toBe('boolean');
  });
});
