/**
 * menuConfig.test — locks the sidebar scope.
 *
 * The sidebar is trimmed (CORE_LOOP_HIDDEN_ITEMS) to the core loop plus the
 * features that have been individually verified: Calendar, Fretboard, the AI
 * assistant, the Skills hub (chord quiz, teacher-directable via chord drills),
 * and — for students — Repertoire and the Practice Log.
 *
 * Everything still on the hidden list is either a "Coming soon" stub or would
 * render empty. This test fails if one of those leaks back into nav.
 */
import { getMenuGroups } from '@/components/navigation/menuConfig';

function itemIds(groups: ReturnType<typeof getMenuGroups>): string[] {
  return groups.flatMap((g) => g.items.map((i) => i.id));
}

const TEACHER_ITEMS = [
  'lessons',
  'songs',
  'assignments',
  'students',
  'calendar',
  'fretboard',
  'skills',
  'ai',
  'ai-chat',
];

const STUDENT_ITEMS = ['my-lessons', 'my-songs', 'my-assignments', 'repertoire', 'practice'];

/** Stub pages and empty surfaces that must never appear in nav. */
const HIDDEN = [
  'theory',
  'health',
  'song-stats',
  'lesson-stats',
  'chord-analysis',
  'cohorts',
  'logs',
  'my-stats',
];

describe('menuConfig — sidebar scope', () => {
  it('teacher/admin sidebar shows the core teaching items plus verified tools', () => {
    const ids = itemIds(getMenuGroups({ isAdmin: true, isTeacher: true, isStudent: false }));
    expect(ids.sort()).toEqual([...TEACHER_ITEMS].sort());
  });

  it('teacher (non-admin) sees the same set as admin', () => {
    const ids = itemIds(getMenuGroups({ isAdmin: false, isTeacher: true, isStudent: false }));
    expect(ids.sort()).toEqual([...TEACHER_ITEMS].sort());
  });

  it('student sidebar shows learning items plus repertoire and practice', () => {
    const ids = itemIds(getMenuGroups({ isAdmin: false, isTeacher: false, isStudent: true }));
    expect(ids.sort()).toEqual([...STUDENT_ITEMS].sort());
  });

  it('no stub or empty surface appears in any role sidebar', () => {
    const teacher = itemIds(getMenuGroups({ isAdmin: true, isTeacher: true, isStudent: false }));
    const student = itemIds(getMenuGroups({ isAdmin: false, isTeacher: false, isStudent: true }));
    for (const hidden of HIDDEN) {
      expect(teacher).not.toContain(hidden);
      expect(student).not.toContain(hidden);
    }
  });

  it('empty groups are dropped (no group with zero items)', () => {
    const groups = getMenuGroups({ isAdmin: true, isTeacher: true, isStudent: false });
    for (const g of groups) expect(g.items.length).toBeGreaterThan(0);
  });

  it('no role sees a nav item pointing at a "Coming soon" stub route', () => {
    const stubRoutes = [
      '/dashboard/stats',
      '/dashboard/health',
      '/dashboard/cohorts',
      '/dashboard/admin/stats/songs',
      '/dashboard/admin/stats/lessons',
      '/dashboard/admin/stats/chord-analysis',
    ];
    const allPaths = [
      ...getMenuGroups({ isAdmin: true, isTeacher: true, isStudent: false }),
      ...getMenuGroups({ isAdmin: false, isTeacher: false, isStudent: true }),
    ].flatMap((g) => g.items.map((i) => i.path));

    for (const stub of stubRoutes) expect(allPaths).not.toContain(stub);
  });
});
