/**
 * @jest-environment node
 */

import { GET, POST } from './route';
import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { withApiAuth } from '@/lib/auth/withApiAuth';

jest.mock('@/lib/supabase/admin');
jest.mock('@/lib/auth/withApiAuth');
jest.mock('@/lib/auth/auth-event-logger', () => ({
  logShadowUserCreated: jest.fn(),
  logAdminUserCreated: jest.fn(),
}));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn() },
}));

const mockAdminContext = {
  user: { id: 'admin-id', email: 'admin@example.com' },
  roles: { isAdmin: true, isTeacher: false, isStudent: false },
};

const mockTeacherContext = {
  user: { id: 'teacher-id', email: 'teacher@example.com' },
  roles: { isAdmin: false, isTeacher: true, isStudent: false },
};

const mockStudentContext = {
  user: { id: 'student-id', email: 'student@example.com' },
  roles: { isAdmin: false, isTeacher: false, isStudent: true },
};

const mockProfiles = [
  {
    id: 'user-1',
    email: 'user1@example.com',
    full_name: 'John Doe',
    avatar_url: null,
    is_admin: false,
    is_teacher: false,
    is_student: true,
    is_shadow: false,
    is_active: true,
    student_status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-2',
    email: 'user2@example.com',
    full_name: 'Jane Smith',
    avatar_url: null,
    is_admin: false,
    is_teacher: true,
    is_student: false,
    is_shadow: false,
    is_active: true,
    student_status: null,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
  {
    id: 'user-3',
    email: 'shadow_abc@placeholder.com',
    full_name: 'Shadow User',
    avatar_url: null,
    is_admin: false,
    is_teacher: false,
    is_student: true,
    is_shadow: true,
    is_active: true,
    student_status: 'active',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
  },
];

function makeAdminSupabase(overrides = {}) {
  return {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          range: jest.fn(() =>
            Promise.resolve({ data: mockProfiles, error: null, count: mockProfiles.length })
          ),
        })),
      })),
    })),
    ...overrides,
  };
}

describe('Users API - GET endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (withApiAuth as jest.Mock).mockImplementation(async (_req: unknown, handler: (ctx: unknown, req?: unknown) => Promise<Response>) => {
      return handler(mockAdminContext);
    });
  });

  describe('Registration status from is_shadow', () => {
    it('should derive isRegistered from is_shadow', async () => {
      (createAdminClient as jest.Mock).mockReturnValue(makeAdminSupabase());

      const req = new NextRequest('http://localhost:3000/api/users');
      const response = await GET(req);

      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body.data).toHaveLength(3);

      const user1 = body.data.find((u: { id: string }) => u.id === 'user-1');
      const user2 = body.data.find((u: { id: string }) => u.id === 'user-2');
      const shadowUser = body.data.find((u: { id: string }) => u.id === 'user-3');

      expect(user1.isRegistered).toBe(true);
      expect(user2.isRegistered).toBe(true);
      expect(shadowUser.isRegistered).toBe(false);
    });

    it('should include studentStatus defaulting to active when null', async () => {
      const profilesWithStatus = [
        { ...mockProfiles[0], student_status: 'archived' },
        { ...mockProfiles[1], student_status: null },
        { ...mockProfiles[2], student_status: 'active' },
      ];

      (createAdminClient as jest.Mock).mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn(() =>
                Promise.resolve({ data: profilesWithStatus, error: null, count: 3 })
              ),
            })),
          })),
        })),
      });

      const req = new NextRequest('http://localhost:3000/api/users');
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(200);
      const u1 = body.data.find((u: { id: string }) => u.id === 'user-1');
      const u2 = body.data.find((u: { id: string }) => u.id === 'user-2');
      const u3 = body.data.find((u: { id: string }) => u.id === 'user-3');

      expect(u1.studentStatus).toBe('archived');
      expect(u2.studentStatus).toBe('active');
      expect(u3.studentStatus).toBe('active');
    });
  });

  describe('Authorization', () => {
    it('should return 401 for unauthorized users', async () => {
      (withApiAuth as jest.Mock).mockResolvedValue(
        Response.json({ error: 'Unauthorized' }, { status: 401 })
      );

      const req = new NextRequest('http://localhost:3000/api/users');
      const response = await GET(req);

      expect(response.status).toBe(401);
    });

    it('should allow students to see only their own profile', async () => {
      (withApiAuth as jest.Mock).mockImplementation(async (_req: unknown, handler: (ctx: unknown, req?: unknown) => Promise<Response>) => {
        return handler(mockStudentContext);
      });

      const studentProfile = {
        id: 'student-id',
        email: 'student@example.com',
        full_name: 'Student Name',
        avatar_url: null,
        is_admin: false,
        is_teacher: false,
        is_student: true,
        is_shadow: false,
        is_active: true,
        student_status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      (createAdminClient as jest.Mock).mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: studentProfile, error: null })),
            })),
          })),
        })),
      });

      const req = new NextRequest('http://localhost:3000/api/users');
      const response = await GET(req);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0].id).toBe('student-id');
    });
  });

  describe('Filtering and Pagination', () => {
    it('should support search query parameter', async () => {
      const rangeResult = Promise.resolve({ data: [mockProfiles[0]], error: null, count: 1 });
      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            or: jest.fn(() => ({
              order: jest.fn(() => ({ range: jest.fn(() => rangeResult) })),
            })),
            order: jest.fn(() => ({ range: jest.fn(() => rangeResult) })),
          })),
        })),
      };
      (createAdminClient as jest.Mock).mockReturnValue(mockClient);

      const req = new NextRequest('http://localhost:3000/api/users?search=John');
      const response = await GET(req);

      expect(response.status).toBe(200);
      expect(mockClient.from).toHaveBeenCalledWith('profiles');
    });

    it('should support pagination with limit and offset', async () => {
      (createAdminClient as jest.Mock).mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn((start: number, end: number) => {
                expect(start).toBe(10);
                expect(end).toBe(19);
                return Promise.resolve({ data: [], error: null, count: 0 });
              }),
            })),
          })),
        })),
      });

      const req = new NextRequest('http://localhost:3000/api/users?limit=10&offset=10');
      const response = await GET(req);

      expect(response.status).toBe(200);
    });
  });
});

describe('Users API - POST endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (withApiAuth as jest.Mock).mockImplementation(async (_req: unknown, handler: (ctx: unknown, req?: unknown) => Promise<Response>) => {
      return handler(mockAdminContext);
    });
  });

  it('should create a shadow user when email is empty', async () => {
    (createAdminClient as jest.Mock).mockReturnValue({
      from: jest.fn(() => ({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({
                data: {
                  id: 'new-shadow-id',
                  email: 'shadow_new-shadow-id@placeholder.com',
                  full_name: 'Shadow Student',
                  is_shadow: true,
                  is_student: true,
                },
                error: null,
              })
            ),
          })),
        })),
      })),
    });

    const bodyData = JSON.stringify({ firstName: 'Shadow', lastName: 'Student', isStudent: true });
    const req = {
      url: 'http://localhost:3000/api/users',
      method: 'POST',
      headers: { get: (h: string) => (h === 'Authorization' ? 'Bearer mock-token' : null) },
      text: jest.fn().mockResolvedValue(bodyData),
    } as unknown as Request;

    const response = await POST(req);

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.is_shadow).toBe(true);
  });

  it('should return 401 for unauthorized users', async () => {
    (withApiAuth as jest.Mock).mockResolvedValue(
      Response.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const bodyData = JSON.stringify({ email: 'test@example.com', firstName: 'Test' });
    const req = {
      url: 'http://localhost:3000/api/users',
      method: 'POST',
      headers: { get: () => null },
      text: jest.fn().mockResolvedValue(bodyData),
    } as unknown as Request;

    const response = await POST(req);

    expect(response.status).toBe(401);
  });

  it('should return 403 when teacher tries to create admin or teacher', async () => {
    (withApiAuth as jest.Mock).mockImplementation(async (_req: unknown, handler: (ctx: unknown, req?: unknown) => Promise<Response>) => {
      return handler(mockTeacherContext);
    });

    const bodyData = JSON.stringify({
      email: 'newadmin@example.com',
      firstName: 'New',
      lastName: 'Admin',
      isAdmin: true,
    });

    const req = {
      url: 'http://localhost:3000/api/users',
      method: 'POST',
      headers: { get: (h: string) => (h === 'Authorization' ? 'Bearer mock-token' : null) },
      text: jest.fn().mockResolvedValue(bodyData),
    } as unknown as Request;

    const response = await POST(req);

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe('Teachers can only create students');
  });
});
