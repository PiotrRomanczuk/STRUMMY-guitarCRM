import { getNavItemsForRole } from './sidebar.helpers';

const names = (items: ReturnType<typeof getNavItemsForRole>): string[] => items.map((i) => i.name);

describe('getNavItemsForRole', () => {
  it('returns admin-only links for admin', () => {
    const items = names(getNavItemsForRole({ isAdmin: true, isTeacher: false, isStudent: false }));
    expect(items).toEqual(expect.arrayContaining(['Users', 'Health', 'AI', 'Settings']));
  });

  it('admin also sees teaching links (admin oversees teachers)', () => {
    const items = names(getNavItemsForRole({ isAdmin: true, isTeacher: false, isStudent: false }));
    expect(items).toEqual(expect.arrayContaining(['Students', 'Lessons', 'Songs']));
  });

  it('teacher sees teaching links but not admin links', () => {
    const items = names(getNavItemsForRole({ isAdmin: false, isTeacher: true, isStudent: false }));
    expect(items).toEqual(
      expect.arrayContaining(['Students', 'Lessons', 'Songs', 'Assignments', 'Settings'])
    );
    expect(items).not.toContain('Users');
    expect(items).not.toContain('Health');
    expect(items).not.toContain('AI');
  });

  it('student sees student links only', () => {
    const items = names(getNavItemsForRole({ isAdmin: false, isTeacher: false, isStudent: true }));
    expect(items).toEqual(
      expect.arrayContaining(['Lessons', 'Songs', 'Practice', 'Assignments', 'Settings'])
    );
    expect(items).not.toContain('Students');
    expect(items).not.toContain('Users');
  });

  it('deduplicates when multiple roles overlap on Lessons / Songs', () => {
    const items = getNavItemsForRole({
      isAdmin: false,
      isTeacher: true,
      isStudent: true,
    });
    const hrefs = items.map((i) => i.href);
    const unique = new Set(hrefs);
    expect(unique.size).toBe(hrefs.length);
  });

  it('falls back to Settings only when no roles set', () => {
    const items = names(getNavItemsForRole({ isAdmin: false, isTeacher: false, isStudent: false }));
    expect(items).toEqual(['Settings']);
  });
});
