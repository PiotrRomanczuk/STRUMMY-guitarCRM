import { render, screen } from '@testing-library/react';
import { LastLessonCard } from '../LastLessonCard';

const BASE_LESSON = {
  id: 'lesson-1',
  title: 'Barre Chords',
  scheduled_at: new Date(Date.now() - 86_400_000).toISOString(), // yesterday
  notes: null,
};

describe('LastLessonCard', () => {
  it('renders lesson title', () => {
    render(<LastLessonCard lesson={BASE_LESSON} />);
    expect(screen.getByText('Barre Chords')).toBeInTheDocument();
  });

  it('shows "Last Lesson" section heading', () => {
    render(<LastLessonCard lesson={BASE_LESSON} />);
    expect(screen.getByText(/last lesson/i)).toBeInTheDocument();
  });

  it('shows relative date for yesterday', () => {
    render(<LastLessonCard lesson={BASE_LESSON} />);
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
  });

  it('renders "View lesson details" link when no notes', () => {
    render(<LastLessonCard lesson={BASE_LESSON} />);
    const link = screen.getByRole('link', { name: /view lesson details/i });
    expect(link).toHaveAttribute('href', '/dashboard/lessons/lesson-1');
  });

  it('renders notes when present and truncates with Read more link', () => {
    const lessonWithNotes = {
      ...BASE_LESSON,
      notes: 'Focus on muting the strings with your index finger.',
    };
    render(<LastLessonCard lesson={lessonWithNotes} />);
    expect(
      screen.getByText('Focus on muting the strings with your index finger.')
    ).toBeInTheDocument();
    const readMore = screen.getByRole('link', { name: /read more/i });
    expect(readMore).toHaveAttribute('href', '/dashboard/lessons/lesson-1');
  });

  it('falls back to "Untitled Lesson" when title is null', () => {
    render(<LastLessonCard lesson={{ ...BASE_LESSON, title: null }} />);
    expect(screen.getByText('Untitled Lesson')).toBeInTheDocument();
  });
});
