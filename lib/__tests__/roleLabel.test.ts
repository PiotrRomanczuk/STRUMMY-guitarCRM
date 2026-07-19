import { resolveRoleLabel } from '@/lib/roleLabel';

describe('resolveRoleLabel', () => {
  it('joins every held role instead of picking one', () => {
    expect(resolveRoleLabel({ isAdmin: true, isTeacher: true, isStudent: false })).toBe(
      'Admin · Teacher'
    );
  });

  it('returns the single role when only one is held', () => {
    expect(resolveRoleLabel({ isAdmin: false, isTeacher: false, isStudent: true })).toBe('Student');
  });

  it('falls back to "User" when no role is held', () => {
    expect(resolveRoleLabel({ isAdmin: false, isTeacher: false, isStudent: false })).toBe('User');
  });
});
