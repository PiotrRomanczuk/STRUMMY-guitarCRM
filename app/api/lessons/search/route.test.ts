/**
 * Lesson API Search Route Tests
 * Tests for /api/lessons/search endpoint
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/lessons/search/route';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/auth/withApiAuth', () => ({
  withApiAuth: jest.fn((_request: Request, handler: (auth: unknown) => Promise<Response>) =>
    handler({
      user: { id: 'mock-user-id', email: 'test@example.com' },
      profile: { id: 'mock-user-id', is_admin: true },
      roles: { isAdmin: true, isTeacher: false, isStudent: false },
    })
  ),
}));

describe('Lesson API - Search Route', () => {
  const mockUser = {
    id: 'user-123',
    email: 'teacher@example.com',
  };

  const mockLessons = [
    {
      id: 'lesson-1',
      student_id: 'student-456',
      teacher_id: 'teacher-789',
      title: 'Guitar Basics',
      notes: 'Introduction',
      date: '2024-01-15T10:00:00Z',
      status: 'SCHEDULED',
    },
    {
      id: 'lesson-2',
      student_id: 'student-456',
      teacher_id: 'teacher-789',
      title: 'Advanced Techniques',
      notes: 'Intermediate level',
      date: '2024-01-16T10:00:00Z',
      status: 'COMPLETED',
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({
        data: mockLessons,
        error: null,
        count: 2,
      }),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('GET /api/lessons/search', () => {
    it('should return all lessons for admin without role filter', async () => {
      // Admin role is injected via withApiAuth mock — no auto-filter on teacher_id/student_id
      const request = new NextRequest('http://localhost:3000/api/lessons/search');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.lessons).toHaveLength(2);
    });

    it('should search lessons with query parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/lessons/search?q=guitar');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.lessons).toHaveLength(2);
      expect(mockSupabase.or).toHaveBeenCalledWith('title.ilike.%guitar%,notes.ilike.%guitar%');
    });

    it('should filter by status', async () => {
      const request = new NextRequest('http://localhost:3000/api/lessons/search?status=SCHEDULED');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'SCHEDULED');
    });

    it('should return error for invalid status', async () => {
      const request = new NextRequest('http://localhost:3000/api/lessons/search?status=INVALID');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid status filter');
    });

    it('should filter by studentId', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/lessons/search?studentId=student-456'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabase.eq).toHaveBeenCalledWith('student_id', 'student-456');
    });

    it('should filter by teacherId', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/lessons/search?teacherId=teacher-789'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabase.eq).toHaveBeenCalledWith('teacher_id', 'teacher-789');
    });

    it('should filter by date range', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/lessons/search?dateFrom=2024-01-01&dateTo=2024-01-31'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabase.gte).toHaveBeenCalledWith('scheduled_at', '2024-01-01');
      expect(mockSupabase.lte).toHaveBeenCalledWith('scheduled_at', '2024-01-31');
    });

    it('should sort by specified field in ascending order', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/lessons/search?sortBy=title&sortOrder=asc'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabase.order).toHaveBeenCalledWith('title', {
        ascending: true,
      });
    });

    it('should sort by specified field in descending order', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/lessons/search?sortBy=scheduled_at&sortOrder=desc'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabase.order).toHaveBeenCalledWith('scheduled_at', {
        ascending: false,
      });
    });

    it('should use default sorting when invalid sort field provided', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/lessons/search?sortBy=invalid_field'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', {
        ascending: false,
      });
    });

    it('should apply pagination with limit and offset', async () => {
      const request = new NextRequest('http://localhost:3000/api/lessons/search?limit=10&offset=5');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockSupabase.range).toHaveBeenCalledWith(5, 14); // offset to offset+limit-1
      expect(data.limit).toBe(10);
      expect(data.offset).toBe(5);
    });

    it('should use default pagination values', async () => {
      const request = new NextRequest('http://localhost:3000/api/lessons/search');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockSupabase.range).toHaveBeenCalledWith(0, 19); // default: 0 to 19
      expect(data.limit).toBe(20);
      expect(data.offset).toBe(0);
    });

    it('should indicate hasMore correctly when results equal limit', async () => {
      mockSupabase.range.mockResolvedValue({
        data: Array(20).fill(mockLessons[0]),
        error: null,
        count: 100,
      });

      const request = new NextRequest('http://localhost:3000/api/lessons/search?limit=20');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hasMore).toBe(true);
      expect(data.lessons).toHaveLength(20);
    });

    it('should indicate hasMore as false when results less than limit', async () => {
      mockSupabase.range.mockResolvedValue({
        data: mockLessons,
        error: null,
        count: 2,
      });

      const request = new NextRequest('http://localhost:3000/api/lessons/search?limit=20');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hasMore).toBe(false);
      expect(data.lessons).toHaveLength(2);
    });

    it('should combine multiple filters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/lessons/search?q=guitar&status=SCHEDULED&studentId=student-456&dateFrom=2024-01-01'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabase.or).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'SCHEDULED');
      expect(mockSupabase.eq).toHaveBeenCalledWith('student_id', 'student-456');
      expect(mockSupabase.gte).toHaveBeenCalledWith('scheduled_at', '2024-01-01');
    });

    it('should handle database errors', async () => {
      mockSupabase.range.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const request = new NextRequest('http://localhost:3000/api/lessons/search');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database connection failed');
    });

    it('should handle empty search results', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const request = new NextRequest('http://localhost:3000/api/lessons/search?q=nonexistent');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.lessons).toHaveLength(0);
      expect(data.total).toBe(0);
      expect(data.hasMore).toBe(false);
    });

    it('should skip invalid lessons during validation', async () => {
      const mixedLessons = [
        mockLessons[0],
        { id: null, student_id: null }, // Invalid lesson
        mockLessons[1],
      ];

      mockSupabase.range.mockResolvedValue({
        data: mixedLessons,
        error: null,
        count: 3,
      });

      const request = new NextRequest('http://localhost:3000/api/lessons/search');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.lessons).toHaveLength(2); // Only valid lessons
    });
  });
});
