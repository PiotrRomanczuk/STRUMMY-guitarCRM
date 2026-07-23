/**
 * Shell-level render coverage for TeacherDashboardEditorial — the component
 * that composes TeacherGreeting, TeacherDaySpine, the BackfillCards widgets
 * (NeedsAttentionCard, OverdueAssignmentsCard, WeekDensityCard,
 * UtilizationCard, StudentRosterCard) and the Direction-A delta cards
 * (QuickActionsCard, ActivityFeedCard, SongOfWeekCard) into the teacher
 * dashboard page.
 *
 * @see components/dashboard/editorial/teacher/TeacherDashboardEditorial.tsx
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { TeacherDashboardEditorial } from './TeacherDashboardEditorial';
import type { SongOfWeekView } from './TeacherDeltaCards';
import type {
  AtRiskStudent,
  OverdueAssignmentRow,
  RosterStudent,
  Utilization,
  WeekDensityDay,
} from '@/lib/services/teacher-dashboard-backfill-queries';
import type { StudioActivityItem } from '@/lib/services/teacher-dashboard-activity';
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

const ACTIVITY: StudioActivityItem[] = [
  {
    id: 'practice-p1',
    type: 'practice',
    actorName: 'Ava Reyes',
    actorEmail: 'ava@example.com',
    action: 'practiced',
    object: 'Blackbird',
    // ~2h before NOW (2026-07-20 14:05 local) so the label is deterministic.
    occurredAt: new Date(2026, 6, 20, 12, 5, 0).toISOString(),
  },
];

const SONG_OF_WEEK: SongOfWeekView = {
  id: 'song-hotel-california',
  title: 'Hotel California',
  author: 'Eagles',
  level: 'intermediate',
  songKey: 'Bm',
  capoFret: 7,
  tempo: 74,
  teacherMessage: 'Focus on the intro arpeggio.',
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
  activity: ACTIVITY,
  songOfWeek: SONG_OF_WEEK,
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

  it('renders week density, utilization, and roster sections', () => {
    render(<TeacherDashboardEditorial {...baseProps} />);

    expect(screen.getByText('Week density')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();

    expect(screen.getByText('Utilization')).toBeInTheDocument();
    expect(screen.getByText('31%')).toBeInTheDocument();
    expect(screen.getByText('12.5h / 40h')).toBeInTheDocument();

    expect(screen.getByText('Roster')).toBeInTheDocument();
    const rosterLink = screen.getByText('Ivy Chen').closest('a');
    expect(rosterLink).toHaveAttribute('href', '/dashboard/users/student-ivy');
  });

  it('renders the quick-actions card with verified routes', () => {
    render(<TeacherDashboardEditorial {...baseProps} />);

    expect(screen.getByText('Quick actions')).toBeInTheDocument();
    expect(screen.getByText('New lesson').closest('a')).toHaveAttribute(
      'href',
      '/dashboard/lessons/new'
    );
    expect(screen.getByText('Assignment').closest('a')).toHaveAttribute(
      'href',
      '/dashboard/assignments/new'
    );
    expect(screen.getByText('Add song').closest('a')).toHaveAttribute(
      'href',
      '/dashboard/songs/new'
    );
    expect(screen.getByText('Invite student').closest('a')).toHaveAttribute(
      'href',
      '/dashboard/users/new'
    );
  });

  it('renders the studio activity feed with actor, action and relative time', () => {
    render(<TeacherDashboardEditorial {...baseProps} />);

    expect(screen.getByText('Recent across your studio')).toBeInTheDocument();
    expect(screen.getByText('practiced')).toBeInTheDocument();
    expect(screen.getByText('Blackbird')).toBeInTheDocument();
    expect(screen.getByText('2h')).toBeInTheDocument();
  });

  it('shows an empty activity message when there is no studio activity', () => {
    render(<TeacherDashboardEditorial {...baseProps} activity={[]} />);

    expect(screen.getByText(/No studio activity in the last month\./)).toBeInTheDocument();
  });

  it('renders the song of the week with metadata and an assign CTA', () => {
    render(<TeacherDashboardEditorial {...baseProps} />);

    expect(screen.getByText('Song of the week')).toBeInTheDocument();
    const songTitle = screen.getByText('Hotel California');
    expect(songTitle.closest('a')).toHaveAttribute(
      'href',
      '/dashboard/songs/song-hotel-california'
    );
    expect(screen.getByText('KEY Bm')).toBeInTheDocument();
    expect(screen.getByText('CAPO 7')).toBeInTheDocument();
    expect(screen.getByText('Focus on the intro arpeggio.')).toBeInTheDocument();

    const assign = screen.getByText('Assign →');
    expect(assign.closest('a')).toHaveAttribute('href', '/dashboard/assignments/new');
  });

  it('shows an empty song-of-the-week message when none is selected', () => {
    render(<TeacherDashboardEditorial {...baseProps} songOfWeek={null} />);

    expect(screen.getByText(/No song of the week selected yet\./)).toBeInTheDocument();
    expect(screen.queryByText('Assign →')).not.toBeInTheDocument();
  });
});
