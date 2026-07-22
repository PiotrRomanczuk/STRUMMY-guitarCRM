/**
 * Component tests: LessonDetailEditorial — the shell backing
 * /dashboard/lessons/[id].
 *
 * The embedded PostLessonSummaryAI generator already has dedicated coverage
 * (components/lessons/PostLessonSummaryAI.test.tsx), so here it is mocked to
 * a lightweight stub — these tests only verify the *gating* logic: the
 * summary section only mounts when SHOW_AI_FEATURES is on, canEdit is true,
 * and the lesson status is "completed".
 *
 * @see components/lessons/editorial/LessonDetailEditorial.tsx
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import type { LessonDetail } from '@/lib/services/lesson-detail-queries';

jest.mock('@/lib/config/features', () => ({ SHOW_AI_FEATURES: true }));
jest.mock('@/components/lessons/PostLessonSummaryAI', () => ({
  PostLessonSummaryAI: ({ studentName }: { studentName: string }) => (
    <div data-testid="post-lesson-summary-ai">AI summary for {studentName}</div>
  ),
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
});

const makeLesson = (overrides: Partial<LessonDetail> = {}): LessonDetail => ({
  id: 'lesson-1',
  scheduledAt: '2026-07-20T15:00:00.000Z',
  status: 'completed',
  title: 'Fingerstyle basics',
  notes: 'Great progress on the intro riff.',
  teacherId: 'teacher-1',
  teacherName: 'Sarah Chen',
  studentId: 'student-1',
  studentName: 'Emma Stone',
  studentEmail: 'emma@strummy.app',
  songs: [
    { songId: 'song-1', title: 'Wonderwall', author: 'Oasis', key: 'G', status: 'in_progress' },
    { songId: 'song-2', title: 'Blackbird', author: 'The Beatles', key: null, status: null },
  ],
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
    expect(screen.getByRole('link', { name: 'emma@strummy.app' })).toBeInTheDocument();
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
