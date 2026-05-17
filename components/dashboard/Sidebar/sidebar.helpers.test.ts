import { filterGroups, getRoleLabel, getSidebarGroups, matchesItem } from './sidebar.helpers';

describe('getSidebarGroups', () => {
  it('returns teacher groups (Teaching, Students, Analytics, Tools) for teacher', () => {
    const ids = getSidebarGroups({ isAdmin: false, isTeacher: true, isStudent: false }).map(
      (g) => g.id
    );
    expect(ids).toEqual(['teaching', 'students', 'analytics', 'tools']);
  });

  it('returns student groups (Learning, Progress) for student', () => {
    const ids = getSidebarGroups({ isAdmin: false, isTeacher: false, isStudent: true }).map(
      (g) => g.id
    );
    expect(ids).toEqual(['learning', 'progress']);
  });

  it('admin sees teacher groups (admin oversees teachers)', () => {
    const ids = getSidebarGroups({ isAdmin: true, isTeacher: false, isStudent: false }).map(
      (g) => g.id
    );
    expect(ids).toEqual(['teaching', 'students', 'analytics', 'tools']);
  });

  it('returns no groups when no roles', () => {
    expect(getSidebarGroups({ isAdmin: false, isTeacher: false, isStudent: false })).toEqual([]);
  });

  it('demo accounts drop hidden items (skills, health, logs, cohorts, chord-analysis)', () => {
    const groups = getSidebarGroups({
      isAdmin: false,
      isTeacher: true,
      isStudent: false,
      isDemoAccount: true,
    });
    const allItems = groups.flatMap((g) => g.items.map((i) => i.id));
    expect(allItems).not.toContain('skills');
    expect(allItems).not.toContain('health');
    expect(allItems).not.toContain('cohorts');
  });
});

describe('getRoleLabel', () => {
  it.each([
    [{ isAdmin: true, isTeacher: false, isStudent: false }, 'Admin'],
    [{ isAdmin: false, isTeacher: true, isStudent: false }, 'Teacher'],
    [{ isAdmin: false, isTeacher: false, isStudent: true }, 'Student'],
    [{ isAdmin: false, isTeacher: false, isStudent: false }, 'User'],
  ])('returns %s for %j', (roles, expected) => {
    expect(getRoleLabel(roles)).toBe(expected);
  });

  it('admin wins when multiple roles set', () => {
    expect(getRoleLabel({ isAdmin: true, isTeacher: true, isStudent: false })).toBe('Admin');
  });
});

describe('filterGroups', () => {
  const groups = getSidebarGroups({ isAdmin: false, isTeacher: true, isStudent: false });

  it('returns all groups when query empty', () => {
    expect(filterGroups(groups, '').length).toBe(groups.length);
    expect(filterGroups(groups, '   ').length).toBe(groups.length);
  });

  it('drops groups whose items do not match', () => {
    const filtered = filterGroups(groups, 'lesson');
    const ids = filtered.flatMap((g) => g.items.map((i) => i.id));
    expect(ids).toContain('lessons');
    expect(ids).toContain('lesson-stats');
    expect(filtered.every((g) => g.items.length > 0)).toBe(true);
  });

  it('match is case-insensitive', () => {
    expect(filterGroups(groups, 'SONGS').length).toBeGreaterThan(0);
  });
});

describe('matchesItem', () => {
  const item = { id: 'x', label: 'Settings', icon: (() => null) as never, path: '/' };

  it('matches when query empty or substring', () => {
    expect(matchesItem(item, '')).toBe(true);
    expect(matchesItem(item, 'set')).toBe(true);
    expect(matchesItem(item, 'SETTINGS')).toBe(true);
  });

  it('does not match unrelated query', () => {
    expect(matchesItem(item, 'song')).toBe(false);
  });
});
