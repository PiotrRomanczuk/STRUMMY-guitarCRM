import {
  buildStudentLessonMetrics,
  countOverdueAssignments,
  countRepertoire,
  buildWeekChartData,
  computeNeedsAttention,
  type LessonStub,
  type AssignmentStub,
  type RepertoireStub,
} from '@/app/actions/teacher/dashboard.helpers';

const NOW = '2026-05-10T12:00:00.000Z';

const makeLessons = (studentId: string, dates: string[]): LessonStub[] =>
  dates.map((d, i) => ({ id: `l-${i}`, student_id: studentId, scheduled_at: d }));

const makeAssignment = (
  studentId: string,
  status: string,
  dueDate: string,
  id = 'a1'
): AssignmentStub => ({
  id,
  student_id: studentId,
  status,
  due_date: dueDate,
  created_at: '2026-05-01T00:00:00Z',
});

describe('buildStudentLessonMetrics', () => {
  it('returns zeros and nulls when no lessons exist', () => {
    const result = buildStudentLessonMetrics('s1', [], NOW);
    expect(result).toEqual({ lessonsCompleted: 0, lastLessonAt: null, nextLessonAt: null });
  });

  it('correctly counts past lessons and finds last/next', () => {
    const lessons: LessonStub[] = [
      { id: 'l1', student_id: 's1', scheduled_at: '2026-05-01T10:00:00Z' },
      { id: 'l2', student_id: 's1', scheduled_at: '2026-05-08T10:00:00Z' },
      { id: 'l3', student_id: 's1', scheduled_at: '2026-05-15T10:00:00Z' },
    ];
    const result = buildStudentLessonMetrics('s1', lessons, NOW);
    expect(result.lessonsCompleted).toBe(2);
    expect(result.lastLessonAt).toBe('2026-05-08T10:00:00Z');
    expect(result.nextLessonAt).toBe('2026-05-15T10:00:00Z');
  });

  it('ignores lessons belonging to other students', () => {
    const lessons: LessonStub[] = [
      { id: 'l1', student_id: 's2', scheduled_at: '2026-05-01T10:00:00Z' },
    ];
    const result = buildStudentLessonMetrics('s1', lessons, NOW);
    expect(result.lessonsCompleted).toBe(0);
    expect(result.nextLessonAt).toBeNull();
  });
});

describe('countOverdueAssignments', () => {
  it('returns 0 when no assignments', () => {
    expect(countOverdueAssignments('s1', [], NOW)).toBe(0);
  });

  it('counts only non-completed past-due assignments for the student', () => {
    const assignments: AssignmentStub[] = [
      makeAssignment('s1', 'not_started', '2026-05-01T00:00:00Z', 'a1'),
      makeAssignment('s1', 'completed', '2026-05-01T00:00:00Z', 'a2'),
      makeAssignment('s1', 'not_started', '2026-05-20T00:00:00Z', 'a3'), // future
      makeAssignment('s2', 'not_started', '2026-05-01T00:00:00Z', 'a4'), // wrong student
    ];
    expect(countOverdueAssignments('s1', assignments, NOW)).toBe(1);
  });

  it('does not count cancelled assignments', () => {
    const assignments = [makeAssignment('s1', 'cancelled', '2026-05-01T00:00:00Z')];
    expect(countOverdueAssignments('s1', assignments, NOW)).toBe(0);
  });
});

describe('countRepertoire', () => {
  it('returns 0 when no entries', () => {
    expect(countRepertoire('s1', [])).toBe(0);
  });

  it('counts only entries for the given student', () => {
    const rows: RepertoireStub[] = [
      { student_id: 's1' },
      { student_id: 's1' },
      { student_id: 's2' },
    ];
    expect(countRepertoire('s1', rows)).toBe(2);
  });
});

describe('buildWeekChartData', () => {
  it('returns 7 entries named Sun–Sat', () => {
    const result = buildWeekChartData('2026-05-10T00:00:00Z', [], []);
    expect(result).toHaveLength(7);
    expect(result.map((r) => r.name)).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  });

  it('tallies lessons and assignmentsCreated by day', () => {
    const lessons = [
      { scheduled_at: '2026-05-11T10:00:00Z' }, // Monday
      { scheduled_at: '2026-05-11T14:00:00Z' }, // Monday
      { scheduled_at: '2026-05-13T10:00:00Z' }, // Wednesday
    ];
    const assigns = [
      { created_at: '2026-05-11T09:00:00Z' }, // Monday
    ];
    const result = buildWeekChartData('2026-05-10T00:00:00Z', lessons, assigns);
    const mon = result.find((r) => r.name === 'Mon')!;
    const wed = result.find((r) => r.name === 'Wed')!;
    const sun = result.find((r) => r.name === 'Sun')!;
    expect(mon.lessons).toBe(2);
    expect(mon.assignmentsCreated).toBe(1);
    expect(wed.lessons).toBe(1);
    expect(sun.lessons).toBe(0);
  });
});

describe('computeNeedsAttention', () => {
  it('returns null when student has recent lessons and no overdue assignments', () => {
    const lessons = makeLessons('s1', ['2026-05-09T10:00:00Z']); // 1 day ago
    expect(computeNeedsAttention('s1', lessons, 0, NOW)).toBeNull();
  });

  it('returns overdue_assignment reason when overdueCount > 0', () => {
    const result = computeNeedsAttention('s1', [], 3, NOW);
    expect(result?.reason).toBe('overdue_assignment');
  });

  it('returns no_recent_lesson when last lesson was 14+ days ago', () => {
    const lessons = makeLessons('s1', ['2026-04-20T10:00:00Z']); // 20 days before NOW
    const result = computeNeedsAttention('s1', lessons, 0, NOW);
    expect(result?.reason).toBe('no_recent_lesson');
    expect(result?.daysAgo).toBeGreaterThanOrEqual(14);
  });

  it('returns inactive when last lesson was 30+ days ago', () => {
    const lessons = makeLessons('s1', ['2026-03-01T10:00:00Z']); // ~70 days before NOW
    const result = computeNeedsAttention('s1', lessons, 0, NOW);
    expect(result?.reason).toBe('inactive');
  });

  it('returns null when student has no lessons at all (not enough signal)', () => {
    expect(computeNeedsAttention('s1', [], 0, NOW)).toBeNull();
  });
});
