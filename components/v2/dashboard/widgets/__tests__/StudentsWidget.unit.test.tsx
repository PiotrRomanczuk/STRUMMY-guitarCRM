import { render, screen } from '@testing-library/react';
import { StudentsWidget } from '../StudentsWidget';
import type { StudentV2 } from '@/types/teacher-dashboard-v2';

// date-fns formatDistanceToNow output varies with real time — mock it for stable snapshots
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  formatDistanceToNow: (_date: Date, _opts?: unknown) => '5 days ago',
}));

function makeStudent(overrides: Partial<StudentV2> = {}): StudentV2 {
  return {
    id: 'stu-1',
    name: 'Alice Smith',
    level: 'Intermediate',
    lessonsCompleted: 8,
    lastLessonAt: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    nextLessonAt: new Date(Date.now() + 2 * 86_400_000).toISOString(),
    overdueAssignmentCount: 0,
    repertoireCount: 4,
    ...overrides,
  };
}

describe('StudentsWidget', () => {
  it('renders empty state when no students', () => {
    render(<StudentsWidget students={[]} />);
    expect(screen.getByText('No students yet')).toBeInTheDocument();
  });

  it('renders student name, level, and repertoire count', () => {
    render(<StudentsWidget students={[makeStudent()]} />);
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Intermediate')).toBeInTheDocument();
    expect(screen.getByText('4 songs')).toBeInTheDocument();
  });

  it('shows overdue badge when overdueAssignmentCount > 0', () => {
    render(<StudentsWidget students={[makeStudent({ overdueAssignmentCount: 2 })]} />);
    expect(screen.getByText('2 overdue')).toBeInTheDocument();
  });

  it('does not show overdue badge when count is 0', () => {
    render(<StudentsWidget students={[makeStudent({ overdueAssignmentCount: 0 })]} />);
    expect(screen.queryByText(/overdue/)).not.toBeInTheDocument();
  });

  it('sorts students with overdue assignments first', () => {
    const students: StudentV2[] = [
      makeStudent({ id: 'a', name: 'Zebra', overdueAssignmentCount: 0, repertoireCount: 0 }),
      makeStudent({ id: 'b', name: 'Alpha', overdueAssignmentCount: 3, repertoireCount: 0 }),
    ];
    render(<StudentsWidget students={students} />);
    const names = screen.getAllByText(/Zebra|Alpha/).map((el) => el.textContent);
    expect(names[0]).toBe('Alpha');
  });

  it('links each row to the student profile', () => {
    render(<StudentsWidget students={[makeStudent({ id: 'stu-42' })]} />);
    const link = screen.getByRole('link', { name: /Alice Smith/i });
    expect(link).toHaveAttribute('href', '/dashboard/users/stu-42');
  });

  it('shows "No lessons yet" for null lastLessonAt', () => {
    render(<StudentsWidget students={[makeStudent({ lastLessonAt: null })]} />);
    expect(screen.getByText('No lessons yet')).toBeInTheDocument();
  });

  it('shows "None scheduled" for null nextLessonAt', () => {
    render(<StudentsWidget students={[makeStudent({ nextLessonAt: null })]} />);
    expect(screen.getByText('None scheduled')).toBeInTheDocument();
  });

  it('caps display at 6 students', () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      makeStudent({ id: `s${i}`, name: `Student ${i}` })
    );
    render(<StudentsWidget students={many} />);
    // Each row has a "4 songs" pill — there should be exactly 6
    expect(screen.getAllByText('4 songs')).toHaveLength(6);
  });
});
