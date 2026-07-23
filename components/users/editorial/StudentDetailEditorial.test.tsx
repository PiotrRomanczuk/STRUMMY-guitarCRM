/**
 * Component tests: StudentDetailEditorial page shell
 *
 * Covers the shell around the dedicated Repertoire test
 * (__tests__/components/users/student-detail-editorial-repertoire.test.tsx):
 *  - profile header (name/email/joined date, fallbacks, shadow badge)
 *  - health badge + reach-out CTA (at-risk framing)
 *  - "About this student" preferences line
 *  - shadow-only actions (invite/delete) gating + "Import songs" link
 *  - header stats (songs in progress / mastered / total practice)
 *  - Overview: practice chart, next lesson, teacher note
 *  - tab switching to Repertoire / Lessons / Practice Log
 *
 * @see components/users/editorial/StudentDetailEditorial.tsx
 */

import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';

import type {
  StudentPreferences,
  StudentProfile,
  StudentRecentLesson,
  StudentRepertoireRow,
} from '@/lib/services/student-detail-queries';
import type { PracticeDay } from '@/lib/services/student-health.helpers';
import type {
  LatestNote,
  NextLesson,
  PracticeSessionRow,
} from '@/lib/services/student-health-queries';

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

const daysAgoIso = (n: number): string => new Date(Date.now() - n * 86_400_000).toISOString();

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

type DetailProps = {
  profile?: StudentProfile;
  repertoire?: StudentRepertoireRow[];
  lessons?: StudentRecentLesson[];
  preferences?: StudentPreferences | null;
  practiceHistory?: PracticeDay[];
  practiceSessions?: PracticeSessionRow[];
  nextLesson?: NextLesson;
  latestNote?: LatestNote;
  canEdit?: boolean;
};

const renderDetail = (props: DetailProps = {}) =>
  render(
    <StudentDetailEditorial
      profile={props.profile ?? buildProfile()}
      repertoire={props.repertoire ?? []}
      lessons={props.lessons ?? []}
      preferences={props.preferences ?? null}
      practiceHistory={props.practiceHistory ?? []}
      practiceSessions={props.practiceSessions ?? []}
      nextLesson={props.nextLesson ?? null}
      latestNote={props.latestNote ?? null}
      canEdit={props.canEdit}
    />
  );

const openTab = (name: RegExp) => fireEvent.click(screen.getByRole('tab', { name }));

describe('StudentDetailEditorial', () => {
  beforeEach(() => {
    mockRefresh.mockReset();
    mockPush.mockReset();
    mockUpdateRepertoireEntryAction.mockReset();
    mockInviteShadowUser.mockReset();
    mockDeleteShadowUser.mockReset();
  });

  it('renders the profile header: name, email, and joined date', () => {
    renderDetail();
    expect(screen.getByRole('heading', { level: 1, name: /Jamie Fret/ })).toBeInTheDocument();
    expect(screen.getByText('jamie@example.com')).toBeInTheDocument();
    expect(screen.getByText(/Student · joined Jan 15, 2026/)).toBeInTheDocument();
  });

  it('falls back to email when fullName is missing', () => {
    renderDetail({ profile: buildProfile({ fullName: null, email: 'noname@example.com' }) });
    expect(
      screen.getByRole('heading', { level: 1, name: /noname@example.com/ })
    ).toBeInTheDocument();
  });

  it('falls back to "Student" and hides the email line when both name and email are missing', () => {
    renderDetail({ profile: buildProfile({ fullName: null, email: null }) });
    expect(screen.getByRole('heading', { level: 1, name: /Student/ })).toBeInTheDocument();
    expect(screen.queryByText('jamie@example.com')).not.toBeInTheDocument();
  });

  it('shows an at-risk health badge and reach-out CTA when the student has never practiced', () => {
    renderDetail();
    const badge = screen.getByTestId('student-health-badge');
    expect(badge).toHaveAttribute('data-status', 'at_risk');
    expect(badge).toHaveTextContent('At risk');
    expect(screen.getByText(/No practice logged yet/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Reach out' })).toHaveAttribute(
      'href',
      'mailto:jamie@example.com'
    );
  });

  it('shows an on-track badge and a Message CTA for a recently-practiced student', () => {
    renderDetail({ repertoire: [buildRepertoireRow({ lastPracticedAt: daysAgoIso(2) })] });
    const badge = screen.getByTestId('student-health-badge');
    expect(badge).toHaveAttribute('data-status', 'on_track');
    expect(screen.getByRole('link', { name: 'Message' })).toBeInTheDocument();
  });

  it('shows the shadow badge and shadow-only actions for a shadow profile', () => {
    renderDetail({ profile: buildProfile({ isShadow: true, inviteEmail: 'invite@example.com' }) });
    expect(screen.getByText('Unclaimed')).toBeInTheDocument();
    expect(screen.getByTestId('invite-shadow-open')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('hides the shadow badge and shadow-only actions for a claimed profile', () => {
    renderDetail({ profile: buildProfile({ isShadow: false }) });
    expect(screen.queryByText('Unclaimed')).not.toBeInTheDocument();
    expect(screen.queryByTestId('invite-shadow-open')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('renders the "Import songs" link pointing at the student\'s import route', () => {
    renderDetail({ profile: buildProfile({ id: 'student-42' }) });
    expect(screen.getByRole('link', { name: 'Import songs' })).toHaveAttribute(
      'href',
      '/dashboard/users/student-42/import'
    );
  });

  it('renders the onboarding preferences line when present', () => {
    renderDetail({ preferences: buildPreferences() });
    expect(screen.getByTestId('student-about-line')).toBeInTheDocument();
    expect(screen.getByText('beginner')).toBeInTheDocument();
    expect(screen.getByText('Fingerstyle')).toBeInTheDocument();
    expect(screen.getByText('Songwriting')).toBeInTheDocument();
  });

  it('omits the preferences line when the student never completed onboarding', () => {
    renderDetail({ preferences: null });
    expect(screen.queryByTestId('student-about-line')).not.toBeInTheDocument();
  });

  it('computes header stats from the repertoire rows', () => {
    const repertoire = [
      buildRepertoireRow({ id: 'r1', songId: 's1', status: 'mastered', totalPracticeMinutes: 120 }),
      buildRepertoireRow({ id: 'r2', songId: 's2', status: 'started', totalPracticeMinutes: 30 }),
      buildRepertoireRow({ id: 'r3', songId: 's3', status: 'to_learn', totalPracticeMinutes: 0 }),
    ];
    renderDetail({ repertoire });

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
    renderDetail();
    expect(screen.getByText('Songs in progress').nextElementSibling).toHaveTextContent('0');
    expect(screen.getByText('Mastered').nextElementSibling).toHaveTextContent('0');
    expect(screen.getByText('Total practice').nextElementSibling).toHaveTextContent('0m');
  });

  it('renders the practice chart with the trailing-week total on the Overview tab', () => {
    const practiceHistory: PracticeDay[] = Array.from({ length: 14 }, (_, i) => ({
      date: `2026-07-${String(i + 1).padStart(2, '0')}`,
      minutes: 10,
    }));
    renderDetail({ practiceHistory });
    expect(screen.getByText(/Practice minutes/)).toBeInTheDocument();
    // trailing 7 days * 10 min = 70 => "1h 10m"
    expect(screen.getByText('1h 10m')).toBeInTheDocument();
    expect(screen.getByText('this week')).toBeInTheDocument();
  });

  it('renders the next lesson with a reschedule link, or a schedule nudge when empty', () => {
    const nextLesson: NextLesson = {
      id: 'lesson-9',
      scheduledAt: '2026-08-01T15:00:00Z',
      status: 'scheduled',
      title: 'Week 3',
    };
    const { rerender } = renderDetail({ nextLesson });
    expect(screen.getByRole('link', { name: /Reschedule now/ })).toHaveAttribute(
      'href',
      '/dashboard/lessons/lesson-9/edit'
    );

    rerender(
      <StudentDetailEditorial
        profile={buildProfile()}
        repertoire={[]}
        lessons={[]}
        preferences={null}
        practiceHistory={[]}
        practiceSessions={[]}
        nextLesson={null}
        latestNote={null}
      />
    );
    expect(screen.getByText('No upcoming lesson.')).toBeInTheDocument();
  });

  it('renders the latest teacher note sourced from a lesson', () => {
    const latestNote: LatestNote = {
      lessonId: 'lesson-5',
      lessonTitle: 'Barre chords',
      scheduledAt: '2026-01-10T12:00:00Z',
      note: 'Great progress on the F chord.',
    };
    renderDetail({ latestNote });
    expect(screen.getByText(/Great progress on the F chord/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open lesson/ })).toHaveAttribute(
      'href',
      '/dashboard/lessons/lesson-5'
    );
  });

  it('delegates repertoire rows to the Repertoire tab with canEdit=false by default', () => {
    renderDetail({ repertoire: [buildRepertoireRow()] });
    openTab(/Repertoire/);
    expect(screen.getByText('Songs the student is learning')).toBeInTheDocument();
    expect(screen.getByText('Wonderwall')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('passes canEdit=true through to the Repertoire tab', () => {
    renderDetail({ repertoire: [buildRepertoireRow()], canEdit: true });
    openTab(/Repertoire/);
    expect(screen.getByRole('combobox', { name: /status for wonderwall/i })).toBeInTheDocument();
  });

  it('renders the repertoire empty state on the Repertoire tab', () => {
    renderDetail();
    openTab(/Repertoire/);
    expect(screen.getByText('No songs assigned yet.')).toBeInTheDocument();
  });

  it('renders the lessons empty state on the Overview tab', () => {
    renderDetail();
    expect(screen.getByText('No lessons yet.')).toBeInTheDocument();
  });

  it('renders lesson rows with formatted date, status, and a link to the lesson', () => {
    const lesson = buildLesson();
    const expectedDate = new Date(lesson.scheduledAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    renderDetail({ lessons: [lesson] });
    expect(screen.getByText('Intro to chords')).toBeInTheDocument();
    expect(screen.getByText(`${expectedDate} · completed`)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Intro to chords/i })).toHaveAttribute(
      'href',
      '/dashboard/lessons/lesson-1'
    );
  });

  it('falls back to "Untitled lesson" when a lesson has no title', () => {
    renderDetail({ lessons: [buildLesson({ title: null })] });
    expect(screen.getByText('Untitled lesson')).toBeInTheDocument();
  });

  it('shows logged practice sessions on the Practice Log tab', () => {
    const practiceSessions: PracticeSessionRow[] = [
      {
        id: 'ps-1',
        createdAt: '2026-07-20T09:00:00Z',
        durationMinutes: 25,
        songTitle: 'Blackbird',
        notes: 'Slow but steady',
      },
    ];
    renderDetail({ practiceSessions });
    openTab(/Practice Log/);
    expect(screen.getByText('Blackbird')).toBeInTheDocument();
    expect(screen.getByText('Slow but steady')).toBeInTheDocument();
    expect(screen.getByText('25m')).toBeInTheDocument();
  });
});
