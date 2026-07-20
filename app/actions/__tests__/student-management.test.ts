/**
 * Student Management Server Actions Tests
 *
 * Tests the student management server actions:
 * - createStudentProfile
 *
 * @see app/actions/student-management.ts
 */

import { createStudentProfile } from '../student-management';

// Mock getUserWithRolesSSR
const mockGetUserWithRolesSSR = jest.fn();
jest.mock('@/lib/getUserWithRolesSSR', () => ({
  getUserWithRolesSSR: () => mockGetUserWithRolesSSR(),
}));

// Mock createShadowStudent
const mockCreateShadowStudent = jest.fn();
jest.mock('@/lib/services/import-utils', () => ({
  createShadowStudent: (...args: unknown[]) => mockCreateShadowStudent(...args),
}));

describe('student-management actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createStudentProfile', () => {
    it('should create student profile when user is teacher', async () => {
      mockGetUserWithRolesSSR.mockResolvedValueOnce({
        user: { id: 'teacher-123' },
        isTeacher: true,
        isAdmin: false,
        isDevelopment: false,
      });

      mockCreateShadowStudent.mockResolvedValueOnce({
        success: true,
        data: {
          id: 'student-123',
          email: 'student@example.com',
          full_name: 'John Doe',
        },
      });

      const result = await createStudentProfile('student@example.com', 'John', 'Doe');

      expect(mockCreateShadowStudent).toHaveBeenCalledWith('student@example.com', 'John', 'Doe');
      expect(result).toEqual({
        success: true,
        data: {
          id: 'student-123',
          email: 'student@example.com',
          full_name: 'John Doe',
        },
      });
    });

    it('should create student profile when user is admin', async () => {
      mockGetUserWithRolesSSR.mockResolvedValueOnce({
        user: { id: 'admin-123' },
        isTeacher: true, // Admin is also a teacher in terms of permissions
        isAdmin: true,
        isDevelopment: false,
      });

      mockCreateShadowStudent.mockResolvedValueOnce({
        success: true,
        data: { id: 'student-456' },
      });

      const result = await createStudentProfile('student@example.com', 'Jane', 'Smith');

      expect(mockCreateShadowStudent).toHaveBeenCalledWith('student@example.com', 'Jane', 'Smith');
      expect(result.success).toBe(true);
    });

    it('should return unauthorized when user is not authenticated', async () => {
      mockGetUserWithRolesSSR.mockResolvedValueOnce({
        user: null,
        isTeacher: false,
        isAdmin: false,
        isDevelopment: false,
      });

      const result = await createStudentProfile('student@example.com', 'John', 'Doe');

      expect(result).toEqual({
        success: false,
        error: 'Unauthorized',
      });
      expect(mockCreateShadowStudent).not.toHaveBeenCalled();
    });

    it('should return unauthorized when user is not a teacher', async () => {
      mockGetUserWithRolesSSR.mockResolvedValueOnce({
        user: { id: 'student-123' },
        isTeacher: false,
        isAdmin: false,
        isDevelopment: false,
      });

      const result = await createStudentProfile('student@example.com', 'John', 'Doe');

      expect(result).toEqual({
        success: false,
        error: 'Unauthorized',
      });
      expect(mockCreateShadowStudent).not.toHaveBeenCalled();
    });

    it('should return unauthorized when user exists but is not teacher', async () => {
      mockGetUserWithRolesSSR.mockResolvedValueOnce({
        user: { id: 'regular-user-123' },
        isTeacher: false,
        isAdmin: false,
        isDevelopment: false,
      });

      const result = await createStudentProfile('student@example.com', 'John', 'Doe');

      expect(result).toEqual({
        success: false,
        error: 'Unauthorized',
      });
    });

    it('should handle createShadowStudent error', async () => {
      mockGetUserWithRolesSSR.mockResolvedValueOnce({
        user: { id: 'teacher-123' },
        isTeacher: true,
        isAdmin: false,
        isDevelopment: false,
      });

      mockCreateShadowStudent.mockResolvedValueOnce({
        success: false,
        error: 'Email already exists',
      });

      const result = await createStudentProfile('existing@example.com', 'John', 'Doe');

      expect(result).toEqual({
        success: false,
        error: 'Email already exists',
      });
    });

    it('should block demo/test accounts before reaching the role check', async () => {
      mockGetUserWithRolesSSR.mockResolvedValueOnce({
        user: { id: 'demo-teacher-123' },
        isTeacher: true,
        isAdmin: false,
        isDevelopment: true,
      });

      const result = await createStudentProfile('student@example.com', 'John', 'Doe');

      expect(result).toEqual({
        success: false,
        error: 'This action is not available on test accounts',
      });
      expect(mockCreateShadowStudent).not.toHaveBeenCalled();
    });

    it('should handle empty email (shadow user)', async () => {
      mockGetUserWithRolesSSR.mockResolvedValueOnce({
        user: { id: 'teacher-123' },
        isTeacher: true,
        isAdmin: false,
        isDevelopment: false,
      });

      mockCreateShadowStudent.mockResolvedValueOnce({
        success: true,
        data: {
          id: 'shadow-student-123',
          full_name: 'Shadow User',
        },
      });

      const result = await createStudentProfile('', 'Shadow', 'User');

      expect(mockCreateShadowStudent).toHaveBeenCalledWith('', 'Shadow', 'User');
      expect(result.success).toBe(true);
    });
  });
});
