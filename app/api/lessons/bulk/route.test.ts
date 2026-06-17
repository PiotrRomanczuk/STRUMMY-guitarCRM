/**
 * Lesson API Bulk Operations Tests
 * Tests for /api/lessons/bulk endpoints (POST, PUT, DELETE)
 */

import { NextRequest, NextResponse } from 'next/server';
import { POST, PUT, DELETE } from '@/app/api/lessons/bulk/route';
import { createClient } from '@/lib/supabase/server';

// Mock withApiAuth — bypass real auth; pass through to handler with admin+teacher context
jest.mock('@/lib/auth/withApiAuth', () => ({
  withApiAuth: jest.fn(
    (_request: Request, handler: (auth: unknown) => Promise<Response>, _options?: unknown) =>
      handler({
        user: { id: 'mock-user-id', email: 'test@example.com' },
        roles: { isAdmin: true, isTeacher: true, isStudent: false },
        flags: { isParent: false, isDevelopment: false },
      })
  ),
}));

// Mock Supabase server client (bulk route uses createClient, not createAdminClient)
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('Lesson API - Bulk Operations', () => {
  const validStudentId = '00000001-0000-4000-a000-000000000001';
  const validTeacherId = '00000002-0000-4000-a000-000000000002';
  const validUserId = '00000003-0000-4000-a000-000000000003';
  const validLessonId1 = '00000004-0000-4000-a000-000000000004';
  const validLessonId2 = '00000005-0000-4000-a000-000000000005';
  const validLessonId3 = '00000006-0000-4000-a000-000000000006';

  const mockLesson = {
    id: validLessonId1,
    student_id: validStudentId,
    teacher_id: validTeacherId,
    creator_user_id: validUserId,
    title: 'Guitar Basics',
    scheduled_at: '2024-01-15T10:00:00Z',
    status: 'SCHEDULED',
    lesson_teacher_number: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabaseClient: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let lessonBuilder: any;

  beforeEach(() => {
    jest.clearAllMocks();

    lessonBuilder = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [] }),
      single: jest.fn().mockResolvedValue({ data: mockLesson, error: null }),
      then: jest.fn((resolve: (value: unknown) => void) =>
        resolve({ data: [mockLesson], error: null })
      ),
    };

    mockSupabaseClient = {
      from: jest.fn().mockReturnValue(lessonBuilder),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
  });

  describe('POST /api/lessons/bulk (Bulk Create)', () => {
    it('should return 401 when withApiAuth rejects unauthenticated request', async () => {
      const { withApiAuth } = require('@/lib/auth/withApiAuth');
      withApiAuth.mockImplementationOnce(() =>
        Promise.resolve(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      );

      const request = new NextRequest('http://localhost:3000/api/lessons/bulk', {
        method: 'POST',
        body: JSON.stringify({ lessons: [] }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return forbidden if user is not admin or teacher', async () => {
      const { withApiAuth } = require('@/lib/auth/withApiAuth');
      withApiAuth.mockImplementationOnce(
        (_req: Request, handler: (auth: unknown) => Promise<Response>) =>
          handler({
            user: { id: 'mock-user-id', email: 'student@example.com' },
            roles: { isAdmin: false, isTeacher: false, isStudent: true },
            flags: { isParent: false, isDevelopment: false },
          })
      );

      const request = new NextRequest('http://localhost:3000/api/lessons/bulk', {
        method: 'POST',
        body: JSON.stringify({ lessons: [] }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should return error if lessons array is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/lessons/bulk', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Lessons array is required and cannot be empty');
    });

    it('should return error if lessons array is empty', async () => {
      const request = new NextRequest('http://localhost:3000/api/lessons/bulk', {
        method: 'POST',
        body: JSON.stringify({ lessons: [] }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Lessons array is required and cannot be empty');
    });

    it('should return error if more than 100 lessons', async () => {
      const lessons = Array(101).fill({
        student_id: validStudentId,
        teacher_id: validTeacherId,
      });

      const request = new NextRequest('http://localhost:3000/api/lessons/bulk', {
        method: 'POST',
        body: JSON.stringify({ lessons }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Cannot process more than 100 lessons at once');
    });

    it('should create multiple lessons successfully', async () => {
      lessonBuilder.single
        .mockResolvedValueOnce({ data: { ...mockLesson, id: validLessonId1 }, error: null })
        .mockResolvedValueOnce({ data: { ...mockLesson, id: validLessonId2 }, error: null });

      const lessons = [
        {
          student_id: validStudentId,
          teacher_id: validTeacherId,
          scheduled_at: '2024-01-15T10:00:00Z',
        },
        {
          student_id: validStudentId,
          teacher_id: validTeacherId,
          scheduled_at: '2024-01-16T10:00:00Z',
        },
      ];

      const request = new NextRequest('http://localhost:3000/api/lessons/bulk', {
        method: 'POST',
        body: JSON.stringify({ lessons }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(2);
      expect(data.failed).toBe(0);
      expect(data.created).toHaveLength(2);
    });

    it('should handle validation errors for individual lessons', async () => {
      lessonBuilder.single.mockResolvedValueOnce({
        data: { ...mockLesson, id: validLessonId1 },
        error: null,
      });

      const lessons = [
        {
          student_id: validStudentId,
          teacher_id: validTeacherId,
          scheduled_at: '2024-01-15T10:00:00Z',
        },
        {
          // Missing required fields (student_id, teacher_id, scheduled_at)
          title: 'Invalid Lesson',
        },
      ];

      const request = new NextRequest('http://localhost:3000/api/lessons/bulk', {
        method: 'POST',
        body: JSON.stringify({ lessons }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.errors).toHaveLength(1);
      expect(data.errors[0].error).toBe('Validation failed');
    });

    it('should handle database errors for individual lessons', async () => {
      lessonBuilder.single
        .mockResolvedValueOnce({ data: { ...mockLesson, id: validLessonId1 }, error: null })
        .mockResolvedValueOnce({ data: null, error: { message: 'Database error' } });

      const lessons = [
        {
          student_id: validStudentId,
          teacher_id: validTeacherId,
          scheduled_at: '2024-01-15T10:00:00Z',
        },
        {
          student_id: validStudentId,
          teacher_id: validTeacherId,
          scheduled_at: '2024-01-16T10:00:00Z',
        },
      ];

      const request = new NextRequest('http://localhost:3000/api/lessons/bulk', {
        method: 'POST',
        body: JSON.stringify({ lessons }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(1);
      expect(data.failed).toBe(1);
    });
  });

  describe('PUT /api/lessons/bulk (Bulk Update)', () => {
    it('should update multiple lessons successfully', async () => {
      lessonBuilder.single
        .mockResolvedValueOnce({
          data: { ...mockLesson, id: validLessonId1, title: 'Updated Title 1' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { ...mockLesson, id: validLessonId2, status: 'COMPLETED' },
          error: null,
        });

      const updates = [
        { id: validLessonId1, title: 'Updated Title 1' },
        { id: validLessonId2, status: 'COMPLETED' },
      ];

      const request = new NextRequest('http://localhost:3000/api/lessons/bulk', {
        method: 'PUT',
        body: JSON.stringify({ updates }),
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(2);
      expect(data.failed).toBe(0);
    });

    it('should return error if ID is missing in update', async () => {
      const updates = [
        {
          title: 'Updated Title',
          // Missing id
        },
      ];

      const request = new NextRequest('http://localhost:3000/api/lessons/bulk', {
        method: 'PUT',
        body: JSON.stringify({ updates }),
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.errors).toHaveLength(1);
      expect(data.errors[0].error).toBe('Lesson ID is required');
    });
  });

  describe('DELETE /api/lessons/bulk (Bulk Delete)', () => {
    it('should delete multiple lessons successfully', async () => {
      // Soft-delete: update().eq() — awaited via then()
      lessonBuilder.then = jest
        .fn()
        .mockImplementationOnce((resolve: (value: unknown) => void) => resolve({ error: null }))
        .mockImplementationOnce((resolve: (value: unknown) => void) => resolve({ error: null }))
        .mockImplementationOnce((resolve: (value: unknown) => void) => resolve({ error: null }));

      const lessonIds = [validLessonId1, validLessonId2, validLessonId3];

      const request = new NextRequest('http://localhost:3000/api/lessons/bulk', {
        method: 'DELETE',
        body: JSON.stringify({ lessonIds }),
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(3);
      expect(data.failed).toBe(0);
      expect(data.deleted).toHaveLength(3);
    });

    it('should return error if lessonIds array is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/lessons/bulk', {
        method: 'DELETE',
        body: JSON.stringify({}),
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Lesson IDs array is required and cannot be empty');
    });

    it('should handle deletion errors for individual lessons', async () => {
      lessonBuilder.then = jest
        .fn()
        .mockImplementationOnce((resolve: (value: unknown) => void) => resolve({ error: null }))
        .mockImplementationOnce((resolve: (value: unknown) => void) => resolve({ error: null }))
        .mockImplementationOnce((resolve: (value: unknown) => void) =>
          resolve({ error: { message: 'Not found' } })
        );

      const lessonIds = [validLessonId1, validLessonId2, validLessonId3];

      const request = new NextRequest('http://localhost:3000/api/lessons/bulk', {
        method: 'DELETE',
        body: JSON.stringify({ lessonIds }),
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(2);
      expect(data.failed).toBe(1);
    });
  });
});
