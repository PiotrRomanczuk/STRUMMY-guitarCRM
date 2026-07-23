/**
 * Component tests: LessonDetailEditorial — the shell backing
 * /dashboard/lessons/[id].
 *
 * The embedded PostLessonSummaryAI generator already has dedicated coverage
 * (components/lessons/PostLessonSummaryAI.test.tsx), so here it is mocked to
 * a lightweight stub. The per-song stepper's server action is likewise mocked
 * so these tests stay in jsdom and only assert the wiring: which stage the
 * click maps to, and that students never see interactive controls.
 *
 * @see components/lessons/editorial/LessonDetailEditorial.tsx
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import type {
  ContinuityLesson,
  LessonAssignment,
  LessonDetail,
} from '@/lib/services/lesson-detail-queries';

jest.mock('@/lib/config/features', () => ({ SHOW_AI_FEATURES: true }));
jest.mock('@/components/lessons/PostLessonSummaryAI', () => ({
  PostLessonSummaryAI: ({ studentName }: { studentName: string }) => (
    <div data-testid="post-lesson-summary-ai">AI summary for {studentName}</div>
  ),
}));

const updateLessonSongStatusMock = jest.fn();
jest.mock('@/app/dashboard/lessons/actions', () => ({
  updateLessonSongStatus: (...args: unknown[]) => updateLessonSongStatusMock(...args),
}));

import { LessonDetailEditorial } from './LessonDetailEditorial';

/**
 * `LessonDetailEditorial` reads `SHOW_AI_FEATURES` as a live property access
 * on the mocked module (`_features.SHOW_AI_FEATURES`) on every render, not a
 * value captured once at import time — Babel's CJS-interop for plain named
 * imports compiles to a direct property read, not a copied binding. So we
 * can flip it per-test by mutating the exact object Jest hands back for this
 * mock via `jest.requireMock`, and it will be picked up on the next render.
 */
const featuresMock = jest.requireMock('@/lib/config/features') as { SHOW_AI_FEATURES: boolean };

afterEach(() => {
  featuresMock.SHOW_AI_FEATURES = true;
  updateLessonSongStatusMock.mockClear();
});

const makeLesson = (overrides: Partial<LessonDetail> = {}): LessonDetail => ({
  id: 'lesson-1',
  scheduledAt: '2026-07-20T15:00:00.000Z',
  status: 'completed',
  title: 'Fingerstyle basics',
  notes: 'Great progress on the intro riff.',
  lessonTeacherNumber: 12,
  teacherId: 'teacher-1',
  teacherName: 'Sarah Chen',
  studentId: 'student-1',
  studentName: 'Emma Stone',
  studentEmail: 'emma@strummy.app',
  songs: [
    { songId: 'song-1', title: 'Wonderwall', author: 'Oasis', key: 'G', status: 'started' },
    { songId: 'song-2', title: 'Blackbird', author: 'The Beatles', key: null, status: null },
  ],
  ...overrides,
});

const makeAssignment = (overrides: Partial<LessonAssignment> = {}): LessonAssignment => ({
  id: 'assignment-1',
  title: 'Practice the intro riff',
  dueDate: '2026-08-01T00:00:00.000Z',
  status: 'not_started',
  ...overrides,
});

const makeContinuity = (overrides: Partial<ContinuityLesson> = {}): ContinuityLesson => ({
  id: 'lesson-0',
  lessonTeacherNumber: 11,
  scheduledAt: '2026-07-13T15:00:00.000Z',
  title: 'Chord transitions',
  notes: null,
  status: 'COMPLETED',
  ...overrides,
});

describe('LessonDetailEditorial — content rendering', () => {
  it('renders the lesson title, status, student, and repertoire', () => {
    render(<LessonDetailEditorial lesson={makeLesson()} canEdit={false} />);

    expect(screen.getByRole('heading', { name: 'Fingerstyle basics' })).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Emma Stone' })).toHaveAttribute(
      'href',
      '/dashboard/users/student-1'
    );
    expect(screen.getByText(/Songs in this lesson · 2/)).toBeInTheDocument();
    expect(screen.getByText('Wonderwall')).toBeInTheDocument();
    expect(screen.getByText('Oasis')).toBeInTheDocument();
    expect(screen.getByText('Blackbird')).toBeInTheDocument();
    expect(screen.getByText('Great progress on the intro riff.')).toBeInTheDocument();
  });

  it('falls back to "Untitled lesson" and the student email when data is missing', () => {
    render(
      <LessonDetailEditorial
        lesson={makeLesson({ title: null, studentName: null })}
        canEdit={false}
      />
    );

    expect(screen.getByRole('heading', { name: 'Untitled lesson' })).toBeInTheDocument();
    const emailLinks = screen.getAllByRole('link', { name: 'emma@strummy.app' });
    expect(emailLinks.length).toBeGreaterThan(0);
    emailLinks.forEach((link) =>
      expect(link).toHaveAttribute('href', '/dashboard/users/student-1')
    );
  });

  it('shows the empty-repertoire message when no songs are attached', () => {
    render(<LessonDetailEditorial lesson={makeLesson({ songs: [] })} canEdit={false} />);

    expect(screen.getByText(/Songs in this lesson · 0/)).toBeInTheDocument();
    expect(screen.getByText('No songs attached to this lesson yet.')).toBeInTheDocument();
  });

  it('shows the empty-notes message when there are no notes', () => {
    render(<LessonDetailEditorial lesson={makeLesson({ notes: null })} canEdit={false} />);

    expect(
      screen.getByText('No notes captured from this lesson yet. Add them from the edit view.')
    ).toBeInTheDocument();
  });

  it('only renders the Edit lesson link when canEdit is true', () => {
    const { rerender } = render(<LessonDetailEditorial lesson={makeLesson()} canEdit={false} />);
    expect(screen.queryByRole('link', { name: /Edit lesson/i })).not.toBeInTheDocument();

    rerender(<LessonDetailEditorial lesson={makeLesson()} canEdit={true} />);
    expect(screen.getByRole('link', { name: /Edit lesson/i })).toHaveAttribute(
      'href',
      '/dashboard/lessons/lesson-1/edit'
    );
  });
});

describe('LessonDetailEditorial — lesson info card', () => {
  it('renders the lesson-number badge and sequence line', () => {
    render(<LessonDetailEditorial lesson={makeLesson()} canEdit={false} />);

    expect(screen.getByText('Lesson #12')).toBeInTheDocument();
    expect(screen.getByText('Lesson #12 with Emma')).toBeInTheDocument();
    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
  });

  it('degrades gracefully when there is no lesson number', () => {
    render(
      <LessonDetailEditorial lesson={makeLesson({ lessonTeacherNumber: null })} canEdit={false} />
    );

    expect(screen.queryByText(/Lesson #/)).not.toBeInTheDocument();
    // "With Emma" now appears twice: the sequence fallback (this row degrading)
    // and the always-present Continuity card header.
    expect(screen.getAllByText('With Emma')).toHaveLength(2);
  });
});

describe('LessonDetailEditorial — assignments card', () => {
  it('lists homework attached to the lesson', () => {
    render(
      <LessonDetailEditorial
        lesson={makeLesson()}
        canEdit={false}
        assignments={[makeAssignment(), makeAssignment({ id: 'a2', title: 'Metronome drill' })]}
      />
    );

    expect(screen.getByText('Assignments · 2')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Practice the intro riff' })).toHaveAttribute(
      'href',
      '/dashboard/assignments/assignment-1'
    );
    expect(screen.getByText('Metronome drill')).toBeInTheDocument();
    expect(screen.getAllByText(/^Due /).length).toBe(2);
  });

  it('shows an empty state and hides Add when the viewer cannot edit', () => {
    render(<LessonDetailEditorial lesson={makeLesson()} canEdit={false} assignments={[]} />);

    expect(screen.getByText('No homework attached to this lesson.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Add/i })).not.toBeInTheDocument();
  });

  it('exposes the Add affordance to editors', () => {
    render(<LessonDetailEditorial lesson={makeLesson()} canEdit={true} assignments={[]} />);

    expect(screen.getByRole('link', { name: /Add/i })).toHaveAttribute(
      'href',
      '/dashboard/assignments/new'
    );
  });
});

describe('LessonDetailEditorial — continuity card', () => {
  it('lists previous lessons with the same student', () => {
    render(
      <LessonDetailEditorial
        lesson={makeLesson()}
        canEdit={false}
        continuity={[makeContinuity(), makeContinuity({ id: 'lesson-x', title: 'Barre chords' })]}
      />
    );

    expect(screen.getByText('With Emma')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Chord transitions/ })).toHaveAttribute(
      'href',
      '/dashboard/lessons/lesson-0'
    );
    expect(screen.getByText('Barre chords')).toBeInTheDocument();
  });

  it('shows an empty state when there is no history', () => {
    render(<LessonDetailEditorial lesson={makeLesson()} canEdit={false} continuity={[]} />);

    expect(screen.getByText('No previous lessons with Emma.')).toBeInTheDocument();
  });
});

describe('LessonDetailEditorial — per-song progress stepper', () => {
  it('lets an editor advance a song stage via the server action', async () => {
    render(<LessonDetailEditorial lesson={makeLesson()} canEdit={true} />);

    const masterButtons = screen.getAllByLabelText('Set status to Mastered');
    fireEvent.click(masterButtons[0]);

    await waitFor(() =>
      expect(updateLessonSongStatusMock).toHaveBeenCalledWith('lesson-1', 'song-1', 'mastered')
    );
  });

  it('renders the stepper read-only for students (no interactive controls)', () => {
    render(<LessonDetailEditorial lesson={makeLesson()} canEdit={false} />);

    expect(screen.queryByLabelText('Set status to Mastered')).not.toBeInTheDocument();
  });
});

describe('LessonDetailEditorial — AI summary gating', () => {
  it('renders the AI summary when the feature flag is on, the lesson is completed, and canEdit is true', () => {
    render(<LessonDetailEditorial lesson={makeLesson({ status: 'completed' })} canEdit={true} />);

    expect(screen.getByTestId('post-lesson-summary-ai')).toBeInTheDocument();
    expect(screen.getByText('AI summary for Emma Stone')).toBeInTheDocument();
  });

  it('hides the AI summary when the feature flag is off', () => {
    featuresMock.SHOW_AI_FEATURES = false;

    render(<LessonDetailEditorial lesson={makeLesson({ status: 'completed' })} canEdit={true} />);

    expect(screen.queryByTestId('post-lesson-summary-ai')).not.toBeInTheDocument();
  });

  it('hides the AI summary when the viewer cannot edit', () => {
    render(<LessonDetailEditorial lesson={makeLesson({ status: 'completed' })} canEdit={false} />);

    expect(screen.queryByTestId('post-lesson-summary-ai')).not.toBeInTheDocument();
  });

  it('hides the AI summary when the lesson has not happened yet (not completed)', () => {
    render(<LessonDetailEditorial lesson={makeLesson({ status: 'scheduled' })} canEdit={true} />);

    expect(screen.queryByTestId('post-lesson-summary-ai')).not.toBeInTheDocument();
  });
});
