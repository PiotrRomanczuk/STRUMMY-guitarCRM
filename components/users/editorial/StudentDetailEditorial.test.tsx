/**
 * Component tests: StudentDetailEditorial page shell
 *
 * Covers the parts of the shell NOT already covered by
 * StudentDetailEditorial.Repertoire's dedicated test (status-select
 * interaction is intentionally not re-tested here — see
 * __tests__/components/users/student-detail-editorial-repertoire.test.tsx):
 *  - profile header (name/email/joined date, fallbacks, shadow badge)
 *  - "About this student" preferences line
 *  - shadow-only actions (invite/delete) gating
 *  - "Import songs" link
 *  - header stats (songs in progress / mastered / total practice)
 *  - Repertoire card delegation (canEdit passthrough, empty state)
 *  - Lessons card (empty state, rendered rows, untitled fallback)
 *
 * @see components/users/editorial/StudentDetailEditorial.tsx
 * @see docs/app-blueprint/93-design-mockup-audit.md (Student Detail rows)
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';

import type {
  StudentPreferences,
  StudentProfile,
  StudentRecentLesson,
  StudentRepertoireRow,
} from '@/lib/services/student-detail-queries';

const mockRefresh = jest.fn();
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ refresh: mockRefresh, push: mockPush })),
}));

const mockUpdateRepertoireEntryAction = jest.fn();
jest.mock('@/app/actions/repertoire', () => ({
  updateRepertoireEntryAction: (...args: unknown[]) => mockUpdateRepertoireEntryAction(...args),
}));

const mockInviteShadowUser = jest.fn();
const mockDeleteShadowUser = jest.fn();
jest.mock('@/app/dashboard/actions', () => ({
  inviteShadowUser: (...args: unknown[]) => mockInviteShadowUser(...args),
  deleteShadowUser: (...args: unknown[]) => mockDeleteShadowUser(...args),
}));

import { StudentDetailEditorial } from '@/components/users/editorial/StudentDetailEditorial';

const buildProfile = (overrides: Partial<StudentProfile> = {}): StudentProfile => ({
  id: 'student-1',
  fullName: 'Jamie Fret',
  email: 'jamie@example.com',
  createdAt: '2026-01-15T12:00:00Z',
  isShadow: false,
  inviteEmail: null,
  ...overrides,
});

const buildRepertoireRow = (
  overrides: Partial<StudentRepertoireRow> = {}
): StudentRepertoireRow => ({
  id: 'repertoire-1',
  songId: 'song-1',
  songTitle: 'Wonderwall',
  songAuthor: 'Oasis',
  status: 'to_learn',
  totalPracticeMinutes: 0,
  lastPracticedAt: null,
  ...overrides,
});

const buildLesson = (overrides: Partial<StudentRecentLesson> = {}): StudentRecentLesson => ({
  id: 'lesson-1',
  scheduledAt: '2026-01-20T12:00:00Z',
  status: 'completed',
  title: 'Intro to chords',
  ...overrides,
});

const buildPreferences = (overrides: Partial<StudentPreferences> = {}): StudentPreferences => ({
  skillLevel: 'beginner',
  goals: ['Fingerstyle', 'Songwriting'],
  learningStyle: [],
  ...overrides,
});

describe('StudentDetailEditorial', () => {
  beforeEach(() => {
    mockRefresh.mockReset();
    mockPush.mockReset();
    mockUpdateRepertoireEntryAction.mockReset();
    mockInviteShadowUser.mockReset();
    mockDeleteShadowUser.mockReset();
  });

  it('renders the profile header: name, email, and joined date', () => {
    render(
      <StudentDetailEditorial
        profile={buildProfile()}
        repertoire={[]}
        lessons={[]}
        preferences={null}
      />
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Jamie Fret' })).toBeInTheDocument();
    expect(screen.getByText('jamie@example.com')).toBeInTheDocument();
    expect(screen.getByText(/Student · joined Jan 15, 2026/)).toBeInTheDocument();
  });

  it('falls back to email when fullName is missing', () => {
    render(
      <StudentDetailEditorial
        profile={buildProfile({ fullName: null, email: 'noname@example.com' })}
        repertoire={[]}
        lessons={[]}
        preferences={null}
      />
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'noname@example.com' })
    ).toBeInTheDocument();
  });

  it('falls back to "Student" and hides the email line when both name and email are missing', () => {
    render(
      <StudentDetailEditorial
        profile={buildProfile({ fullName: null, email: null })}
        repertoire={[]}
        lessons={[]}
        preferences={null}
      />
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Student' })).toBeInTheDocument();
    expect(screen.queryByText('jamie@example.com')).not.toBeInTheDocument();
  });

  it('shows the shadow badge and shadow-only actions for a shadow profile', () => {
    render(
      <StudentDetailEditorial
        profile={buildProfile({ isShadow: true, inviteEmail: 'invite@example.com' })}
        repertoire={[]}
        lessons={[]}
        preferences={null}
      />
    );

    expect(screen.getByText('Unclaimed')).toBeInTheDocument();
    expect(screen.getByTestId('invite-shadow-open')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('hides the shadow badge and shadow-only actions for a claimed profile', () => {
    render(
      <StudentDetailEditorial
        profile={buildProfile({ isShadow: false })}
        repertoire={[]}
        lessons={[]}
        preferences={null}
      />
    );

    expect(screen.queryByText('Unclaimed')).not.toBeInTheDocument();
    expect(screen.queryByTestId('invite-shadow-open')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('renders the "Import songs" link pointing at the student\'s import route', () => {
    render(
      <StudentDetailEditorial
        profile={buildProfile({ id: 'student-42' })}
        repertoire={[]}
        lessons={[]}
        preferences={null}
      />
    );

    expect(screen.getByRole('link', { name: 'Import songs' })).toHaveAttribute(
      'href',
      '/dashboard/users/student-42/import'
    );
  });

  it('renders the onboarding preferences line when present', () => {
    render(
      <StudentDetailEditorial
        profile={buildProfile()}
        repertoire={[]}
        lessons={[]}
        preferences={buildPreferences()}
      />
    );

    const aboutLine = screen.getByTestId('student-about-line');
    expect(aboutLine).toBeInTheDocument();
    expect(screen.getByText('beginner')).toBeInTheDocument();
    expect(screen.getByText('Fingerstyle')).toBeInTheDocument();
    expect(screen.getByText('Songwriting')).toBeInTheDocument();
  });

  it('omits the preferences line when the student never completed onboarding', () => {
    render(
      <StudentDetailEditorial
        profile={buildProfile()}
        repertoire={[]}
        lessons={[]}
        preferences={null}
      />
    );

    expect(screen.queryByTestId('student-about-line')).not.toBeInTheDocument();
  });

  it('computes header stats from the repertoire rows', () => {
    const repertoire = [
      buildRepertoireRow({ id: 'r1', songId: 's1', status: 'mastered', totalPracticeMinutes: 120 }),
      buildRepertoireRow({ id: 'r2', songId: 's2', status: 'started', totalPracticeMinutes: 30 }),
      buildRepertoireRow({ id: 'r3', songId: 's3', status: 'to_learn', totalPracticeMinutes: 0 }),
    ];

    render(
      <StudentDetailEditorial
        profile={buildProfile()}
        repertoire={repertoire}
        lessons={[]}
        preferences={null}
      />
    );

    // active = not "to_learn" (mastered + started); mastered = status === "mastered"
    // Scoped to the stats block: a repertoire row's own status label can also
    // read "Mastered", so an unscoped query would match twice.
    const statsBlock = screen.getByText('Songs in progress').parentElement!.parentElement!;
    expect(within(statsBlock).getByText('Songs in progress').nextElementSibling).toHaveTextContent(
      '2'
    );
    expect(within(statsBlock).getByText('Mastered').nextElementSibling).toHaveTextContent('1');
    expect(within(statsBlock).getByText('Total practice').nextElementSibling).toHaveTextContent(
      '2h 30m'
    );
  });

  it('shows zeroed stats when there is no repertoire yet', () => {
    render(
      <StudentDetailEditorial
        profile={buildProfile()}
        repertoire={[]}
        lessons={[]}
        preferences={null}
      />
    );

    expect(screen.getByText('Songs in progress').nextElementSibling).toHaveTextContent('0');
    expect(screen.getByText('Mastered').nextElementSibling).toHaveTextContent('0');
    expect(screen.getByText('Total practice').nextElementSibling).toHaveTextContent('0m');
  });

  it('delegates repertoire rows to the Repertoire sub-component with canEdit=false by default', () => {
    render(
      <StudentDetailEditorial
        profile={buildProfile()}
        repertoire={[buildRepertoireRow()]}
        lessons={[]}
        preferences={null}
      />
    );

    expect(screen.getByText('Songs the student is learning')).toBeInTheDocument();
    expect(screen.getByText('Wonderwall')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('passes canEdit=true through to the Repertoire sub-component', () => {
    render(
      <StudentDetailEditorial
        profile={buildProfile()}
        repertoire={[buildRepertoireRow()]}
        lessons={[]}
        preferences={null}
        canEdit
      />
    );

    expect(screen.getByRole('combobox', { name: /status for wonderwall/i })).toBeInTheDocument();
  });

  it('renders the repertoire empty state when there is no repertoire', () => {
    render(
      <StudentDetailEditorial
        profile={buildProfile()}
        repertoire={[]}
        lessons={[]}
        preferences={null}
      />
    );

    expect(screen.getByText('No songs assigned yet.')).toBeInTheDocument();
  });

  it('renders the lessons empty state when there are no lessons', () => {
    render(
      <StudentDetailEditorial
        profile={buildProfile()}
        repertoire={[]}
        lessons={[]}
        preferences={null}
      />
    );

    expect(screen.getByText('No lessons yet.')).toBeInTheDocument();
  });

  it('renders lesson rows with formatted date, status, and a link to the lesson', () => {
    const lesson = buildLesson();
    const expectedDate = new Date(lesson.scheduledAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    render(
      <StudentDetailEditorial
        profile={buildProfile()}
        repertoire={[]}
        lessons={[lesson]}
        preferences={null}
      />
    );

    expect(screen.getByText('Intro to chords')).toBeInTheDocument();
    expect(screen.getByText(`${expectedDate} · completed`)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Intro to chords/i })).toHaveAttribute(
      'href',
      '/dashboard/lessons/lesson-1'
    );
  });

  it('falls back to "Untitled lesson" when a lesson has no title', () => {
    render(
      <StudentDetailEditorial
        profile={buildProfile()}
        repertoire={[]}
        lessons={[buildLesson({ title: null })]}
        preferences={null}
      />
    );

    expect(screen.getByText('Untitled lesson')).toBeInTheDocument();
  });
});
