/**
 * @jest-environment node
 */

import { GET, POST } from './route';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/supabase/admin');
jest.mock('@/lib/getUserWithRolesSSR');

describe('Users API - GET endpoint', () => {
  const mockAdminUser = {
    user: { id: 'admin-id', email: 'admin@example.com' },
    isAdmin: true,
    isTeacher: false,
    isStudent: false,
    isDevelopment: false,
  };

  const mockProfiles = [
    {
      id: 'user-1',
      email: 'user1@example.com',
      full_name: 'John Doe',
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
      email: 'shadow@example.com',
      full_name: 'Shadow User',
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

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock getUserWithRolesSSR to return admin
    (getUserWithRolesSSR as jest.Mock).mockResolvedValue(mockAdminUser);
  });

  describe('Registration status from is_shadow', () => {
    it('should derive isRegistered from is_shadow without auth.users lookup', async () => {
      const mockSupabase = {
        from: jest.fn((table) => {
          if (table === 'profiles') {
            return {
              select: jest.fn(() => ({
                order: jest.fn(() => ({
                  range: jest.fn(() =>
                    Promise.resolve({
                      data: mockProfiles,
                      error: null,
                      count: mockProfiles.length,
                    })
                  ),
                })),
              })),
            };
          }
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({ data: null, error: null })),
              })),
            })),
          };
        }),
      };

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const req = new NextRequest('http://localhost:3000/api/users');
      const response = await GET(req);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toHaveLength(3);

      // Non-shadow users → isRegistered: true
      const user1 = data.data.find((u: { id: string }) => u.id === 'user-1');
      const user2 = data.data.find((u: { id: string }) => u.id === 'user-2');
      const shadowUser = data.data.find((u: { id: string }) => u.id === 'user-3');

      expect(user1.isRegistered).toBe(true);
      expect(user2.isRegistered).toBe(true);
      expect(shadowUser.isRegistered).toBe(false);

      // No admin client calls should be made in GET
      expect(createAdminClient).not.toHaveBeenCalled();
    });

    it('should include studentStatus in response defaulting to active', async () => {
      const profilesWithStatus = [
        { ...mockProfiles[0], student_status: 'archived' },
        { ...mockProfiles[1], student_status: null },
        { ...mockProfiles[2], student_status: 'active' },
      ];

      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn(() =>
                Promise.resolve({
                  data: profilesWithStatus,
                  error: null,
                  count: profilesWithStatus.length,
                })
              ),
            })),
          })),
        })),
      };

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const req = new NextRequest('http://localhost:3000/api/users');
      const response = await GET(req);

      expect(response.status).toBe(200);
      const data = await response.json();

      const user1 = data.data.find((u: { id: string }) => u.id === 'user-1');
      const user2 = data.data.find((u: { id: string }) => u.id === 'user-2');
      const user3 = data.data.find((u: { id: string }) => u.id === 'user-3');

      expect(user1.studentStatus).toBe('archived');
      expect(user2.studentStatus).toBe('active'); // null defaults to 'active'
      expect(user3.studentStatus).toBe('active');
    });
  });

  describe('Authorization', () => {
    it('should return 401 for unauthorized users', async () => {
      (getUserWithRolesSSR as jest.Mock).mockResolvedValue({
        user: null,
        isAdmin: false,
        isTeacher: false,
        isStudent: false,
        isDevelopment: false,
      });

      const req = new NextRequest('http://localhost:3000/api/users');
      const response = await GET(req);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should allow students to see only their own profile', async () => {
      const studentUser = {
        user: { id: 'student-id', email: 'student@example.com' },
        isAdmin: false,
        isTeacher: false,
        isStudent: true,
        isDevelopment: false,
      };

      (getUserWithRolesSSR as jest.Mock).mockResolvedValue(studentUser);

      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() =>
                Promise.resolve({
                  data: {
                    id: 'student-id',
                    email: 'student@example.com',
                    full_name: 'Student Name',
                    is_admin: false,
                    is_teacher: false,
                    is_student: true,
                    is_shadow: false,
                    is_active: true,
                    student_status: 'active',
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2024-01-01T00:00:00Z',
                  },
                  error: null,
                })
              ),
            })),
          })),
        })),
      };

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const req = new NextRequest('http://localhost:3000/api/users');
      const response = await GET(req);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toHaveLength(1);
      expect(data.data[0].id).toBe('student-id');
    });
  });

  describe('Filtering and Pagination', () => {
    it('should support search query parameter', async () => {
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            or: jest.fn(() => ({
              order: jest.fn(() => ({
                range: jest.fn(() =>
                  Promise.resolve({
                    data: [mockProfiles[0]],
                    error: null,
                    count: 1,
                  })
                ),
              })),
            })),
          })),
        })),
      };

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const req = new NextRequest('http://localhost:3000/api/users?search=John');
      const response = await GET(req);

      expect(response.status).toBe(200);
      await response.json();

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    });

    it('should support pagination with limit and offset', async () => {
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn((start: number, end: number) => {
                expect(start).toBe(10);
                expect(end).toBe(19);
                return Promise.resolve({
                  data: [],
                  error: null,
                  count: 0,
                });
              }),
            })),
          })),
        })),
      };

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const req = new NextRequest('http://localhost:3000/api/users?limit=10&offset=10');
      const response = await GET(req);

      expect(response.status).toBe(200);
    });
  });
});

describe('Users API - POST endpoint', () => {
  const mockAdminUser = {
    user: { id: 'admin-id', email: 'admin@example.com' },
    isAdmin: true,
    isTeacher: false,
    isStudent: false,
    isDevelopment: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getUserWithRolesSSR as jest.Mock).mockResolvedValue(mockAdminUser);
  });

  it('should create a shadow user when email is empty', async () => {
    const mockSupabase = {
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
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    const bodyData = JSON.stringify({
      firstName: 'Shadow',
      lastName: 'Student',
      isStudent: true,
    });

    // Create a proper Request object with text() method
    const req = {
      url: 'http://localhost:3000/api/users',
      method: 'POST',
      text: jest.fn().mockResolvedValue(bodyData),
    } as unknown as Request;

    const response = await POST(req);

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.is_shadow).toBe(true);
  });

  it('should persist student intake fields on the shadow profile', async () => {
    const insertMock = jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() =>
          Promise.resolve({ data: { id: 'shadow-id', is_shadow: true }, error: null })
        ),
      })),
    }));
    (createClient as jest.Mock).mockResolvedValue({
      from: jest.fn(() => ({ insert: insertMock })),
    });

    const bodyData = JSON.stringify({
      email: '',
      full_name: 'Emma Johnson',
      isStudent: true,
      isShadow: true,
      inviteEmail: 'emma@example.com',
      skillLevel: 'advanced',
      instrument: 'Guitar',
      startDate: '2026-04-23',
      avatarColor: '#c89523',
      parentName: 'Karen',
      parentEmail: 'karen@example.com',
      lessonDay: 'Thu',
      lessonTime: '4:00 PM',
      lessonDurationMinutes: 45,
      lessonRate: 65,
      billingCycle: 'monthly',
      goals: 'Wants to play at a wedding',
    });

    const req = {
      url: 'http://localhost:3000/api/users',
      method: 'POST',
      text: jest.fn().mockResolvedValue(bodyData),
    } as unknown as Request;

    const response = await POST(req);
    expect(response.status).toBe(201);

    const insertedRows = insertMock.mock.calls[0][0] as Record<string, unknown>[];
    expect(insertedRows[0]).toMatchObject({
      full_name: 'Emma Johnson',
      invite_email: 'emma@example.com',
      is_shadow: true,
      skill_level: 'advanced',
      instrument: 'Guitar',
      start_date: '2026-04-23',
      avatar_color: '#c89523',
      parent_name: 'Karen',
      parent_email: 'karen@example.com',
      lesson_day: 'Thu',
      lesson_time: '4:00 PM',
      lesson_duration_minutes: 45,
      lesson_rate: 65,
      billing_cycle: 'monthly',
      notes: 'Wants to play at a wedding',
    });
  });

  it('should return 401 for unauthorized users', async () => {
    (getUserWithRolesSSR as jest.Mock).mockResolvedValue({
      user: null,
      isAdmin: false,
      isTeacher: false,
      isStudent: false,
      isDevelopment: false,
    });

    const bodyData = JSON.stringify({
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    });

    const req = {
      url: 'http://localhost:3000/api/users',
      method: 'POST',
      text: jest.fn().mockResolvedValue(bodyData),
    } as unknown as Request;

    const response = await POST(req);

    expect(response.status).toBe(401);
  });

  it('should return 403 when teacher tries to create admin or teacher', async () => {
    (getUserWithRolesSSR as jest.Mock).mockResolvedValue({
      user: { id: 'teacher-id', email: 'teacher@example.com' },
      isAdmin: false,
      isTeacher: true,
      isStudent: false,
      isDevelopment: false,
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
      text: jest.fn().mockResolvedValue(bodyData),
    } as unknown as Request;

    const response = await POST(req);

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('Teachers can only create students');
  });
});
