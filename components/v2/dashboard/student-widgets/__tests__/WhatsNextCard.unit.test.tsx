import { render, screen } from '@testing-library/react';
import { WhatsNextCard } from '../WhatsNextCard';

// next/link renders a plain <a> in the jsdom test environment
jest.mock('next/link', () => {
  const MockLink = ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  );
  MockLink.displayName = 'Link';
  return MockLink;
});

const FUTURE_DATE = new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString();

const NEXT_LESSON = {
  id: 'lesson-1',
  title: 'Fingerpicking Basics',
  scheduled_at: FUTURE_DATE,
};

const TOP_ASSIGNMENT = {
  id: 'assign-1',
  title: 'Practice C major scale',
  due_date: null,
  status: 'in_progress',
};

describe('WhatsNextCard', () => {
  it('renders empty state when no content provided', () => {
    render(<WhatsNextCard nextLesson={null} topAssignment={null} />);
    expect(screen.getByText('Nothing scheduled. Enjoy your free time!')).toBeInTheDocument();
  });

  it('renders "View lesson details" link when a next lesson is provided', () => {
    render(<WhatsNextCard nextLesson={NEXT_LESSON} topAssignment={null} />);

    expect(screen.getByText('View lesson details')).toBeInTheDocument();
    expect(screen.queryByText('Join Lesson')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('links to the correct lesson detail page', () => {
    render(<WhatsNextCard nextLesson={NEXT_LESSON} topAssignment={null} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `/dashboard/lessons/${NEXT_LESSON.id}`);
  });

  it('displays the lesson title when provided', () => {
    render(<WhatsNextCard nextLesson={NEXT_LESSON} topAssignment={null} />);
    expect(screen.getByText('Fingerpicking Basics')).toBeInTheDocument();
  });

  it('falls back to "Upcoming Lesson" when lesson title is null', () => {
    render(<WhatsNextCard nextLesson={{ ...NEXT_LESSON, title: null }} topAssignment={null} />);
    expect(screen.getByText('Upcoming Lesson')).toBeInTheDocument();
  });

  it('renders the assignment block when topAssignment is provided', () => {
    render(<WhatsNextCard nextLesson={null} topAssignment={TOP_ASSIGNMENT} />);
    expect(screen.getByText('Practice C major scale')).toBeInTheDocument();
    expect(screen.getByText('No due date')).toBeInTheDocument();
  });

  it('renders both lesson and assignment when both are provided', () => {
    render(<WhatsNextCard nextLesson={NEXT_LESSON} topAssignment={TOP_ASSIGNMENT} />);
    expect(screen.getByText('View lesson details')).toBeInTheDocument();
    expect(screen.getByText('Practice C major scale')).toBeInTheDocument();
  });
});
