/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Lesson API Route Tests
 * Tests for /api/lessons endpoints (GET, POST)
 */

import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/lessons/route';
import { createAdminClient } from '@/lib/supabase/admin';

// Mock withApiAuth — bypass real auth; pass through to handler with admin context
jest.mock('@/lib/auth/withApiAuth', () => ({
  withApiAuth: jest.fn(
    (_request: Request, handler: (auth: unknown) => Promise<Response>, _options?: unknown) =>
      handler({
        user: { id: 'mock-user-id', email: 'test@example.com' },
        roles: { isAdmin: true, isTeacher: false, isStudent: false },
        flags: { isParent: false, isDevelopment: false },
      })
  ),
}));

// Mock the admin Supabase client used by route.ts
jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}));

// Mock calendar sync to avoid real side effects
jest.mock('@/lib/services/calendar-lesson-sync', () => ({
  syncLessonCreation: jest.fn().mockResolvedValue(undefined),
  syncLessonUpdate: jest.fn().mockResolvedValue(undefined),
  syncLessonDeletion: jest.fn().mockResolvedValue(undefined),
}));

describe('Lesson API - Main Route', () => {
  const validStudentId = '00000001-0000-4000-a000-000000000001';
  const validTeacherId = '00000002-0000-4000-a000-000000000002';
  const validUserId = '00000003-0000-4000-a000-000000000003';
  const validLessonId = '00000004-0000-4000-a000-000000000004';

  const mockLesson = {
    id: validLessonId,
    student_id: validStudentId,
    teacher_id: validTeacherId,
    creator_user_id: validUserId,
    title: 'Guitar Basics',
    notes: 'Introduction to guitar',
    date: '2024-01-15T10:00:00Z',
    start_time: '10:00',
    status: 'SCHEDULED',
    lesson_number: 1,
    lesson_teacher_number: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    profile: {
      email: 'student@example.com',
      first_name: 'John',
      last_name: 'Doe',
    },
    teacher_profile: {
      email: 'teacher@example.com',
      first_name: 'Jane',
      last_name: 'Smith',
    },
  };

  let mockSupabaseClient: any;
  let mockSupabaseQueryBuilder: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      then: jest.fn((resolve: (value: unknown) => void) =>
        resolve({ data: [mockLesson], error: null, count: 1 })
      ),
    };

    mockSupabaseClient = {
      from: jest.fn().mockReturnValue(mockSupabaseQueryBuilder),
    };

    (createAdminClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  describe('GET /api/lessons', () => {
    it('should return 401 when withApiAuth rejects unauthenticated request', async () => {
      const { withApiAuth } = jest.requireMock('@/lib/auth/withApiAuth') as { withApiAuth: jest.Mock };
      withApiAuth.mockImplementationOnce(() =>
        Promise.resolve(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      );

      const request = new NextRequest('http://localhost:3000/api/lessons');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return all lessons for authenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/lessons');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.lessons).toHaveLength(1);
      expect(data.lessons[0].id).toBe(validLessonId);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('lessons');
    });

    it('should filter lessons by userId', async () => {
      const request = new NextRequest(`http://localhost:3000/api/lessons?userId=${validStudentId}`);
      const response = await GET(request);
      await response.json();

      expect(response.status).toBe(200);
      expect(mockSupabaseQueryBuilder.or).toHaveBeenCalledWith(
        `student_id.eq.${validStudentId},teacher_id.eq.${validStudentId}`
      );
    });

    it('should filter lessons by status', async () => {
      const request = new NextRequest('http://localhost:3000/api/lessons?filter=SCHEDULED');
      const response = await GET(request);
      await response.json();

      expect(response.status).toBe(200);
      expect(mockSupabaseQueryBuilder.eq).toHaveBeenCalledWith('status', 'SCHEDULED');
    });

    it('should apply permissive status filter', async () => {
      const request = new NextRequest('http://localhost:3000/api/lessons?filter=INVALID_STATUS');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabaseQueryBuilder.eq).toHaveBeenCalledWith('status', 'INVALID_STATUS');
    });

    it('should sort lessons by date', async () => {
      const request = new NextRequest('http://localhost:3000/api/lessons?sort=date');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabaseQueryBuilder.order).toHaveBeenCalledWith('date', {
        ascending: false,
      });
    });

    it('should filter lessons by studentId', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/lessons?studentId=${validStudentId}`
      );
      const response = await GET(request);
      await response.json();

      expect(response.status).toBe(200);
      expect(mockSupabaseQueryBuilder.eq).toHaveBeenCalledWith('student_id', validStudentId);
    });

    it('should handle invalid studentId format permissively', async () => {
      const request = new NextRequest('http://localhost:3000/api/lessons?studentId=invalid-uuid');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabaseQueryBuilder.then.mockImplementationOnce((resolve: (value: unknown) => void) =>
        resolve({
          data: null,
          error: { message: 'Database connection failed' },
          count: 0,
        })
      );

      const request = new NextRequest('http://localhost:3000/api/lessons');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database connection failed');
    });

    it('should handle lessons with null profile data', async () => {
      const lessonWithNullProfile = { ...mockLesson, profile: null, teacher_profile: null };

      mockSupabaseQueryBuilder.then.mockImplementationOnce((resolve: (value: unknown) => void) =>
        resolve({ data: [lessonWithNullProfile], error: null, count: 1 })
      );

      const request = new NextRequest('http://localhost:3000/api/lessons');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.lessons).toHaveLength(1);
      expect(data.lessons[0].profile).toBeNull();
    });

    it('should handle lessons with missing optional fields', async () => {
      const minimalLesson = {
        id: validLessonId,
        student_id: validStudentId,
        teacher_id: validTeacherId,
        creator_user_id: validUserId,
        status: 'SCHEDULED',
        date: '2024-01-15T10:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockSupabaseQueryBuilder.then.mockImplementationOnce((resolve: (value: unknown) => void) =>
        resolve({ data: [minimalLesson], error: null, count: 1 })
      );

      const request = new NextRequest('http://localhost:3000/api/lessons');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.lessons).toHaveLength(1);
    });
  });

  describe('POST /api/lessons', () => {
    const mockTeacherProfile = { id: validTeacherId, is_teacher: true };
    const mockStudentProfile = { id: validStudentId, is_student: true };
    const mockInsertedLesson = { ...mockLesson, id: validLessonId };

    it('should return 401 when withApiAuth rejects unauthenticated request', async () => {
      const { withApiAuth } = jest.requireMock('@/lib/auth/withApiAuth') as { withApiAuth: jest.Mock };
      withApiAuth.mockImplementationOnce(() =>
        Promise.resolve(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      );

      const request = new NextRequest('http://localhost:3000/api/lessons', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return forbidden if user is not admin or teacher', async () => {
      const { withApiAuth } = jest.requireMock('@/lib/auth/withApiAuth') as { withApiAuth: jest.Mock };
      withApiAuth.mockImplementationOnce(
        (_req: Request, handler: (auth: unknown) => Promise<Response>) =>
          handler({
            user: { id: 'mock-user-id', email: 'student@example.com' },
            roles: { isAdmin: false, isTeacher: false, isStudent: true },
            flags: { isParent: false, isDevelopment: false },
          })
      );

      const request = new NextRequest('http://localhost:3000/api/lessons', {
        method: 'POST',
        body: JSON.stringify({
          student_id: validStudentId,
          teacher_id: validTeacherId,
          scheduled_at: '2024-01-15T10:00:00Z',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Only admins and teachers can create lessons');
    });

    it('should create a lesson with valid data', async () => {
      // createLessonHandler: profiles(teacher).single -> profiles(student).single -> lessons.insert.select.single
      mockSupabaseQueryBuilder.single
        .mockResolvedValueOnce({ data: mockTeacherProfile, error: null })
        .mockResolvedValueOnce({ data: mockStudentProfile, error: null })
        .mockResolvedValueOnce({ data: mockInsertedLesson, error: null });

      const request = new NextRequest('http://localhost:3000/api/lessons', {
        method: 'POST',
        body: JSON.stringify({
          student_id: validStudentId,
          teacher_id: validTeacherId,
          title: 'Guitar Basics',
          notes: 'Introduction to guitar',
          scheduled_at: '2024-01-15T10:00:00Z',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe(validLessonId);
      expect(mockSupabaseQueryBuilder.insert).toHaveBeenCalled();
    });

    it('should return validation error for missing required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/lessons', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Guitar Basics',
          // Missing student_id, teacher_id, scheduled_at
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Validation error');
    });

    it('should return validation error for invalid UUID format', async () => {
      const request = new NextRequest('http://localhost:3000/api/lessons', {
        method: 'POST',
        body: JSON.stringify({
          student_id: 'invalid-uuid',
          teacher_id: validTeacherId,
          scheduled_at: '2024-01-15T10:00:00Z',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Validation error');
    });

    it('should handle database insertion errors', async () => {
      mockSupabaseQueryBuilder.single
        .mockResolvedValueOnce({ data: mockTeacherProfile, error: null })
        .mockResolvedValueOnce({ data: mockStudentProfile, error: null })
        .mockResolvedValueOnce({ data: null, error: { message: 'Database error' } });

      const request = new NextRequest('http://localhost:3000/api/lessons', {
        method: 'POST',
        body: JSON.stringify({
          student_id: validStudentId,
          teacher_id: validTeacherId,
          scheduled_at: '2024-01-15T10:00:00Z',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database error');
    });

    it('should set default status to SCHEDULED if not provided', async () => {
      mockSupabaseQueryBuilder.single
        .mockResolvedValueOnce({ data: mockTeacherProfile, error: null })
        .mockResolvedValueOnce({ data: mockStudentProfile, error: null })
        .mockResolvedValueOnce({
          data: { ...mockInsertedLesson, status: 'SCHEDULED' },
          error: null,
        });

      const request = new NextRequest('http://localhost:3000/api/lessons', {
        method: 'POST',
        body: JSON.stringify({
          student_id: validStudentId,
          teacher_id: validTeacherId,
          scheduled_at: '2024-01-15T10:00:00Z',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.status).toBe('SCHEDULED');
    });
  });
});
