/**
 * menuConfig.test — locks the minimal core-loop sidebar scope.
 *
 * The sidebar is trimmed (CORE_LOOP_HIDDEN_ITEMS) to the core loop:
 * Lessons, Songs, Assignments, Students (teacher/admin) and the "My …"
 * equivalents (student). Every other feature is hidden from nav until it is
 * individually proven. This test fails if a non-core item leaks back in.
 */
import { getMenuGroups } from '@/components/navigation/menuConfig';

function itemIds(groups: ReturnType<typeof getMenuGroups>): string[] {
  return groups.flatMap((g) => g.items.map((i) => i.id));
}

const NON_CORE = [
  'theory',
  'skills',
  'health',
  'song-stats',
  'lesson-stats',
  'chord-analysis',
  'cohorts',
  'logs',
  'fretboard',
  'ai',
  'ai-chat',
  'my-stats',
  'repertoire',
];

describe('menuConfig — minimal core-loop scope', () => {
  it('teacher/admin sidebar shows the core teaching + students items plus calendar (CAL-2)', () => {
    const ids = itemIds(getMenuGroups({ isAdmin: true, isTeacher: true, isStudent: false }));
    expect(ids.sort()).toEqual(['assignments', 'calendar', 'lessons', 'songs', 'students'].sort());
  });

  it('teacher (non-admin) sees the same core set', () => {
    const ids = itemIds(getMenuGroups({ isAdmin: false, isTeacher: true, isStudent: false }));
    expect(ids.sort()).toEqual(['assignments', 'calendar', 'lessons', 'songs', 'students'].sort());
  });

  it('student sidebar shows only the core learning items', () => {
    const ids = itemIds(getMenuGroups({ isAdmin: false, isTeacher: false, isStudent: true }));
    expect(ids.sort()).toEqual(['my-assignments', 'my-lessons', 'my-songs'].sort());
  });

  it('no non-core feature appears in any role sidebar', () => {
    const teacher = itemIds(getMenuGroups({ isAdmin: true, isTeacher: true, isStudent: false }));
    const student = itemIds(getMenuGroups({ isAdmin: false, isTeacher: false, isStudent: true }));
    for (const hidden of NON_CORE) {
      expect(teacher).not.toContain(hidden);
      expect(student).not.toContain(hidden);
    }
  });

  it('empty groups are dropped (no group with zero items)', () => {
    const groups = getMenuGroups({ isAdmin: true, isTeacher: true, isStudent: false });
    for (const g of groups) expect(g.items.length).toBeGreaterThan(0);
  });
});
