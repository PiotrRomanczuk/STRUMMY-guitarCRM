/**
 * UserSchema Tests
 *
 * Tests validation for user-related Zod schemas:
 * - UserSchema (full user validation)
 * - UserInputSchema (create/update operations)
 * - UserUpdateSchema (partial updates)
 * - UserRegistrationSchema (signup)
 * - UserAuthSchema (login)
 * - UserPasswordChangeSchema (password change)
 * - getUserRole (role helper)
 * - hasPermission (permission helper)
 *
 * @see schemas/UserSchema.ts
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  UserSchema,
  UserInputSchema,
  UserUpdateSchema,
  UserRegistrationSchema,
  UserProfileSchema,
  UserFilterSchema,
  UserSortSchema,
  UserAuthSchema,
  UserPasswordResetSchema,
  UserPasswordChangeSchema,
  UserRoleEnum,
  getUserRole,
  hasPermission,
} from '../UserSchema';

describe('UserSchema', () => {
  describe('UserRoleEnum', () => {
    it('should accept student role', () => {
      const result = UserRoleEnum.safeParse('student');
      expect(result.success).toBe(true);
    });

    it('should accept teacher role', () => {
      const result = UserRoleEnum.safeParse('teacher');
      expect(result.success).toBe(true);
    });

    it('should accept admin role', () => {
      const result = UserRoleEnum.safeParse('admin');
      expect(result.success).toBe(true);
    });

    it('should reject invalid role', () => {
      const result = UserRoleEnum.safeParse('invalid');
      expect(result.success).toBe(false);
    });
  });

  describe('UserInputSchema', () => {
    it('should validate valid user input', () => {
      const result = UserInputSchema.safeParse({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isStudent: true,
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty email', () => {
      const result = UserInputSchema.safeParse({
        email: '',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.success).toBe(true);
    });

    it('should validate email format', () => {
      const result = UserInputSchema.safeParse({
        email: 'not-an-email',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Valid email is required');
      }
    });

    it('should accept all role flags', () => {
      const result = UserInputSchema.safeParse({
        firstName: 'Test',
        isStudent: true,
        isTeacher: true,
        isAdmin: false,
      });
      expect(result.success).toBe(true);
    });

    it('should accept shadow user flag', () => {
      const result = UserInputSchema.safeParse({
        firstName: 'Shadow',
        lastName: 'User',
        isShadow: true,
      });
      expect(result.success).toBe(true);
    });

    it('should accept test user flag', () => {
      const result = UserInputSchema.safeParse({
        firstName: 'Test',
        email: 'test@example.com',
        isTest: true,
      });
      expect(result.success).toBe(true);
    });

    it('should accept isActive flag', () => {
      const result = UserInputSchema.safeParse({
        firstName: 'Test',
        email: 'test@example.com',
        isActive: false,
      });
      expect(result.success).toBe(true);
    });

    it('should require firstName', () => {
      const result = UserInputSchema.safeParse({
        email: 'test@example.com',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const firstNameError = result.error.issues.find((i) => i.path[0] === 'firstName');
        expect(firstNameError).toBeDefined();
      }
    });
  });

  describe('UserUpdateSchema', () => {
    it('should require id for updates', () => {
      const result = UserUpdateSchema.safeParse({
        firstName: 'Updated',
      });
      expect(result.success).toBe(false);
    });

    it('should validate id is positive integer', () => {
      const result = UserUpdateSchema.safeParse({
        id: 0,
        firstName: 'Updated',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('User ID is required');
      }
    });

    it('should allow partial updates with id', () => {
      const result = UserUpdateSchema.safeParse({
        id: 1,
        firstName: 'Updated',
      });
      expect(result.success).toBe(true);
    });

    it('should allow role updates', () => {
      const result = UserUpdateSchema.safeParse({
        id: 1,
        isAdmin: true,
        isTeacher: false,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('UserRegistrationSchema', () => {
    const validRegistration = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should validate valid registration', () => {
      const result = UserRegistrationSchema.safeParse(validRegistration);
      expect(result.success).toBe(true);
    });

    it('should require email', () => {
      const result = UserRegistrationSchema.safeParse({
        ...validRegistration,
        email: '',
      });
      expect(result.success).toBe(false);
    });

    it('should validate email format', () => {
      const result = UserRegistrationSchema.safeParse({
        ...validRegistration,
        email: 'not-an-email',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Valid email is required');
      }
    });

    it('should require password minimum length', () => {
      const result = UserRegistrationSchema.safeParse({
        ...validRegistration,
        password: 'short',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password must be at least 8 characters');
      }
    });

    it('should require firstName', () => {
      const result = UserRegistrationSchema.safeParse({
        ...validRegistration,
        firstName: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('First name is required');
      }
    });

    it('should require lastName', () => {
      const result = UserRegistrationSchema.safeParse({
        ...validRegistration,
        lastName: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Last name is required');
      }
    });

    it('should default isStudent to true', () => {
      const result = UserRegistrationSchema.safeParse(validRegistration);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isStudent).toBe(true);
      }
    });

    it('should default isTeacher to false', () => {
      const result = UserRegistrationSchema.safeParse(validRegistration);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isTeacher).toBe(false);
      }
    });

    it('should default isAdmin to false', () => {
      const result = UserRegistrationSchema.safeParse(validRegistration);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isAdmin).toBe(false);
      }
    });
  });

  describe('UserProfileSchema', () => {
    it('should validate profile update', () => {
      const result = UserProfileSchema.safeParse({
        full_name: 'John Doe',
        username: 'johndoe',
      });
      expect(result.success).toBe(true);
    });

    it('should validate website URL', () => {
      const result = UserProfileSchema.safeParse({
        website: 'https://example.com',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid website URL', () => {
      const result = UserProfileSchema.safeParse({
        website: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });

    it('should validate avatar_url', () => {
      const result = UserProfileSchema.safeParse({
        avatar_url: 'https://example.com/avatar.jpg',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('UserFilterSchema', () => {
    it('should validate empty filter', () => {
      const result = UserFilterSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate role filter', () => {
      const result = UserFilterSchema.safeParse({
        role: 'teacher',
      });
      expect(result.success).toBe(true);
    });

    it('should validate isActive filter', () => {
      const result = UserFilterSchema.safeParse({
        isActive: true,
      });
      expect(result.success).toBe(true);
    });

    it('should validate search string', () => {
      const result = UserFilterSchema.safeParse({
        search: 'john',
      });
      expect(result.success).toBe(true);
    });

    it('should validate multiple role flags', () => {
      const result = UserFilterSchema.safeParse({
        isStudent: true,
        isTeacher: false,
        isAdmin: false,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('UserSortSchema', () => {
    it('should validate sort by email', () => {
      const result = UserSortSchema.safeParse({
        field: 'email',
        direction: 'asc',
      });
      expect(result.success).toBe(true);
    });

    it('should default direction to asc', () => {
      const result = UserSortSchema.safeParse({
        field: 'firstName',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.direction).toBe('asc');
      }
    });

    it('should accept all valid sort fields', () => {
      const fields = ['email', 'firstName', 'lastName', 'username', 'created_at', 'updated_at'];
      for (const field of fields) {
        const result = UserSortSchema.safeParse({ field });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid sort field', () => {
      const result = UserSortSchema.safeParse({
        field: 'invalid_field',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('UserAuthSchema', () => {
    it('should validate valid auth credentials', () => {
      const result = UserAuthSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('should require valid email', () => {
      const result = UserAuthSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('should require password', () => {
      const result = UserAuthSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password is required');
      }
    });
  });

  describe('UserPasswordResetSchema', () => {
    it('should validate valid email', () => {
      const result = UserPasswordResetSchema.safeParse({
        email: 'test@example.com',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = UserPasswordResetSchema.safeParse({
        email: 'not-an-email',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('UserPasswordChangeSchema', () => {
    it('should validate valid password change', () => {
      const result = UserPasswordChangeSchema.safeParse({
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      });
      expect(result.success).toBe(true);
    });

    it('should require current password', () => {
      const result = UserPasswordChangeSchema.safeParse({
        currentPassword: '',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      });
      expect(result.success).toBe(false);
    });

    it('should require new password minimum length', () => {
      const result = UserPasswordChangeSchema.safeParse({
        currentPassword: 'oldpassword',
        newPassword: 'short',
        confirmPassword: 'short',
      });
      expect(result.success).toBe(false);
    });

    it('should require passwords to match', () => {
      const result = UserPasswordChangeSchema.safeParse({
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'differentpassword',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Passwords don't match");
      }
    });
  });

  describe('UserSchema', () => {
    it('should validate a complete user', () => {
      const result = UserSchema.safeParse({
        id: 1,
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isStudent: true,
        isTeacher: false,
        isAdmin: false,
        isActive: true,
        created_at: new Date(),
        updated_at: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it('should default role flags', () => {
      const result = UserSchema.safeParse({
        email: 'test@example.com',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isStudent).toBe(true);
        expect(result.data.isTeacher).toBe(false);
        expect(result.data.isAdmin).toBe(false);
      }
    });

    it('should default isActive to true', () => {
      const result = UserSchema.safeParse({
        email: 'test@example.com',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isActive).toBe(true);
      }
    });
  });

  describe('getUserRole', () => {
    it('should return admin for admin user', () => {
      const user = { isAdmin: true, isTeacher: true, isStudent: true } as any;
      expect(getUserRole(user)).toBe('admin');
    });

    it('should return teacher for teacher (non-admin) user', () => {
      const user = { isAdmin: false, isTeacher: true, isStudent: true } as any;
      expect(getUserRole(user)).toBe('teacher');
    });

    it('should return student for student-only user', () => {
      const user = { isAdmin: false, isTeacher: false, isStudent: true } as any;
      expect(getUserRole(user)).toBe('student');
    });

    it('should return student as default', () => {
      const user = { isAdmin: false, isTeacher: false, isStudent: false } as any;
      expect(getUserRole(user)).toBe('student');
    });
  });

  describe('hasPermission', () => {
    const adminUser = { isAdmin: true, isTeacher: false, isStudent: false, canEdit: false } as any;
    const teacherUser = {
      isAdmin: false,
      isTeacher: true,
      isStudent: false,
      canEdit: false,
    } as any;
    const studentUser = {
      isAdmin: false,
      isTeacher: false,
      isStudent: true,
      canEdit: false,
    } as any;
    const editorUser = { isAdmin: false, isTeacher: false, isStudent: true, canEdit: true } as any;

    describe('admin permission', () => {
      it('should grant admin permission to admin', () => {
        expect(hasPermission(adminUser, 'admin')).toBe(true);
      });

      it('should deny admin permission to teacher', () => {
        expect(hasPermission(teacherUser, 'admin')).toBe(false);
      });

      it('should deny admin permission to student', () => {
        expect(hasPermission(studentUser, 'admin')).toBe(false);
      });
    });

    describe('teacher permission', () => {
      it('should grant teacher permission to admin', () => {
        expect(hasPermission(adminUser, 'teacher')).toBe(true);
      });

      it('should grant teacher permission to teacher', () => {
        expect(hasPermission(teacherUser, 'teacher')).toBe(true);
      });

      it('should deny teacher permission to student', () => {
        expect(hasPermission(studentUser, 'teacher')).toBe(false);
      });
    });

    describe('student permission', () => {
      it('should deny student permission to admin-only', () => {
        expect(hasPermission(adminUser, 'student')).toBe(false);
      });

      it('should deny student permission to teacher-only', () => {
        expect(hasPermission(teacherUser, 'student')).toBe(false);
      });

      it('should grant student permission to student', () => {
        expect(hasPermission(studentUser, 'student')).toBe(true);
      });
    });

    describe('edit permission', () => {
      it('should grant edit permission to admin', () => {
        expect(hasPermission(adminUser, 'edit')).toBe(true);
      });

      it('should grant edit permission to user with canEdit', () => {
        expect(hasPermission(editorUser, 'edit')).toBe(true);
      });

      it('should deny edit permission to regular student', () => {
        expect(hasPermission(studentUser, 'edit')).toBe(false);
      });

      it('should deny edit permission to teacher without canEdit', () => {
        expect(hasPermission(teacherUser, 'edit')).toBe(false);
      });
    });

    describe('parent permission', () => {
      const parentUser = {
        isAdmin: false,
        isTeacher: false,
        isStudent: false,
        isParent: true,
        canEdit: false,
      } as any;
      const nonParentUser = {
        isAdmin: true,
        isTeacher: true,
        isStudent: true,
        isParent: false,
        canEdit: true,
      } as any;

      it('should grant parent permission to a parent', () => {
        expect(hasPermission(parentUser, 'parent')).toBe(true);
      });

      it('should deny parent permission to a non-parent, even an admin', () => {
        expect(hasPermission(nonParentUser, 'parent')).toBe(false);
      });

      it('should not grant a parent any other permission', () => {
        expect(hasPermission(parentUser, 'admin')).toBe(false);
        expect(hasPermission(parentUser, 'teacher')).toBe(false);
        expect(hasPermission(parentUser, 'student')).toBe(false);
        expect(hasPermission(parentUser, 'edit')).toBe(false);
      });
    });

    describe('unknown permission', () => {
      // The union type forbids this, but the helper is reachable from
      // untyped call sites (API payloads / JS callers), so the default
      // arm must fail closed.
      it('should deny an unrecognised permission for an admin', () => {
        expect(hasPermission(adminUser, 'superuser' as any)).toBe(false);
      });
    });
  });
});
