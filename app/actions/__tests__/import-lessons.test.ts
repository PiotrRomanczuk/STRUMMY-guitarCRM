/**
 * Import Lessons Server Actions Tests
 *
 * Tests the Google Calendar import functionality:
 * - importLessonsFromGoogle - Import lessons from calendar events
 * - fetchGoogleEvents - Fetch calendar events
 *
 * @see app/actions/import-lessons.ts
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { importLessonsFromGoogle, fetchGoogleEvents, ImportEvent } from '../import-lessons';

// Mock getUserWithRolesSSR
const mockGetUserWithRolesSSR = jest.fn();
jest.mock('@/lib/getUserWithRolesSSR', () => ({
  getUserWithRolesSSR: () => mockGetUserWithRolesSSR(),
}));

// Mock Supabase client
const mockInsert = jest.fn();
const mockFrom = jest.fn((_table: string) => {
  // Default behavior
  return {
    select: () => ({
      eq: () => ({
        order: () => ({
          limit: () => ({
            single: () => Promise.resolve({ data: null }),
          }),
        }),
        single: () => Promise.resolve({ data: null }),
      }),
    }),
    insert: (data: any) => {
      mockInsert(data);
      return Promise.resolve({ error: null });
    },
  };
});

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: (table: string) => mockFrom(table),
    })
  ),
}));

// Mock import utilities
const mockMatchStudentByEmail = jest.fn();
const mockCreateShadowStudent = jest.fn();

jest.mock('@/lib/services/import-utils', () => ({
  matchStudentByEmail: (email: string) => mockMatchStudentByEmail(email),
  createShadowStudent: (email: string, firstName: string, lastName: string) =>
    mockCreateShadowStudent(email, firstName, lastName),
}));

// Mock Google Calendar
const mockGetCalendarEventsInRange = jest.fn();

jest.mock('@/lib/google', () => ({
  getCalendarEventsInRange: (userId: string, start: Date, end: Date) =>
    mockGetCalendarEventsInRange(userId, start, end),
}));

describe('importLessonsFromGoogle', () => {
  const teacherId = '123e4567-e89b-12d3-a456-426614174000';
  const studentId = '223e4567-e89b-12d3-a456-426614174001';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should import lessons with matched student', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: teacherId },
      isTeacher: true,
      isAdmin: false,
      isStudent: false,
      isDevelopment: false,
    });

    mockMatchStudentByEmail.mockResolvedValue({
      status: 'MATCHED',
      candidates: [{ id: studentId }],
    });

    let lessonQueryCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'lessons') {
        return {
          select: () => {
            lessonQueryCount++;
            if (lessonQueryCount === 1) {
              // Last lesson number query
              return {
                eq: () => ({
                  order: () => ({
                    limit: () => ({
                      single: () => Promise.resolve({
                        data: { lesson_teacher_number: 10 },
                      }),
                    }),
                  }),
                }),
              };
            }
            // Duplicate check
            return {
              eq: () => ({
                single: () => Promise.resolve({ data: null }),
              }),
            };
          },
          insert: (data: any) => {
            mockInsert(data);
            return Promise.resolve({ error: null });
          },
        };
      }
    });

    const events: ImportEvent[] = [
      {
        googleEventId: 'event-1',
        title: 'Guitar Lesson',
        startTime: '2026-02-10T10:00:00Z',
        attendeeEmail: 'student@example.com',
        attendeeName: 'John Doe',
      },
    ];

    const result = await importLessonsFromGoogle(events);

    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(1);
    expect(result.results[0].success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        teacher_id: teacherId,
        student_id: studentId,
        title: 'Guitar Lesson',
        lesson_teacher_number: 11,
      })
    );
  });

  it('should create shadow student when no match found', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: teacherId },
      isTeacher: true,
      isAdmin: false,
      isStudent: false,
      isDevelopment: false,
    });

    mockMatchStudentByEmail.mockResolvedValue({
      status: 'NONE',
      candidates: [],
    });

    const newStudentId = '323e4567-e89b-12d3-a456-426614174002';
    mockCreateShadowStudent.mockResolvedValue({
      success: true,
      profileId: newStudentId,
    });

    let lessonQueryCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'lessons') {
        return {
          select: () => {
            lessonQueryCount++;
            if (lessonQueryCount === 1) {
              return {
                eq: () => ({
                  order: () => ({
                    limit: () => ({
                      single: () => Promise.resolve({ data: null }),
                    }),
                  }),
                }),
              };
            }
            return {
              eq: () => ({
                single: () => Promise.resolve({ data: null }),
              }),
            };
          },
          insert: (data: any) => {
            mockInsert(data);
            return Promise.resolve({ error: null });
          },
        };
      }
    });

    const events: ImportEvent[] = [
      {
        googleEventId: 'event-1',
        title: 'First Lesson',
        startTime: '2026-02-10T10:00:00Z',
        attendeeEmail: 'newstudent@example.com',
        attendeeName: 'New Student',
      },
    ];

    const result = await importLessonsFromGoogle(events);

    expect(result.success).toBe(true);
    expect(mockCreateShadowStudent).toHaveBeenCalledWith('newstudent@example.com', 'New', 'Student');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        student_id: newStudentId,
      })
    );
  });

  it('should handle ambiguous student matches', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: teacherId },
      isTeacher: true,
      isAdmin: false,
      isStudent: false,
      isDevelopment: false,
    });

    mockMatchStudentByEmail.mockResolvedValue({
      status: 'AMBIGUOUS',
      candidates: [
        { id: 'student-1' },
        { id: 'student-2' },
      ],
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'lessons') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  single: () => Promise.resolve({ data: null }),
                }),
              }),
            }),
          }),
        };
      }
    });

    const events: ImportEvent[] = [
      {
        googleEventId: 'event-1',
        title: 'Lesson',
        startTime: '2026-02-10T10:00:00Z',
        attendeeEmail: 'ambiguous@example.com',
      },
    ];

    const result = await importLessonsFromGoogle(events);

    expect(result.success).toBe(true);
    expect(result.results[0].success).toBe(false);
    expect(result.results[0].error).toBe('Student match ambiguous');
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('should skip already imported lessons', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: teacherId },
      isTeacher: true,
      isAdmin: false,
      isStudent: false,
      isDevelopment: false,
    });

    mockMatchStudentByEmail.mockResolvedValue({
      status: 'MATCHED',
      candidates: [{ id: studentId }],
    });

    let lessonQueryCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'lessons') {
        return {
          select: () => {
            lessonQueryCount++;
            if (lessonQueryCount === 1) {
              // Last lesson number
              return {
                eq: () => ({
                  order: () => ({
                    limit: () => ({
                      single: () => Promise.resolve({ data: null }),
                    }),
                  }),
                }),
              };
            }
            // Duplicate check - return existing lesson
            return {
              eq: () => ({
                single: () => Promise.resolve({
                  data: { id: 'existing-lesson-id' },
                }),
              }),
            };
          },
        };
      }
    });

    const events: ImportEvent[] = [
      {
        googleEventId: 'event-1',
        title: 'Lesson',
        startTime: '2026-02-10T10:00:00Z',
        attendeeEmail: 'student@example.com',
      },
    ];

    const result = await importLessonsFromGoogle(events);

    expect(result.success).toBe(true);
    expect(result.results[0].success).toBe(false);
    expect(result.results[0].error).toBe('Already imported');
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('should reject non-teacher users', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: 'student-id' },
      isTeacher: false,
      isAdmin: false,
      isStudent: true,
      isDevelopment: false,
    });

    const result = await importLessonsFromGoogle([]);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('should use manual student ID override', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: teacherId },
      isTeacher: true,
      isAdmin: false,
      isStudent: false,
      isDevelopment: false,
    });

    const manualStudentId = '423e4567-e89b-12d3-a456-426614174003';

    let lessonQueryCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'lessons') {
        return {
          select: () => {
            lessonQueryCount++;
            if (lessonQueryCount === 1) {
              return {
                eq: () => ({
                  order: () => ({
                    limit: () => ({
                      single: () => Promise.resolve({ data: null }),
                    }),
                  }),
                }),
              };
            }
            return {
              eq: () => ({
                single: () => Promise.resolve({ data: null }),
              }),
            };
          },
          insert: (data: any) => {
            mockInsert(data);
            return Promise.resolve({ error: null });
          },
        };
      }
    });

    const events: ImportEvent[] = [
      {
        googleEventId: 'event-1',
        title: 'Lesson',
        startTime: '2026-02-10T10:00:00Z',
        attendeeEmail: 'student@example.com',
        manualStudentId,
      },
    ];

    const result = await importLessonsFromGoogle(events);

    expect(result.success).toBe(true);
    expect(mockMatchStudentByEmail).not.toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        student_id: manualStudentId,
      })
    );
  });

  it('should handle shadow student creation failure', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: teacherId },
      isTeacher: true,
      isAdmin: false,
      isStudent: false,
      isDevelopment: false,
    });

    mockMatchStudentByEmail.mockResolvedValue({
      status: 'NONE',
      candidates: [],
    });

    mockCreateShadowStudent.mockResolvedValue({
      success: false,
      error: 'Failed to create shadow student',
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'lessons') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  single: () => Promise.resolve({ data: null }),
                }),
              }),
            }),
          }),
        };
      }
    });

    const events: ImportEvent[] = [
      {
        googleEventId: 'event-1',
        title: 'Lesson',
        startTime: '2026-02-10T10:00:00Z',
        attendeeEmail: 'newstudent@example.com',
      },
    ];

    const result = await importLessonsFromGoogle(events);

    expect(result.success).toBe(true);
    expect(result.results[0].success).toBe(false);
    expect(result.results[0].error).toBe('Failed to create shadow student');
  });
});

describe('fetchGoogleEvents', () => {
  const teacherId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch calendar events for teacher', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: teacherId },
      isTeacher: true,
      isAdmin: false,
      isStudent: false,
      isDevelopment: false,
    });

    const mockEvents = [
      {
        id: 'event-1',
        summary: 'Guitar Lesson',
        start: { dateTime: '2026-02-10T10:00:00Z' },
      },
    ];

    mockGetCalendarEventsInRange.mockResolvedValue(mockEvents);

    const result = await fetchGoogleEvents('2026-02-01', '2026-02-28');

    expect(result.success).toBe(true);
    expect(result.events).toEqual(mockEvents);
    expect(mockGetCalendarEventsInRange).toHaveBeenCalledWith(
      teacherId,
      expect.any(Date),
      expect.any(Date)
    );
  });

  it('should reject non-teacher users', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: 'student-id' },
      isTeacher: false,
      isAdmin: false,
      isStudent: true,
      isDevelopment: false,
    });

    const result = await fetchGoogleEvents('2026-02-01', '2026-02-28');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
    expect(mockGetCalendarEventsInRange).not.toHaveBeenCalled();
  });

  it('should handle calendar API errors', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: teacherId },
      isTeacher: true,
      isAdmin: false,
      isStudent: false,
      isDevelopment: false,
    });

    mockGetCalendarEventsInRange.mockRejectedValue(new Error('Calendar API error'));

    const result = await fetchGoogleEvents('2026-02-01', '2026-02-28');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Calendar API error');
  });

  it('should handle unknown errors', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: teacherId },
      isTeacher: true,
      isAdmin: false,
      isStudent: false,
      isDevelopment: false,
    });

    mockGetCalendarEventsInRange.mockRejectedValue('Unknown error string');

    const result = await fetchGoogleEvents('2026-02-01', '2026-02-28');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unknown error');
  });
});
