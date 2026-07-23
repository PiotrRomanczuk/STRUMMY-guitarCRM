/**
 * AssignmentsListEditorial — role-aware list shell backing
 * /dashboard/assignments for both teacher and student roles.
 *
 * Closes the coverage gap flagged in
 * docs/app-blueprint/93-design-mockup-audit.md ("Strummy - Assignments
 * Teacher.html" / "Strummy - Assignments Student.html" rows): this shell had
 * zero direct render-test coverage — only its sibling
 * AssignmentCreateEditorial form was tested.
 *
 * @see components/assignments/editorial/AssignmentsListEditorial.tsx
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';

import { AssignmentsListEditorial } from './AssignmentsListEditorial';
import type { AssignmentListCounts, AssignmentRow } from '@/lib/services/assignment-list-params';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn() })),
  usePathname: jest.fn(() => '/dashboard/assignments'),
}));

const buildRow = (overrides: Partial<AssignmentRow> = {}): AssignmentRow => ({
  id: 'assignment-1',
  title: 'Barre chord drill',
  status: 'in_progress',
  effectiveStatus: 'in_progress',
  dueDate: '2026-08-01T00:00:00Z',
  teacherId: 'teacher-1',
  studentId: 'student-1',
  studentName: 'Emma Stone',
  studentEmail: 'emma@example.com',
  createdAt: '2026-07-01T00:00:00Z',
  updatedAt: '2026-07-01T00:00:00Z',
  progress: { done: 2, total: 4 },
  ...overrides,
});

const emptyCounts = (): AssignmentListCounts => ({
  all: 0,
  not_started: 0,
  in_progress: 0,
  completed: 0,
  overdue: 0,
  cancelled: 0,
});

const buildCounts = (overrides: Partial<AssignmentListCounts> = {}): AssignmentListCounts => ({
  ...emptyCounts(),
  ...overrides,
});

describe('AssignmentsListEditorial', () => {
  describe('teacher view (asStudent=false)', () => {
    it('renders the "Teaching" eyebrow and student column', () => {
      const rows = [buildRow()];
      render(
        <AssignmentsListEditorial
          rows={rows}
          counts={buildCounts({ all: 1, in_progress: 1 })}
          asStudent={false}
          dir="asc"
        />
      );

      expect(screen.getByText('Teaching')).toBeInTheDocument();
      expect(screen.getByText('Student / Title')).toBeInTheDocument();
      expect(screen.getByText('Emma Stone')).toBeInTheDocument();
      expect(screen.getByText('Barre chord drill')).toBeInTheDocument();
    });

    it('shows the Templates and + New assignment links when canCreate is true', () => {
      render(
        <AssignmentsListEditorial
          rows={[buildRow()]}
          counts={buildCounts({ all: 1 })}
          asStudent={false}
          canCreate
          dir="asc"
        />
      );

      expect(screen.getByRole('link', { name: 'Templates' })).toHaveAttribute(
        'href',
        '/dashboard/assignments/templates'
      );
      expect(screen.getByRole('link', { name: '+ New assignment' })).toHaveAttribute(
        'href',
        '/dashboard/assignments/new'
      );
    });

    it('hides the create links when canCreate is false', () => {
      render(
        <AssignmentsListEditorial
          rows={[buildRow()]}
          counts={buildCounts({ all: 1 })}
          asStudent={false}
          dir="asc"
        />
      );

      expect(screen.queryByRole('link', { name: 'Templates' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: '+ New assignment' })).not.toBeInTheDocument();
    });

    it('renders the teacher empty-state copy when there are no rows', () => {
      render(
        <AssignmentsListEditorial rows={[]} counts={emptyCounts()} asStudent={false} dir="asc" />
      );

      expect(
        screen.getByText(
          'No assignments yet. Use “New assignment” above to set homework for a student.'
        )
      ).toBeInTheDocument();
    });
  });

  describe('student view (asStudent=true)', () => {
    it('renders the "From your teacher" eyebrow and hides the student column', () => {
      const rows = [buildRow()];
      render(
        <AssignmentsListEditorial
          rows={rows}
          counts={buildCounts({ all: 1, in_progress: 1 })}
          asStudent={true}
          dir="asc"
        />
      );

      expect(screen.getByText('From your teacher')).toBeInTheDocument();
      expect(screen.queryByText('Student / Title')).not.toBeInTheDocument();
      expect(screen.getByText('Title', { selector: 'span' })).toBeInTheDocument();
      expect(screen.getByText('Barre chord drill')).toBeInTheDocument();
      expect(screen.queryByText('Emma Stone')).not.toBeInTheDocument();
    });

    it('renders the student empty-state copy when there are no rows', () => {
      render(
        <AssignmentsListEditorial rows={[]} counts={emptyCounts()} asStudent={true} dir="asc" />
      );

      expect(screen.getByText('No assignments on your desk. Enjoy the quiet.')).toBeInTheDocument();
    });
  });

  it('shows a filtered empty-state message instead of the role copy when filters are active', () => {
    render(
      <AssignmentsListEditorial
        rows={[]}
        counts={emptyCounts()}
        asStudent={true}
        dir="asc"
        activeStatus="completed"
      />
    );

    expect(screen.getByText('No assignments match these filters.')).toBeInTheDocument();
    expect(
      screen.queryByText('No assignments on your desk. Enjoy the quiet.')
    ).not.toBeInTheDocument();
  });

  it('shows a singular overdue nudge for exactly one overdue assignment', () => {
    render(
      <AssignmentsListEditorial
        rows={[buildRow({ effectiveStatus: 'overdue' })]}
        counts={buildCounts({ all: 1, overdue: 1 })}
        asStudent={false}
        dir="asc"
      />
    );

    expect(screen.getByText('1 overdue assignment needs a nudge.')).toBeInTheDocument();
  });

  it('shows a plural overdue nudge for multiple overdue assignments and no banner when zero', () => {
    const { rerender } = render(
      <AssignmentsListEditorial
        rows={[buildRow({ id: 'a1' }), buildRow({ id: 'a2' })]}
        counts={buildCounts({ all: 2, overdue: 2 })}
        asStudent={false}
        dir="asc"
      />
    );
    expect(screen.getByText('2 overdue assignments need a nudge.')).toBeInTheDocument();

    rerender(
      <AssignmentsListEditorial
        rows={[buildRow()]}
        counts={buildCounts({ all: 1, in_progress: 1 })}
        asStudent={false}
        dir="asc"
      />
    );
    expect(screen.queryByText(/overdue/)).not.toBeInTheDocument();
  });

  it('renders the status label for each row', () => {
    render(
      <AssignmentsListEditorial
        rows={[buildRow({ effectiveStatus: 'completed', status: 'completed' })]}
        counts={buildCounts({ all: 1, completed: 1 })}
        asStudent={true}
        dir="asc"
      />
    );

    const rowLink = screen.getByRole('link', { name: /Barre chord drill/i });
    expect(within(rowLink).getByText('Completed')).toBeInTheDocument();
  });

  describe('checklist progress column', () => {
    it('shows a Progress header and per-row done/total in the teacher view', () => {
      render(
        <AssignmentsListEditorial
          rows={[buildRow({ progress: { done: 2, total: 4 } })]}
          counts={buildCounts({ all: 1, in_progress: 1 })}
          asStudent={false}
          dir="asc"
        />
      );

      expect(screen.getByText('Progress', { selector: 'span' })).toBeInTheDocument();
      const rowLink = screen.getByRole('link', { name: /Barre chord drill/i });
      expect(within(rowLink).getByText('2/4')).toBeInTheDocument();
    });

    it('renders a dash placeholder for a teacher row with no checklist', () => {
      render(
        <AssignmentsListEditorial
          rows={[buildRow({ progress: { done: 0, total: 0 } })]}
          counts={buildCounts({ all: 1, in_progress: 1 })}
          asStudent={false}
          dir="asc"
        />
      );

      const rowLink = screen.getByRole('link', { name: /Barre chord drill/i });
      expect(within(rowLink).getByTitle('No checklist on this assignment')).toBeInTheDocument();
    });

    it('hides the Progress column and count from the student view', () => {
      render(
        <AssignmentsListEditorial
          rows={[buildRow({ progress: { done: 2, total: 4 } })]}
          counts={buildCounts({ all: 1, in_progress: 1 })}
          asStudent={true}
          dir="asc"
        />
      );

      expect(screen.queryByText('Progress', { selector: 'span' })).not.toBeInTheDocument();
      const rowLink = screen.getByRole('link', { name: /Barre chord drill/i });
      expect(within(rowLink).queryByText('2/4')).not.toBeInTheDocument();
    });
  });
});
