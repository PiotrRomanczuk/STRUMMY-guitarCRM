import type { AuthedProfile } from '@/lib/auth/loadAuthedProfile';

const mockFrom = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({ from: mockFrom })),
}));

// React.cache is identity at runtime in tests; React 19 exports it.
jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return { ...actual, cache: <T extends (...args: never[]) => unknown>(fn: T) => fn };
});

import { studentAccess } from '../StudentAccess';

const mkAuthed = (
  overrides: Partial<AuthedProfile['roles']> = {},
  userId = 'user-1'
): AuthedProfile => ({
  user: { id: userId } as AuthedProfile['user'],
  roles: { isAdmin: false, isTeacher: false, isStudent: false, ...overrides },
  flags: { isParent: false, isDevelopment: false },
});

const mockTeacherStudentsView = (rows: { student_id: string }[]) => {
  mockFrom.mockReturnValueOnce({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: rows, error: null }),
    }),
  });
};

beforeEach(() => {
  mockFrom.mockReset();
});

describe('studentAccess', () => {
  describe('visibleStudentIds', () => {
    it('returns null for admin (means: all students)', async () => {
      const sa = studentAccess(mkAuthed({ isAdmin: true }));
      expect(await sa.visibleStudentIds()).toBeNull();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns empty for student (sees no other students)', async () => {
      const sa = studentAccess(mkAuthed({ isStudent: true }));
      expect(await sa.visibleStudentIds()).toEqual([]);
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns the teacher_students view set for teacher', async () => {
      mockTeacherStudentsView([
        { student_id: 's-1' },
        { student_id: 's-2' },
        { student_id: 's-1' }, // dup, must be deduped
      ]);
      const sa = studentAccess(mkAuthed({ isTeacher: true }));
      expect(await sa.visibleStudentIds()).toEqual(['s-1', 's-2']);
      expect(mockFrom).toHaveBeenCalledWith('teacher_students');
    });

    it('returns empty when teacher has no students', async () => {
      mockTeacherStudentsView([]);
      const sa = studentAccess(mkAuthed({ isTeacher: true }));
      expect(await sa.visibleStudentIds()).toEqual([]);
    });

    it('returns empty when no role is set', async () => {
      const sa = studentAccess(mkAuthed());
      expect(await sa.visibleStudentIds()).toEqual([]);
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('canView', () => {
    it('admin can view anyone', async () => {
      const sa = studentAccess(mkAuthed({ isAdmin: true }));
      expect(await sa.canView('any-student')).toBe(true);
    });

    it('student can view themselves', async () => {
      const sa = studentAccess(mkAuthed({ isStudent: true }, 'me'));
      expect(await sa.canView('me')).toBe(true);
    });

    it('student cannot view another student', async () => {
      const sa = studentAccess(mkAuthed({ isStudent: true }, 'me'));
      expect(await sa.canView('other')).toBe(false);
    });

    it('teacher can view a student they teach', async () => {
      mockTeacherStudentsView([{ student_id: 's-1' }, { student_id: 's-2' }]);
      const sa = studentAccess(mkAuthed({ isTeacher: true }));
      expect(await sa.canView('s-1')).toBe(true);
    });

    it('teacher cannot view a student they do not teach', async () => {
      mockTeacherStudentsView([{ student_id: 's-1' }]);
      const sa = studentAccess(mkAuthed({ isTeacher: true }));
      expect(await sa.canView('s-other')).toBe(false);
    });

    it('roleless profile cannot view anyone', async () => {
      const sa = studentAccess(mkAuthed());
      expect(await sa.canView('any')).toBe(false);
    });
  });
});
