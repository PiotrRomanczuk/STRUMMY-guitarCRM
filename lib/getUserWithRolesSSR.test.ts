/**
 * Tests for getUserWithRolesSSR
 */

import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { createClient } from '@/lib/supabase/server';
import { loadAuthedProfile } from '@/lib/auth/loadAuthedProfile';

jest.mock('@/lib/supabase/server');
jest.mock('@/lib/auth/loadAuthedProfile');

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
};

const baseEmpty = {
  user: null,
  isAdmin: false,
  isTeacher: false,
  isStudent: false,
  isParent: false,
  isDevelopment: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  (createClient as jest.Mock).mockResolvedValue(mockSupabase);
});

describe('getUserWithRolesSSR', () => {
  describe('Admin User', () => {
    it('returns user with admin and teacher roles from profile', async () => {
      const mockUser = { id: 'admin-user-id', email: 'p.romanczuk@gmail.com' };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      (loadAuthedProfile as jest.Mock).mockResolvedValue({
        user: mockUser,
        roles: { isAdmin: true, isTeacher: true, isStudent: false },
        flags: { isParent: false, isDevelopment: false },
      });

      const result = await getUserWithRolesSSR();

      expect(result).toEqual({
        user: mockUser,
        isAdmin: true,
        isTeacher: true,
        isStudent: false,
        isParent: false,
        isDevelopment: false,
      });
    });
  });

  describe('Teacher User', () => {
    it('returns user with teacher role only from profile', async () => {
      const mockUser = { id: 'teacher-user-id', email: 'teacher@example.com' };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      (loadAuthedProfile as jest.Mock).mockResolvedValue({
        user: mockUser,
        roles: { isAdmin: false, isTeacher: true, isStudent: false },
        flags: { isParent: false, isDevelopment: false },
      });

      const result = await getUserWithRolesSSR();

      expect(result).toEqual({
        user: mockUser,
        isAdmin: false,
        isTeacher: true,
        isStudent: false,
        isParent: false,
        isDevelopment: false,
      });
    });
  });

  describe('Student User', () => {
    it('returns user with student role only from profile', async () => {
      const mockUser = { id: 'student-user-id', email: 'student@example.com' };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      (loadAuthedProfile as jest.Mock).mockResolvedValue({
        user: mockUser,
        roles: { isAdmin: false, isTeacher: false, isStudent: true },
        flags: { isParent: false, isDevelopment: false },
      });

      const result = await getUserWithRolesSSR();

      expect(result).toEqual({
        user: mockUser,
        isAdmin: false,
        isTeacher: false,
        isStudent: true,
        isParent: false,
        isDevelopment: false,
      });
    });
  });

  describe('No User', () => {
    it('returns all roles false when no user is authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

      const result = await getUserWithRolesSSR();

      expect(result).toEqual(baseEmpty);
    });
  });

  describe('User with No Profile', () => {
    it('returns user with all roles false when loadAuthedProfile returns null', async () => {
      const mockUser = { id: 'no-roles-user-id', email: 'user@example.com' };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      (loadAuthedProfile as jest.Mock).mockResolvedValue(null);

      const result = await getUserWithRolesSSR();

      expect(result).toEqual({ ...baseEmpty, user: mockUser });
    });
  });

  describe('Authentication Error', () => {
    it('returns null user when auth fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth error' },
      });

      const result = await getUserWithRolesSSR();

      expect(result).toEqual(baseEmpty);
    });
  });
});
