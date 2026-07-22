/**
 * Shell-level render coverage for TeacherDashboardEditorial — the component
 * that composes TeacherGreeting, TeacherDaySpine, and the BackfillCards
 * widgets (NeedsAttentionCard, OverdueAssignmentsCard, WeekDensityCard,
 * UtilizationCard, StudentRosterCard, SongLibraryCard) into the teacher
 * dashboard page.
 *
 * @see components/dashboard/editorial/teacher/TeacherDashboardEditorial.tsx
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { TeacherDashboardEditorial } from './TeacherDashboardEditorial';
import type {
  AtRiskStudent,
  OverdueAssignmentRow,
  RosterStudent,
  SongLibrarySummary,
  Utilization,
  WeekDensityDay,
} from '@/lib/services/teacher-dashboard-backfill-queries';
import type { DayLesson, TeacherDayStats } from '@/lib/services/teacher-dashboard-queries';

// Local time components (not a 'Z' ISO literal) so greetingFor()/getHours()
// behave the same regardless of the machine/CI timezone running the suite.
const NOW = new Date(2026, 6, 20, 14, 5, 0);

const LESSONS: DayLesson[] = [
  {
    id: 'lesson-1',
    scheduledAt: new Date(2026, 6, 20, 15, 0, 0).toISOString(),
    status: 'scheduled',
    title: null,
    studentId: 'student-emma',
    studentName: 'Emma Stone',
    studentEmail: 'emma@example.com',
    songs: [{ songId: 'song-halleluja', title: 'Hallelujah', songKey: 'C' }],
  },
];

const STATS: TeacherDayStats = { count: 1, totalMinutes: 45 };

const AT_RISK: AtRiskStudent[] = [
  {
    studentId: 'student-liam',
    name: 'Liam Fox',
    email: 'liam@example.com',
    lastPracticedAt: new Date(2026, 6, 1).toISOString(),
    daysSincePractice: 19,
  },
];

const OVERDUE_ASSIGNMENTS: OverdueAssignmentRow[] = [
  {
    id: 'assign-1',
    title: 'Practice scales',
    dueDate: new Date(2026, 6, 15).toISOString(),
    studentName: 'Noah Bell',
    studentEmail: 'noah@example.com',
  },
];

const WEEK_DENSITY: WeekDensityDay[] = [
  { weekday: 'Mon', count: 2 },
  { weekday: 'Tue', count: 0 },
  { weekday: 'Wed', count: 1 },
  { weekday: 'Thu', count: 3 },
  { weekday: 'Fri', count: 0 },
  { weekday: 'Sat', count: 0 },
  { weekday: 'Sun', count: 0 },
];

const UTILIZATION: Utilization = { bookedHours: 12.5, nominalHours: 40, pct: 31 };

const ROSTER: RosterStudent[] = [
  {
    studentId: 'student-ivy',
    name: 'Ivy Chen',
    email: 'ivy@example.com',
    lastLessonAt: new Date(2026, 6, 18).toISOString(),
  },
];

const LIBRARY: SongLibrarySummary = {
  total: 42,
  recent: [{ id: 'song-wonderwall', title: 'Wonderwall', author: 'Oasis' }],
};

const baseProps = {
  fullName: 'Sarah Connor',
  email: 'sarah@example.com',
  now: NOW,
  lessons: LESSONS,
  stats: STATS,
  atRisk: AT_RISK,
  overdueAssignments: OVERDUE_ASSIGNMENTS,
  weekDensity: WEEK_DENSITY,
  utilization: UTILIZATION,
  roster: ROSTER,
  library: LIBRARY,
};

describe('TeacherDashboardEditorial', () => {
  it('renders the teacher greeting with the provided name and today’s stats', () => {
    render(<TeacherDashboardEditorial {...baseProps} />);

    expect(screen.getByText('Good afternoon, Sarah.')).toBeInTheDocument();
    expect(screen.getByText('1 lesson')).toBeInTheDocument();
    expect(screen.getByText(/scheduled · 45m of teaching\./)).toBeInTheDocument();
  });

  it('renders today’s schedule with the lesson roster in TeacherDaySpine', () => {
    render(<TeacherDashboardEditorial {...baseProps} />);

    expect(screen.getByText(/Today’s schedule/)).toBeInTheDocument();
    expect(screen.getByText('Emma Stone')).toBeInTheDocument();
    expect(screen.getByText('Hallelujah')).toBeInTheDocument();

    const lessonLink = screen.getByText('Emma Stone').closest('a');
    expect(lessonLink).toHaveAttribute('href', '/dashboard/lessons/lesson-1');
  });

  it('renders needs-attention students with a link to their profile', () => {
    render(<TeacherDashboardEditorial {...baseProps} />);

    expect(screen.getByText('Needs attention')).toBeInTheDocument();
    expect(screen.getByText('Liam Fox')).toBeInTheDocument();
    expect(screen.getByText('19d')).toBeInTheDocument();

    const link = screen.getByText('Liam Fox').closest('a');
    expect(link).toHaveAttribute('href', '/dashboard/users/student-liam');
  });

  it('shows the empty needs-attention copy when no students are at risk', () => {
    render(<TeacherDashboardEditorial {...baseProps} atRisk={[]} />);

    expect(screen.getByText(/Everyone.s on track this week\./)).toBeInTheDocument();
    expect(screen.queryByText('Liam Fox')).not.toBeInTheDocument();
  });

  it('renders overdue assignments with a link to the assignment', () => {
    render(<TeacherDashboardEditorial {...baseProps} />);

    expect(screen.getByText('Overdue homework')).toBeInTheDocument();
    expect(screen.getByText('Noah Bell')).toBeInTheDocument();
    expect(screen.getByText('Practice scales')).toBeInTheDocument();

    const link = screen.getByText('Practice scales').closest('a');
    expect(link).toHaveAttribute('href', '/dashboard/assignments/assign-1');
  });

  it('hides the overdue homework card when there are no overdue assignments', () => {
    render(<TeacherDashboardEditorial {...baseProps} overdueAssignments={[]} />);

    expect(screen.queryByText('Overdue homework')).not.toBeInTheDocument();
  });

  it('renders week density, utilization, roster, and song library sections', () => {
    render(<TeacherDashboardEditorial {...baseProps} />);

    expect(screen.getByText('Week density')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();

    expect(screen.getByText('Utilization')).toBeInTheDocument();
    expect(screen.getByText('31%')).toBeInTheDocument();
    expect(screen.getByText('12.5h / 40h')).toBeInTheDocument();

    expect(screen.getByText('Roster')).toBeInTheDocument();
    expect(screen.getByText('Ivy Chen')).toBeInTheDocument();
    const rosterLink = screen.getByText('Ivy Chen').closest('a');
    expect(rosterLink).toHaveAttribute('href', '/dashboard/users/student-ivy');

    expect(screen.getByText('Wonderwall')).toBeInTheDocument();
    expect(screen.getByText('Oasis')).toBeInTheDocument();
    const viewAllLink = screen.getByText('View all 42 →');
    expect(viewAllLink).toHaveAttribute('href', '/dashboard/songs');
  });
});
