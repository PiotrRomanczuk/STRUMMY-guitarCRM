/**
 * Component tests: LessonsListEditorial — the shell backing /dashboard/lessons
 * for admin, teacher, and student roles (role is expressed via the
 * showStudentColumn / showTeacherColumn boolean props, not a single `role`
 * prop — see app/dashboard/lessons/page.tsx for the mapping).
 *
 * @see components/lessons/editorial/LessonsListEditorial.tsx
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';

import { LessonsListEditorial } from './LessonsListEditorial';
import type { LessonRow, LessonsBreakdown } from '@/lib/services/lessons-queries';

const NOW = new Date('2026-07-22T12:00:00.000Z');

const makeLesson = (overrides: Partial<LessonRow> = {}): LessonRow => ({
  id: 'lesson-1',
  scheduledAt: NOW.toISOString(),
  status: 'scheduled',
  title: 'Fingerstyle basics',
  teacherId: 'teacher-1',
  studentId: 'student-1',
  studentName: 'Emma Stone',
  studentEmail: 'emma@strummy.app',
  teacherName: 'Sarah Chen',
  teacherEmail: 'sarah@strummy.app',
  ...overrides,
});

const emptyBreakdown: LessonsBreakdown = { total: 0, byStatus: {} };

const baseProps = {
  breakdown: emptyBreakdown,
  activeStatuses: [] as string[],
  activeSort: 'newest' as const,
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('LessonsListEditorial — empty states by role', () => {
  it('shows student-facing copy and hides the create link for students', () => {
    render(
      <LessonsListEditorial
        {...baseProps}
        lessons={[]}
        canCreate={false}
        showStudentColumn={false}
        showTeacherColumn={false}
      />
    );

    expect(screen.getByText('Your lessons')).toBeInTheDocument();
    expect(screen.getByText('You have no lessons scheduled yet.')).toBeInTheDocument();
    expect(screen.getByText(/0 lessons/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /New lesson/i })).not.toBeInTheDocument();
  });

  it('shows teacher-facing copy and a create link for teachers', () => {
    render(
      <LessonsListEditorial
        {...baseProps}
        lessons={[]}
        canCreate={true}
        showStudentColumn={true}
        showTeacherColumn={false}
      />
    );

    expect(screen.getByText('Teaching')).toBeInTheDocument();
    expect(screen.getByText('No lessons yet. Schedule one to get started.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /New lesson/i })).toBeInTheDocument();
  });

  it('shows admin-facing copy across all teachers', () => {
    render(
      <LessonsListEditorial
        {...baseProps}
        lessons={[]}
        canCreate={true}
        showStudentColumn={true}
        showTeacherColumn={true}
      />
    );

    expect(screen.getByText('All lessons')).toBeInTheDocument();
    expect(screen.getByText('No lessons scheduled across your teachers yet.')).toBeInTheDocument();
  });
});

describe('LessonsListEditorial — lesson rendering', () => {
  it('groups lessons into time-based sections and renders titles, students, and status badges', () => {
    const lessons: LessonRow[] = [
      makeLesson({
        id: 'today',
        scheduledAt: new Date(NOW.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        title: 'Fingerstyle basics',
        status: 'scheduled',
        studentName: 'Emma Stone',
      }),
      makeLesson({
        id: 'this-week',
        scheduledAt: new Date(NOW.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        title: 'Barre chords',
        status: 'in_progress',
        studentName: 'Liam Rossi',
      }),
      makeLesson({
        id: 'upcoming',
        scheduledAt: new Date(NOW.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        title: 'Music theory intro',
        status: 'completed',
        studentName: 'Ava Kim',
      }),
      makeLesson({
        id: 'past',
        scheduledAt: new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        title: 'Warm-up drills',
        status: 'cancelled',
        studentName: 'Noah Diaz',
      }),
    ];

    render(
      <LessonsListEditorial
        {...baseProps}
        lessons={lessons}
        canCreate={true}
        showStudentColumn={true}
        showTeacherColumn={false}
      />
    );

    expect(screen.getByText(/4 lessons/)).toBeInTheDocument();

    // Section headers — one per non-empty time bucket, in timeline order.
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('This week')).toBeInTheDocument();
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
    expect(screen.getByText('Past')).toBeInTheDocument();

    // Each row is a single <Link> — scope per-row assertions with `within` so
    // status labels (which also appear as filter-pill text in the Header)
    // aren't ambiguous.
    const todayRow = screen.getByRole('link', { name: /Fingerstyle basics/ });
    expect(within(todayRow).getByText('Scheduled')).toBeInTheDocument();
    expect(within(todayRow).getByText('Emma Stone')).toBeInTheDocument();

    const thisWeekRow = screen.getByRole('link', { name: /Barre chords/ });
    expect(within(thisWeekRow).getByText('In progress')).toBeInTheDocument();
    expect(within(thisWeekRow).getByText('Liam Rossi')).toBeInTheDocument();

    const upcomingRow = screen.getByRole('link', { name: /Music theory intro/ });
    expect(within(upcomingRow).getByText('Completed')).toBeInTheDocument();
    expect(within(upcomingRow).getByText('Ava Kim')).toBeInTheDocument();

    const pastRow = screen.getByRole('link', { name: /Warm-up drills/ });
    expect(within(pastRow).getByText('Cancelled')).toBeInTheDocument();
    expect(within(pastRow).getByText('Noah Diaz')).toBeInTheDocument();

    // Teacher column is hidden for this (teacher) view.
    expect(screen.getByText('Student')).toBeInTheDocument();
    expect(screen.queryByText('Teacher')).not.toBeInTheDocument();
  });

  it('shows both student and teacher columns for the admin view', () => {
    render(
      <LessonsListEditorial
        {...baseProps}
        lessons={[makeLesson()]}
        canCreate={true}
        showStudentColumn={true}
        showTeacherColumn={true}
      />
    );

    expect(screen.getByText('Student')).toBeInTheDocument();
    expect(screen.getByText('Teacher')).toBeInTheDocument();
    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
  });

  it('falls back to email and "Untitled lesson" when name/title data is missing', () => {
    render(
      <LessonsListEditorial
        {...baseProps}
        lessons={[
          makeLesson({
            title: null,
            studentName: null,
            studentEmail: 'no-name@strummy.app',
          }),
        ]}
        canCreate={false}
        showStudentColumn={true}
        showTeacherColumn={false}
      />
    );

    expect(screen.getByText('Untitled lesson')).toBeInTheDocument();
    expect(screen.getByText('no-name@strummy.app')).toBeInTheDocument();
  });
});

describe('LessonsListEditorial — status filter pills', () => {
  it('marks active statuses as pressed, shows breakdown counts, and toggles hrefs', () => {
    const breakdown: LessonsBreakdown = {
      total: 5,
      byStatus: { scheduled: 2, in_progress: 1, completed: 1, cancelled: 1 },
    };

    render(
      <LessonsListEditorial
        {...baseProps}
        breakdown={breakdown}
        activeStatuses={['scheduled']}
        lessons={[makeLesson()]}
        canCreate={false}
        showStudentColumn={false}
        showTeacherColumn={false}
      />
    );

    const scheduledPill = screen.getByRole('button', { name: /Scheduled/i });
    expect(scheduledPill).toHaveAttribute('aria-pressed', 'true');
    // Toggling off the only active status clears the query string.
    expect(scheduledPill).toHaveAttribute('href', '/dashboard/lessons');

    const inProgressPill = screen.getByRole('button', { name: /In progress/i });
    expect(inProgressPill).toHaveAttribute('aria-pressed', 'false');
    expect(inProgressPill).toHaveAttribute(
      'href',
      '/dashboard/lessons?status=scheduled%2Cin_progress'
    );

    // Breakdown counts render next to each pill label.
    expect(scheduledPill).toHaveTextContent('2');
    expect(inProgressPill).toHaveTextContent('1');
  });
});
