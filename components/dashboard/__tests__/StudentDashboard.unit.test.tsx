import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StudentDashboardClient } from '@/components/dashboard/student/StudentDashboardClient';
import type { StudentDashboardData } from '@/app/actions/student/dashboard';

// Mock framer-motion to render children without animation
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
}));

// Mock animation variants
jest.mock('@/lib/animations', () => ({
  staggerContainer: {},
  listItem: {},
  fadeInUp: {},
  fastStaggerContainer: {},
}));

// Mock child components to isolate StudentDashboardClient
jest.mock('@/components/dashboard/student/RecentActivity', () => ({
  RecentActivity: ({ activities }: { activities: unknown[] }) => (
    <div data-testid="recent-activity">
      Recent Activity ({activities.length} items)
    </div>
  ),
}));

jest.mock('@/components/songs/student/SongLibrary', () => ({
  SongLibrary: ({ songs }: { songs: unknown[] }) => (
    <div data-testid="song-library">Song Library ({songs.length} songs)</div>
  ),
}));

jest.mock('@/components/assignments/student/AssignmentList', () => ({
  AssignmentList: ({ assignments }: { assignments: unknown[] }) => (
    <div data-testid="assignment-list">
      Assignments ({assignments.length} items)
    </div>
  ),
}));

jest.mock('@/components/dashboard/DashboardStatsGrid', () => ({
  DashboardStatsGrid: () => (
    <div data-testid="dashboard-stats-grid">Stats Grid</div>
  ),
}));

jest.mock('@/components/dashboard/student/NextLessonCard', () => ({
  NextLessonCard: ({ lesson }: { lesson: unknown }) => (
    <div data-testid="next-lesson-card">
      {lesson ? 'Next Lesson' : 'No Upcoming Lesson'}
    </div>
  ),
}));

jest.mock('@/components/dashboard/student/LastLessonCard', () => ({
  LastLessonCard: ({ lesson }: { lesson: unknown }) => (
    <div data-testid="last-lesson-card">
      {lesson ? 'Last Lesson' : 'No Last Lesson'}
    </div>
  ),
}));

jest.mock('@/components/dashboard/student/ProgressChart', () => ({
  ProgressChart: ({ data }: { data: unknown[] }) => (
    <div data-testid="progress-chart">
      Progress Chart ({data.length} data points)
    </div>
  ),
}));

jest.mock('@/components/dashboard/student/PracticeTimerCard', () => ({
  PracticeTimerCard: ({ songs }: { songs: unknown[] }) => (
    <div data-testid="practice-timer-card">
      Practice Timer ({songs.length} songs)
    </div>
  ),
}));

jest.mock('@/components/dashboard/BearerTokenCard', () => ({
  BearerTokenCard: ({ token }: { token: string }) => (
    <div data-testid="bearer-token-card">Token: {token}</div>
  ),
}));

/**
 * Helper to build a complete StudentDashboardData object with sensible defaults.
 */
function createMockDashboardData(
  overrides: Partial<StudentDashboardData> = {}
): StudentDashboardData {
  return {
    studentName: 'Alice',
    nextLesson: {
      id: 'lesson-next-1',
      title: 'Fingerpicking Basics',
      scheduled_at: '2026-02-15T14:00:00Z',
    },
    lastLesson: {
      id: 'lesson-last-1',
      title: 'Chord Transitions',
      scheduled_at: '2026-02-10T14:00:00Z',
      notes: 'Good progress on barre chords',
    },
    assignments: [
      {
        id: 'assign-1',
        title: 'Practice G to C transition',
        due_date: '2026-02-14',
        status: 'not_started',
        description: 'Repeat 20 times daily',
      },
    ],
    recentSongs: [
      {
        id: 'song-1',
        title: 'Wonderwall',
        artist: 'Oasis',
        last_played: '2026-02-10T12:00:00Z',
      },
    ],
    allSongs: [
      { id: 'song-1', title: 'Wonderwall', artist: 'Oasis' },
      { id: 'song-2', title: 'Wish You Were Here', artist: 'Pink Floyd' },
    ],
    stats: {
      totalSongs: 5,
      completedLessons: 3,
      activeAssignments: 1,
      practiceHours: 12,
    },
    ...overrides,
  };
}

describe('StudentDashboardClient', () => {
  it('renders without crashing with complete mock data', () => {
    const data = createMockDashboardData();
    render(<StudentDashboardClient data={data} />);

    // The component should render the welcome heading
    expect(
      screen.getByText(/Welcome back, Alice!/i)
    ).toBeInTheDocument();
  });

  it('displays student name in the welcome message', () => {
    const data = createMockDashboardData({ studentName: 'Bob' });
    render(<StudentDashboardClient data={data} />);

    expect(screen.getByText(/Welcome back, Bob!/i)).toBeInTheDocument();
  });

  it('falls back to "Student" when studentName is null', () => {
    const data = createMockDashboardData({ studentName: null });
    render(<StudentDashboardClient data={data} />);

    expect(
      screen.getByText(/Welcome back, Student!/i)
    ).toBeInTheDocument();
  });

  it('displays lesson completion message when completedLessons > 0', () => {
    const data = createMockDashboardData({
      stats: {
        totalSongs: 5,
        completedLessons: 3,
        activeAssignments: 1,
        practiceHours: 12,
      },
    });
    render(<StudentDashboardClient data={data} />);

    expect(
      screen.getByText(/You've completed 3 lessons/i)
    ).toBeInTheDocument();
  });

  it('displays singular "lesson" when completedLessons is 1', () => {
    const data = createMockDashboardData({
      stats: {
        totalSongs: 1,
        completedLessons: 1,
        activeAssignments: 0,
        practiceHours: 2,
      },
    });
    render(<StudentDashboardClient data={data} />);

    expect(
      screen.getByText(/You've completed 1 lesson\./i)
    ).toBeInTheDocument();
  });

  it('displays default journey message when no lessons completed', () => {
    const data = createMockDashboardData({
      stats: {
        totalSongs: 0,
        completedLessons: 0,
        activeAssignments: 0,
        practiceHours: 0,
      },
    });
    render(<StudentDashboardClient data={data} />);

    expect(
      screen.getByText(/Here's what's happening with your guitar journey/i)
    ).toBeInTheDocument();
  });

  it('renders the DashboardStatsGrid component', () => {
    const data = createMockDashboardData();
    render(<StudentDashboardClient data={data} />);

    expect(screen.getByTestId('dashboard-stats-grid')).toBeInTheDocument();
  });

  it('renders the NextLessonCard', () => {
    const data = createMockDashboardData();
    render(<StudentDashboardClient data={data} />);

    expect(screen.getByTestId('next-lesson-card')).toBeInTheDocument();
    expect(screen.getByText('Next Lesson')).toBeInTheDocument();
  });

  it('renders LastLessonCard when lastLesson is present', () => {
    const data = createMockDashboardData();
    render(<StudentDashboardClient data={data} />);

    expect(screen.getByTestId('last-lesson-card')).toBeInTheDocument();
  });

  it('does not render LastLessonCard when lastLesson is null', () => {
    const data = createMockDashboardData({ lastLesson: null });
    render(<StudentDashboardClient data={data} />);

    expect(
      screen.queryByTestId('last-lesson-card')
    ).not.toBeInTheDocument();
  });

  it('renders ProgressChart with 7 data points (Mon-Sun)', () => {
    const data = createMockDashboardData();
    render(<StudentDashboardClient data={data} />);

    expect(
      screen.getByText('Progress Chart (7 data points)')
    ).toBeInTheDocument();
  });

  it('renders SongLibrary with transformed songs', () => {
    const data = createMockDashboardData({
      recentSongs: [
        {
          id: 'song-1',
          title: 'Wonderwall',
          artist: 'Oasis',
          last_played: '2026-02-10T12:00:00Z',
        },
        {
          id: 'song-2',
          title: 'Hotel California',
          artist: 'Eagles',
          last_played: '2026-02-09T12:00:00Z',
        },
      ],
    });
    render(<StudentDashboardClient data={data} />);

    expect(screen.getByText('Song Library (2 songs)')).toBeInTheDocument();
  });

  it('renders PracticeTimerCard with allSongs', () => {
    const data = createMockDashboardData({
      allSongs: [
        { id: 'song-1', title: 'Wonderwall', artist: 'Oasis' },
        { id: 'song-2', title: 'Wish You Were Here', artist: 'Pink Floyd' },
        { id: 'song-3', title: 'Stairway to Heaven', artist: 'Led Zeppelin' },
      ],
    });
    render(<StudentDashboardClient data={data} />);

    expect(
      screen.getByText('Practice Timer (3 songs)')
    ).toBeInTheDocument();
  });

  it('renders AssignmentList with transformed assignments', () => {
    const data = createMockDashboardData({
      assignments: [
        {
          id: 'a1',
          title: 'Assignment 1',
          due_date: '2026-02-14',
          status: 'not_started',
          description: null,
        },
        {
          id: 'a2',
          title: 'Assignment 2',
          due_date: null,
          status: 'in_progress',
          description: null,
        },
      ],
    });
    render(<StudentDashboardClient data={data} />);

    expect(
      screen.getByText('Assignments (2 items)')
    ).toBeInTheDocument();
  });

  it('does not render BearerTokenCard when token prop is absent', () => {
    const data = createMockDashboardData();
    render(<StudentDashboardClient data={data} />);

    expect(
      screen.queryByTestId('bearer-token-card')
    ).not.toBeInTheDocument();
  });

  it('renders RecentActivity with combined activities (capped at 5)', () => {
    const data = createMockDashboardData({
      lastLesson: {
        id: 'lesson-1',
        title: 'Intro Lesson',
        scheduled_at: '2026-02-10T14:00:00Z',
        notes: null,
      },
      recentSongs: [
        {
          id: 's1',
          title: 'Song A',
          artist: 'Artist A',
          last_played: '2026-02-10T12:00:00Z',
        },
        {
          id: 's2',
          title: 'Song B',
          artist: 'Artist B',
          last_played: '2026-02-09T12:00:00Z',
        },
        {
          id: 's3',
          title: 'Song C',
          artist: 'Artist C',
          last_played: '2026-02-08T12:00:00Z',
        },
        {
          id: 's4',
          title: 'Song D',
          artist: 'Artist D',
          last_played: '2026-02-07T12:00:00Z',
        },
        {
          id: 's5',
          title: 'Song E',
          artist: 'Artist E',
          last_played: '2026-02-06T12:00:00Z',
        },
        {
          id: 's6',
          title: 'Song F',
          artist: 'Artist F',
          last_played: '2026-02-05T12:00:00Z',
        },
      ],
    });
    render(<StudentDashboardClient data={data} />);

    // 1 lesson activity + 6 song activities = 7, but capped at 5
    expect(
      screen.getByText('Recent Activity (5 items)')
    ).toBeInTheDocument();
  });
});
