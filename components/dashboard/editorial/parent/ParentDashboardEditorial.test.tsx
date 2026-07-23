/**
 * Component tests: ParentDashboardEditorial (Family portal shell)
 *
 * Covers:
 *  - happy path: hero (child name, subtitle, stat chips), practice, upcoming
 *    lessons, billing placeholder, teacher note
 *  - no-linked-child empty state
 *  - on-track vs needs-attention practice badge
 *  - child switcher visibility (single vs multiple children)
 *
 * The component graph is presentation-only (types imported with `import type`),
 * so no Supabase/server module is loaded at runtime.
 *
 * @see components/dashboard/editorial/parent/ParentDashboardEditorial.tsx
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import type { ParentChild, ParentChildOverview } from '@/lib/services/parent-dashboard-queries';
import type { PracticeDay, PracticeWeek } from '@/lib/services/student-health.helpers';

import { ParentDashboardEditorial } from './ParentDashboardEditorial';

const buildDays = (): PracticeDay[] =>
  ['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'].map((label, i) => ({
    date: `2026-07-1${i}`,
    label,
    minutes: i === 6 ? 35 : i * 5,
    hasPractice: i > 0,
  }));

const buildWeek = (overrides: Partial<PracticeWeek> = {}): PracticeWeek => ({
  totalMinutes: 130,
  activeDays: 4,
  goalPerDay: 20,
  weeklyGoal: 140,
  onTrack: true,
  ...overrides,
});

const buildChild = (overrides: Partial<ParentChildOverview> = {}): ParentChildOverview => ({
  id: 'child-1',
  name: 'Lily Park',
  skillLevel: 'Beginner',
  teacherName: 'Dana Ross',
  streakDays: 7,
  songCount: 5,
  practiceWeek: buildWeek(),
  practiceDays: buildDays(),
  upcomingLessons: [
    {
      id: 'lesson-1',
      scheduledAt: '2026-07-28T16:00:00Z',
      title: 'Fingerstyle intro',
      teacherName: 'Dana Ross',
    },
  ],
  latestNote: {
    lessonId: 'lesson-0',
    note: 'Lily’s chord changes are really coming together.',
    teacherName: 'Dana Ross',
    lessonDate: '2026-07-14T16:00:00Z',
  },
  ...overrides,
});

const child = (id: string, name: string): ParentChild => ({ id, name, email: null });

const renderDashboard = (overrides: {
  childrenList?: ParentChild[];
  activeChildId?: string | null;
  child?: ParentChildOverview | null;
}) =>
  render(
    <ParentDashboardEditorial
      childrenList={overrides.childrenList ?? [child('child-1', 'Lily Park')]}
      activeChildId={'activeChildId' in overrides ? (overrides.activeChildId ?? null) : 'child-1'}
      child={'child' in overrides ? (overrides.child ?? null) : buildChild()}
    />
  );

describe('ParentDashboardEditorial', () => {
  it('renders the child check-in: hero, stats, practice, lessons, billing, note', () => {
    renderDashboard({});

    expect(screen.getByText('Checking in on')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Lily Park' })).toBeInTheDocument();
    expect(screen.getByText('Beginner · with Dana Ross')).toBeInTheDocument();

    expect(screen.getByText('day streak')).toBeInTheDocument();
    expect(screen.getByText('songs')).toBeInTheDocument();

    expect(screen.getByText('Recent practice')).toBeInTheDocument();
    expect(screen.getByText('Upcoming lessons')).toBeInTheDocument();
    expect(screen.getByText('Fingerstyle intro')).toBeInTheDocument();

    expect(screen.getByText('Billing')).toBeInTheDocument();
    expect(screen.getByText(/Invoices and auto-pay are coming soon/)).toBeInTheDocument();

    expect(screen.getByText('Latest note from Dana')).toBeInTheDocument();
    expect(
      screen.getByText('Lily’s chord changes are really coming together.')
    ).toBeInTheDocument();
  });

  it('shows the empty state when no child is linked', () => {
    renderDashboard({ childrenList: [], activeChildId: null, child: null });

    expect(screen.getByText('No child linked yet')).toBeInTheDocument();
    expect(screen.getByText(/Ask your teacher to connect your account/)).toBeInTheDocument();
    expect(screen.queryByText('Recent practice')).not.toBeInTheDocument();
  });

  it('shows an "On track this week" badge when practice clears the goal', () => {
    renderDashboard({ child: buildChild({ practiceWeek: buildWeek({ onTrack: true }) }) });

    expect(screen.getByText('On track this week')).toBeInTheDocument();
    expect(screen.queryByText('Needs attention')).not.toBeInTheDocument();
  });

  it('shows a "Needs attention" badge when practice is thin', () => {
    renderDashboard({
      child: buildChild({ practiceWeek: buildWeek({ totalMinutes: 40, onTrack: false }) }),
    });

    expect(screen.getByText('Needs attention')).toBeInTheDocument();
    expect(screen.queryByText('On track this week')).not.toBeInTheDocument();
  });

  it('renders a child switcher only when there is more than one child', () => {
    const { rerender } = renderDashboard({});
    expect(screen.queryByRole('link', { name: 'Lily Park' })).not.toBeInTheDocument();

    rerender(
      <ParentDashboardEditorial
        childrenList={[child('child-1', 'Lily Park'), child('child-2', 'Max Park')]}
        activeChildId="child-1"
        child={buildChild()}
      />
    );

    const lily = screen.getByRole('link', { name: 'Lily Park' });
    const max = screen.getByRole('link', { name: 'Max Park' });
    expect(lily).toHaveAttribute('href', '/dashboard?view=parent&child=child-1');
    expect(max).toHaveAttribute('href', '/dashboard?view=parent&child=child-2');
    expect(lily).toHaveAttribute('aria-current', 'true');
  });
});
