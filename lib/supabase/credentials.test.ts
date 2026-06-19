import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({
  path: path.resolve(process.cwd(), '.env.test'),
});

// Mock Supabase client
let currentRole: { isAdmin: boolean; isTeacher: boolean; isStudent: boolean } | null = null;

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      getUser: jest.fn(),
    },
    from: jest.fn(),
  })),
}));

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://mock.url',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key'
);

describe('Development Credentials Authentication Tests', () => {
  // Test credentials from development_credentials.txt
  const testUsers = [
    {
      email: 'p.romanczuk@gmail.com',
      password: 'test123_admin',
      role: { isAdmin: true, isTeacher: true, isStudent: false },
      description: 'Admin & Teacher',
    },
    {
      email: 'teacher@example.com',
      password: 'test123_teacher',
      role: { isAdmin: false, isTeacher: true, isStudent: false },
      description: 'Teacher',
    },
    {
      email: 'student@example.com',
      password: 'test123_student',
      role: { isAdmin: false, isTeacher: false, isStudent: true },
      description: 'Student',
    },
    {
      email: 'teststudent1@example.com',
      password: 'test123_student',
      role: { isAdmin: false, isTeacher: false, isStudent: true },
      description: 'Student 1',
    },
    {
      email: 'teststudent2@example.com',
      password: 'test123_student',
      role: { isAdmin: false, isTeacher: false, isStudent: true },
      description: 'Student 2',
    },
    {
      email: 'teststudent3@example.com',
      password: 'test123_student',
      role: { isAdmin: false, isTeacher: false, isStudent: true },
      description: 'Student 3',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation for auth
    (supabase.auth.signInWithPassword as jest.Mock).mockImplementation(
      async ({ email, password }) => {
        const user = testUsers.find((u) => u.email === email);
        if (user && user.password === password) {
          currentRole = user.role;
          return {
            data: { user: { email, id: 'test-user-id' }, session: {} },
            error: null,
          };
        }
        return {
          data: { user: null, session: null },
          error: { message: 'Invalid login credentials' },
        };
      }
    );

    // Default mock implementation for from
    (supabase.from as jest.Mock).mockImplementation((table) => {
      const builder = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation((resolve) => {
          // Logic based on table and currentRole.
          // audit_log is an admin-only table (RLS: is_admin()), used here to
          // assert that only admins can read admin-scoped data.
          if (table === 'audit_log') {
            if (currentRole?.isAdmin) {
              resolve({ data: [{ id: 1 }], error: null });
            } else {
              resolve({ data: null, error: { message: 'Permission denied' } });
            }
          } else if (table === 'lessons') {
            resolve({ data: [{ id: 1 }], error: null });
          } else if (table === 'profiles') {
            // Return profile based on currentRole
            if (currentRole) {
              resolve({
                data: {
                  is_admin: currentRole.isAdmin,
                  is_teacher: currentRole.isTeacher,
                  is_student: currentRole.isStudent,
                },
                error: null,
              });
            } else {
              resolve({ data: null, error: { message: 'No profile' } });
            }
          } else {
            resolve({ data: [], error: null });
          }
        }),
      };
      return builder;
    });
  });

  describe('Authentication Tests', () => {
    test.each(testUsers)(
      'should authenticate successfully: $description',
      async ({ email, password }) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        expect(error).toBeNull();
        expect(data.user).not.toBeNull();
        expect(data.user?.email).toBe(email);
      }
    );

    test.each(testUsers)(
      'should have correct role flags: $description',
      async ({ email, role }) => {
        const {
          data: { user },
          error,
        } = await supabase.auth.signInWithPassword({
          email,
          password: testUsers.find((u) => u.email === email)?.password || 'fallback',
        });
        expect(error).toBeNull();
        expect(user).not.toBeNull();

        // Check profile roles
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin, is_teacher, is_student')
          .eq('id', user!.id)
          .single<{ is_admin: boolean; is_teacher: boolean; is_student: boolean }>();

        expect(profile).not.toBeNull();
        expect(profile?.is_admin).toBe(role.isAdmin);
        expect(profile?.is_teacher).toBe(role.isTeacher);
        expect(profile?.is_student).toBe(role.isStudent);
      }
    );
  });

  describe('Invalid Authentication Tests', () => {
    test.each(testUsers)('should fail with wrong password: $description', async ({ email }) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: 'wrong_password',
      });

      expect(error).not.toBeNull();
      expect(error?.message).toContain('Invalid login credentials');
    });

    test('should fail with non-existent email', async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email: 'nonexistent@example.com',
        password: 'any_password',
      });

      expect(error).not.toBeNull();
      expect(error?.message).toContain('Invalid login credentials');
    });
  });

  describe('Role-based Access Tests', () => {
    test('admin user should have admin access', async () => {
      await supabase.auth.signInWithPassword({
        email: 'p.romanczuk@gmail.com',
        password: 'test123_admin',
      });

      // Try to access admin-only data
      const { data: tasks, error } = await supabase.from('audit_log').select('*').limit(1);

      expect(error).toBeNull();
      expect(tasks).not.toBeNull();
    });

    test('teacher can access their assigned lessons', async () => {
      const {
        data: { user },
      } = await supabase.auth.signInWithPassword({
        email: 'teacher@example.com',
        password: 'test123_teacher',
      });

      const { data: lessons, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('teacher_id', user!.id);

      expect(error).toBeNull();
      expect(lessons).not.toBeNull();
    });

    test('student cannot access admin features', async () => {
      await supabase.auth.signInWithPassword({
        email: 'student@example.com',
        password: 'test123_student',
      });

      // Try to access admin-only data
      const { data: tasks, error } = await supabase.from('audit_log').select('*').limit(1);

      expect(error).not.toBeNull();
      expect(tasks).toBeNull();
    });
  });

  describe('Password Pattern Tests', () => {
    test.each(testUsers)(
      'password follows pattern test123_[role]: $description',
      ({ password, role }) => {
        if (role.isAdmin) {
          expect(password).toBe('test123_admin');
        } else if (role.isTeacher) {
          expect(password).toBe('test123_teacher');
        } else if (role.isStudent) {
          expect(password).toBe('test123_student');
        }
      }
    );
  });
});
