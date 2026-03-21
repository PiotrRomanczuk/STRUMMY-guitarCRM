/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
 
/**
 * Teacher Dashboard Server Actions Tests
 *
 * Tests the teacher dashboard data fetching:
 * - getTeacherDashboardData - Fetch dashboard data for teachers
 *
 * @see app/actions/teacher/dashboard.ts
 */

import { getTeacherDashboardData } from '../teacher/dashboard';

// Mock getUserWithRolesSSR
const mockGetUserWithRolesSSR = jest.fn();
jest.mock('@/lib/getUserWithRolesSSR', () => ({
  getUserWithRolesSSR: () => mockGetUserWithRolesSSR(),
}));

// Helper to build a chainable Supabase mock that resolves to a given value
function chainable(resolveValue: any) {
  const handler: any = new Proxy(() => {}, {
    apply(_target: any, _thisArg: any, _args: any[]) {
      return handler;
    },
    get(_target: any, prop: string) {
      if (prop === 'then') {
        return Promise.resolve(resolveValue).then.bind(Promise.resolve(resolveValue));
      }
      return handler;
    },
  });
  return handler;
}

// mockFrom controls Supabase query behavior per table
const mockFrom = jest.fn((table: string) => chainable({ data: [], count: 0 }));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: (table: string) => mockFrom(table),
    })
  ),
}));

// Mock getTeacherStudentIds
const mockGetTeacherStudentIds = jest.fn();
jest.mock('@/lib/queries/teacher-students', () => ({
  getTeacherStudentIds: (...args: any[]) => mockGetTeacherStudentIds(...args),
}));

/**
 * Creates a standard mock implementation for all tables.
 * Override specific tables by passing overrides.
 */
function createMockFrom(overrides: Record<string, (fields?: string, options?: any) => any> = {}) {
  // Track per-table call counts for multi-call scenarios
  const callCounts: Record<string, number> = {};

  return (table: string) => {
    callCounts[table] = (callCounts[table] || 0) + 1;

    if (overrides[table]) {
      return {
        select: (fields?: string, options?: any) => overrides[table](fields, options),
      };
    }

    // Default: return chainable empty result
    return chainable({ data: [], count: 0 });
  };
}

/** Standard lessons mock: returns count and next lesson data for student queries */
function lessonsSelectMock(count: number, nextLessonDate: string | null) {
  return (fields?: string, options?: any) => {
    if (options?.count === 'exact') {
      return chainable({ count });
    }
    // Range query for chart data (gte chain)
    if (!options) {
      return chainable({ data: [] });
    }
    // Next lesson query
    return chainable({
      data: nextLessonDate ? { scheduled_at: nextLessonDate } : null,
    });
  };
}

describe('getTeacherDashboardData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return dashboard data for teacher', async () => {
    const teacherId = '123e4567-e89b-12d3-a456-426614174000';
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: teacherId },
      isTeacher: true,
      isAdmin: false,
      isStudent: false,
      isDevelopment: false,
    });

    mockGetTeacherStudentIds.mockResolvedValue(['student-1', 'student-2']);

    let lessonsCallIndex = 0;

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            in: () => Promise.resolve({
              data: [
                { id: 'student-1', full_name: 'John Doe', avatar_url: 'https://example.com/avatar1.jpg' },
                { id: 'student-2', full_name: 'Jane Smith', avatar_url: null },
              ],
            }),
          }),
        };
      }

      if (table === 'lessons') {
        lessonsCallIndex++;
        return {
          select: (fields: string, options: any) => {
            if (options?.count === 'exact') {
              // Count queries: per-student completed lessons OR week count
              return chainable({ count: 5 });
            }
            // Could be next-lesson query or chart-data query (gte)
            return chainable({
              data: [],
            });
          },
        };
      }

      if (table === 'songs') {
        return {
          select: (fields: string, options: any) => {
            if (options?.count === 'exact') {
              return chainable({ count: 12 });
            }
            return chainable({
              data: [
                { id: 's1', title: 'Test Song', author: 'Test Artist', level: 'beginner' },
              ],
            });
          },
        };
      }

      if (table === 'assignments') {
        return {
          select: (fields: string, options: any) => {
            if (options?.count === 'exact') {
              return chainable({ count: 3 });
            }
            return chainable({
              data: [],
            });
          },
        };
      }

      return chainable({ data: [], count: 0 });
    });

    const result = await getTeacherDashboardData();

    expect(result).toHaveProperty('students');
    expect(result).toHaveProperty('activities');
    expect(result).toHaveProperty('chartData');
    expect(result).toHaveProperty('songs');
    expect(result).toHaveProperty('assignments');
    expect(result).toHaveProperty('stats');

    expect(result.students).toHaveLength(2);
    expect(result.students[0]).toEqual({
      id: 'student-1',
      name: 'John Doe',
      level: 'Intermediate',
      lessonsCompleted: 5,
      nextLesson: expect.any(String),
      avatar: 'https://example.com/avatar1.jpg',
    });

    expect(result.stats.totalStudents).toBe(2);
    // Activities are now empty (no mock data)
    expect(result.activities).toHaveLength(0);
    expect(result.chartData).toHaveLength(7);
  });

  it('should return dashboard data for admin', async () => {
    const adminId = '223e4567-e89b-12d3-a456-426614174001';
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: adminId },
      isTeacher: false,
      isAdmin: true,
      isStudent: false,
      isDevelopment: false,
    });

    mockGetTeacherStudentIds.mockResolvedValue([]);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: [] }),
          }),
        };
      }
      return chainable({ data: [], count: 0 });
    });

    const result = await getTeacherDashboardData();

    expect(result.students).toHaveLength(0);
    expect(result.stats.totalStudents).toBe(0);
  });

  it('should reject student attempting to access', async () => {
    const studentId = '323e4567-e89b-12d3-a456-426614174002';
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: studentId },
      isTeacher: false,
      isAdmin: false,
      isStudent: true,
      isDevelopment: false,
    });

    await expect(getTeacherDashboardData()).rejects.toThrow('Unauthorized');

    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('should reject unauthenticated user', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: null,
      isTeacher: false,
      isAdmin: false,
      isStudent: false,
      isDevelopment: false,
    });

    await expect(getTeacherDashboardData()).rejects.toThrow('Unauthorized');
  });

  it('should handle students with no lessons', async () => {
    const teacherId = '423e4567-e89b-12d3-a456-426614174003';
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: teacherId },
      isTeacher: true,
      isAdmin: false,
      isStudent: false,
      isDevelopment: false,
    });

    mockGetTeacherStudentIds.mockResolvedValue(['student-1']);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            in: () => Promise.resolve({
              data: [{ id: 'student-1', full_name: 'New Student', avatar_url: null }],
            }),
          }),
        };
      }

      if (table === 'lessons') {
        return {
          select: (fields: string, options: any) => {
            if (options?.count === 'exact') {
              return chainable({ count: 0 });
            }
            return chainable({ data: null });
          },
        };
      }

      return chainable({ data: [], count: 0 });
    });

    const result = await getTeacherDashboardData();

    expect(result.students).toHaveLength(1);
    expect(result.students[0].lessonsCompleted).toBe(0);
    expect(result.students[0].nextLesson).toBe('No upcoming lessons');
    expect(result.students[0].level).toBe('Beginner');
  });

  it('should handle student with unknown name', async () => {
    const teacherId = '523e4567-e89b-12d3-a456-426614174004';
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: teacherId },
      isTeacher: true,
      isAdmin: false,
      isStudent: false,
      isDevelopment: false,
    });

    mockGetTeacherStudentIds.mockResolvedValue(['student-1']);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            in: () => Promise.resolve({
              data: [{ id: 'student-1', full_name: null, avatar_url: null }],
            }),
          }),
        };
      }

      if (table === 'lessons') {
        return {
          select: (fields: string, options: any) => {
            if (options?.count === 'exact') {
              return chainable({ count: 0 });
            }
            return chainable({ data: null });
          },
        };
      }

      return chainable({ data: [], count: 0 });
    });

    const result = await getTeacherDashboardData();

    expect(result.students[0].name).toBe('Unknown');
  });

  it('should return empty arrays for activities and assignments', async () => {
    const teacherId = '623e4567-e89b-12d3-a456-426614174005';
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: teacherId },
      isTeacher: true,
      isAdmin: false,
      isStudent: false,
      isDevelopment: false,
    });

    mockGetTeacherStudentIds.mockResolvedValue([]);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: [] }),
          }),
        };
      }
      return chainable({ data: [], count: 0 });
    });

    const result = await getTeacherDashboardData();

    // Activities and assignments return empty arrays (no mock data)
    expect(result.activities).toEqual([]);
    expect(result.assignments).toEqual([]);

    // Chart data has 7 days with real (zero) values
    expect(result.chartData).toHaveLength(7);
    expect(result.chartData[0]).toHaveProperty('name');
    expect(result.chartData[0]).toHaveProperty('lessons');
    expect(result.chartData[0]).toHaveProperty('assignments');

    // Songs are fetched from DB (empty in this mock)
    expect(result.songs).toEqual([]);
  });

  it('should calculate stats from real database counts', async () => {
    const teacherId = '723e4567-e89b-12d3-a456-426614174006';
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: teacherId },
      isTeacher: true,
      isAdmin: false,
      isStudent: false,
      isDevelopment: false,
    });

    mockGetTeacherStudentIds.mockResolvedValue(['student-1', 'student-2', 'student-3']);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            in: () => Promise.resolve({
              data: [
                { id: 'student-1', full_name: 'Student 1', avatar_url: null },
                { id: 'student-2', full_name: 'Student 2', avatar_url: null },
                { id: 'student-3', full_name: 'Student 3', avatar_url: null },
              ],
            }),
          }),
        };
      }

      if (table === 'lessons') {
        return {
          select: (fields: string, options: any) => {
            if (options?.count === 'exact') {
              return chainable({ count: 7 });
            }
            return chainable({ data: null });
          },
        };
      }

      if (table === 'songs') {
        return {
          select: (fields: string, options: any) => {
            if (options?.count === 'exact') {
              return chainable({ count: 25 });
            }
            return chainable({ data: [] });
          },
        };
      }

      if (table === 'assignments') {
        return {
          select: (fields: string, options: any) => {
            if (options?.count === 'exact') {
              return chainable({ count: 4 });
            }
            return chainable({
              data: [],
            });
          },
        };
      }

      return chainable({ data: [], count: 0 });
    });

    const result = await getTeacherDashboardData();

    expect(result.stats.totalStudents).toBe(3);
    expect(result.stats.songsInLibrary).toBe(25);
    // lessonsThisWeek uses the same count mock (7) for the week range query
    expect(result.stats.lessonsThisWeek).toBe(7);
    expect(result.stats.pendingAssignments).toBe(4);
  });

  it('should derive student level from lesson count', async () => {
    const teacherId = '823e4567-e89b-12d3-a456-426614174007';
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: teacherId },
      isTeacher: true,
      isAdmin: false,
      isStudent: false,
      isDevelopment: false,
    });

    mockGetTeacherStudentIds.mockResolvedValue(['beginner', 'intermediate', 'advanced']);

    // Return three students; each will get the same lesson count from our mock
    // We test the boundary logic by checking specific counts
    const studentCounts = [0, 5, 20];
    let studentIndex = 0;

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            in: () => Promise.resolve({
              data: [
                { id: 'beginner', full_name: 'Beginner Student', avatar_url: null },
                { id: 'intermediate', full_name: 'Intermediate Student', avatar_url: null },
                { id: 'advanced', full_name: 'Advanced Student', avatar_url: null },
              ],
            }),
          }),
        };
      }

      if (table === 'lessons') {
        return {
          select: (fields: string, options: any) => {
            if (options?.count === 'exact') {
              const count = studentCounts[studentIndex] ?? 0;
              studentIndex++;
              return chainable({ count });
            }
            return chainable({ data: null });
          },
        };
      }

      return chainable({ data: [], count: 0 });
    });

    const result = await getTeacherDashboardData();

    expect(result.students[0].level).toBe('Beginner');
    expect(result.students[1].level).toBe('Intermediate');
    expect(result.students[2].level).toBe('Advanced');
  });

  it('should return real songs from database', async () => {
    const teacherId = '923e4567-e89b-12d3-a456-426614174008';
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: teacherId },
      isTeacher: true,
      isAdmin: false,
      isStudent: false,
      isDevelopment: false,
    });

    mockGetTeacherStudentIds.mockResolvedValue([]);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: [] }),
          }),
        };
      }

      if (table === 'songs') {
        return {
          select: (fields: string, options: any) => {
            if (options?.count === 'exact') {
              return chainable({ count: 2 });
            }
            return chainable({
              data: [
                { id: 's1', title: 'Wonderwall', author: 'Oasis', level: 'beginner' },
                { id: 's2', title: 'Stairway', author: 'Led Zeppelin', level: 'advanced' },
              ],
            });
          },
        };
      }

      return chainable({ data: [], count: 0 });
    });

    const result = await getTeacherDashboardData();

    expect(result.songs).toHaveLength(2);
    expect(result.songs[0]).toEqual({
      id: 's1',
      title: 'Wonderwall',
      artist: 'Oasis',
      difficulty: 'Easy',
      duration: '',
      studentsLearning: 0,
    });
    expect(result.songs[1].difficulty).toBe('Hard');
    expect(result.stats.songsInLibrary).toBe(2);
  });
});
