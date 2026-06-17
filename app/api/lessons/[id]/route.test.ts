/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Lesson API [id] Route Tests
 * Tests for /api/lessons/[id] endpoints (GET, PUT, DELETE)
 */

import { NextRequest, NextResponse } from 'next/server';
import { GET, PUT, DELETE } from '@/app/api/lessons/[id]/route';
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

// Mock the admin Supabase client used by [id]/route.ts and its handlers
jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}));

// Mock calendar sync to avoid real side effects
jest.mock('@/lib/services/calendar-lesson-sync', () => ({
  syncLessonCreation: jest.fn().mockResolvedValue(undefined),
  syncLessonUpdate: jest.fn().mockResolvedValue(undefined),
  syncLessonDeletion: jest.fn().mockResolvedValue(undefined),
}));

describe('Lesson API - [id] Route', () => {
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
  };

  let mockSupabaseClient: any;
  let mockSupabaseQueryBuilder: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
      then: jest.fn((resolve: (value: unknown) => void) =>
        resolve({ data: mockLesson, error: null })
      ),
    };

    mockSupabaseClient = {
      from: jest.fn().mockReturnValue(mockSupabaseQueryBuilder),
    };

    (createAdminClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  describe('GET /api/lessons/[id]', () => {
    it('should return 401 when withApiAuth rejects unauthenticated request', async () => {
      const { withApiAuth } = jest.requireMock('@/lib/auth/withApiAuth') as { withApiAuth: jest.Mock };
      withApiAuth.mockImplementationOnce(() =>
        Promise.resolve(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      );

      const request = new NextRequest(`http://localhost:3000/api/lessons/${validLessonId}`);
      const params = Promise.resolve({ id: validLessonId });
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return a lesson by id', async () => {
      // GET handler uses maybeSingle()
      mockSupabaseQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: mockLesson,
        error: null,
      });

      const request = new NextRequest(`http://localhost:3000/api/lessons/${validLessonId}`);
      const params = Promise.resolve({ id: validLessonId });
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(validLessonId);
    });

    it('should return 404 if lesson is not found', async () => {
      mockSupabaseQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const request = new NextRequest(`http://localhost:3000/api/lessons/${validLessonId}`);
      const params = Promise.resolve({ id: validLessonId });
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Lesson not found');
    });

    it('should handle database errors', async () => {
      mockSupabaseQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const request = new NextRequest(`http://localhost:3000/api/lessons/${validLessonId}`);
      const params = Promise.resolve({ id: validLessonId });
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database connection failed');
    });
  });

  describe('PUT /api/lessons/[id]', () => {
    it('should return 401 when withApiAuth rejects unauthenticated request', async () => {
      const { withApiAuth } = jest.requireMock('@/lib/auth/withApiAuth') as { withApiAuth: jest.Mock };
      withApiAuth.mockImplementationOnce(() =>
        Promise.resolve(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      );

      const request = new NextRequest(`http://localhost:3000/api/lessons/${validLessonId}`, {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated Title' }),
      });
      const params = Promise.resolve({ id: validLessonId });
      const response = await PUT(request, { params });
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

      const request = new NextRequest(`http://localhost:3000/api/lessons/${validLessonId}`, {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated Title' }),
      });
      const params = Promise.resolve({ id: validLessonId });
      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Only admins and teachers can update lessons');
    });

    it('should update a lesson with valid data', async () => {
      // updateLessonHandler calls update().eq().select().single()
      mockSupabaseQueryBuilder.single.mockResolvedValueOnce({
        data: { ...mockLesson, title: 'Updated Title' },
        error: null,
      });

      const request = new NextRequest(`http://localhost:3000/api/lessons/${validLessonId}`, {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated Title' }),
      });
      const params = Promise.resolve({ id: validLessonId });
      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe('Updated Title');
      expect(mockSupabaseQueryBuilder.update).toHaveBeenCalled();
    });

    it('should return 404 if lesson does not exist', async () => {
      mockSupabaseQueryBuilder.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'No rows returned' },
      });

      const request = new NextRequest(`http://localhost:3000/api/lessons/${validLessonId}`, {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated Title' }),
      });
      const params = Promise.resolve({ id: validLessonId });
      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Lesson not found');
    });

    it('should return validation error for invalid update data', async () => {
      const request = new NextRequest(`http://localhost:3000/api/lessons/${validLessonId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'INVALID_STATUS' }),
      });
      const params = Promise.resolve({ id: validLessonId });
      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Validation error');
    });
  });

  describe('DELETE /api/lessons/[id]', () => {
    it('should return 401 when withApiAuth rejects unauthenticated request', async () => {
      const { withApiAuth } = jest.requireMock('@/lib/auth/withApiAuth') as { withApiAuth: jest.Mock };
      withApiAuth.mockImplementationOnce(() =>
        Promise.resolve(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      );

      const request = new NextRequest(`http://localhost:3000/api/lessons/${validLessonId}`, {
        method: 'DELETE',
      });
      const params = Promise.resolve({ id: validLessonId });
      const response = await DELETE(request, { params });
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

      const request = new NextRequest(`http://localhost:3000/api/lessons/${validLessonId}`, {
        method: 'DELETE',
      });
      const params = Promise.resolve({ id: validLessonId });
      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Only admins and teachers can delete lessons');
    });

    it('should delete a lesson successfully', async () => {
      // deleteLessonHandler: syncLessonDeletion then update().eq() (soft delete via thenable)
      mockSupabaseQueryBuilder.then.mockImplementationOnce((resolve: (value: unknown) => void) =>
        resolve({ error: null })
      );

      const request = new NextRequest(`http://localhost:3000/api/lessons/${validLessonId}`, {
        method: 'DELETE',
      });
      const params = Promise.resolve({ id: validLessonId });
      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle database errors', async () => {
      mockSupabaseQueryBuilder.then.mockImplementationOnce((resolve: (value: unknown) => void) =>
        resolve({ error: { message: 'Database connection failed' } })
      );

      const request = new NextRequest(`http://localhost:3000/api/lessons/${validLessonId}`, {
        method: 'DELETE',
      });
      const params = Promise.resolve({ id: validLessonId });
      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database connection failed');
    });
  });
});
