/**
 * Student Dashboard Server Actions Tests
 *
 * Tests the student dashboard data fetching:
 * - getStudentDashboardData - Fetch dashboard data for students
 *
 * @see app/actions/student/dashboard.ts
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { getStudentDashboardData } from '../student/dashboard';

// Mock getUserWithRolesSSR
const mockGetUserWithRolesSSR = jest.fn();
jest.mock('@/lib/getUserWithRolesSSR', () => ({
  getUserWithRolesSSR: () => mockGetUserWithRolesSSR(),
}));

// Helper to create default query chain supporting all methods
const createDefaultChain = (): any => ({
  eq: () => createDefaultChain(),
  gte: () => createDefaultChain(),
  gt: () => createDefaultChain(),
  lt: () => createDefaultChain(),
  lte: () => createDefaultChain(),
  in: () => createDefaultChain(),
  order: () => createDefaultChain(),
  limit: () => createDefaultChain(),
  single: () => Promise.resolve({ data: null }),
  maybeSingle: () => Promise.resolve({ data: null }),
  then: (resolve: any) => resolve({ data: [], count: 0 }),
});

// Helper to create default table mock
const createDefaultTableMock = () => ({
  select: () => createDefaultChain(),
});

// Mock Supabase client - mockFrom controls actual behavior
const mockFrom = jest.fn((_table: string) => createDefaultTableMock());

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: (table: string) => mockFrom(table),
    })
  ),
}));

describe('getStudentDashboardData', () => {
  const studentId = '123e4567-e89b-12d3-a456-426614174000';
  const _now = new Date().toISOString();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return dashboard data for authenticated student', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: studentId, email: 'student@example.com' },
      isStudent: true,
      isTeacher: false,
      isAdmin: false,
      isDevelopment: false,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { full_name: 'John Doe' },
              }),
            }),
          }),
        };
      }

      if (table === 'lessons') {
        return {
          select: (_fields: string) => ({
            eq: () => ({
              gte: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: () => Promise.resolve({
                      data: {
                        id: 'next-lesson-id',
                        title: 'Guitar Basics',
                        scheduled_at: '2026-02-10T10:00:00Z',
                      },
                    }),
                  }),
                }),
              }),
              lt: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: () => Promise.resolve({
                      data: {
                        id: 'last-lesson-id',
                        title: 'Scales Practice',
                        scheduled_at: '2026-01-25T10:00:00Z',
                        notes: 'Great progress!',
                      },
                    }),
                  }),
                }),
              }),
            }),
          }),
        };
      }

      if (table === 'assignments') {
        return {
          select: () => ({
            eq: (field: string, _value: string) => {
              if (field === 'student_id') {
                return {
                  eq: () => ({
                    order: () => ({
                      limit: () => Promise.resolve({
                        data: [
                          {
                            id: 'assignment-1',
                            title: 'Practice C Major Scale',
                            due_date: '2026-02-05',
                            status: 'pending',
                            description: 'Practice for 15 minutes daily',
                          },
                        ],
                      }),
                    }),
                  }),
                };
              }
              return { data: [] };
            },
          }),
        };
      }

      if (table === 'lesson_songs') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => Promise.resolve({
                  data: [
                    {
                      updated_at: '2026-01-30T10:00:00Z',
                      songs: {
                        id: 'song-1',
                        title: 'Wonderwall',
                        author: 'Oasis',
                        created_at: '2026-01-01',
                      },
                    },
                  ],
                }),
              }),
            }),
          }),
        };
      }

      if (table === 'songs') {
        return {
          select: (fields: string, options?: any) => {
            if (options?.count === 'exact') {
              return {
                eq: () => Promise.resolve({ count: 5 }),
              };
            }
            return {
              eq: () => Promise.resolve({
                data: [
                  { id: 'song-1', title: 'Wonderwall', author: 'Oasis' },
                  { id: 'song-2', title: 'Blackbird', author: 'The Beatles' },
                ],
              }),
            };
          },
        };
      }

      return {
        select: () => ({
          eq: () => Promise.resolve({ data: null }),
        }),
      };
    });

    const result = await getStudentDashboardData();

    expect(result.studentName).toBe('John Doe');
    expect(result.nextLesson).toEqual({
      id: 'next-lesson-id',
      title: 'Guitar Basics',
      scheduled_at: '2026-02-10T10:00:00Z',
    });
    expect(result.lastLesson).toEqual({
      id: 'last-lesson-id',
      title: 'Scales Practice',
      scheduled_at: '2026-01-25T10:00:00Z',
      notes: 'Great progress!',
    });
    expect(result.assignments).toHaveLength(1);
    expect(result.recentSongs).toHaveLength(1);
    expect(result.allSongs).toHaveLength(2);
    expect(result.stats).toEqual({
      totalSongs: 5,
      completedLessons: expect.any(Number),
      activeAssignments: 1,
      practiceHours: 12,
    });
  });

  it('should reject unauthenticated user', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: null,
      isStudent: false,
      isTeacher: false,
      isAdmin: false,
      isDevelopment: false,
    });

    await expect(getStudentDashboardData()).rejects.toThrow('User not authenticated');

    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('should handle student with no profile name', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: studentId },
      isStudent: true,
      isTeacher: false,
      isAdmin: false,
      isDevelopment: false,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { full_name: null },
              }),
            }),
          }),
        };
      }
      // Use default for all other tables
      return createDefaultTableMock();
    });

    const result = await getStudentDashboardData();

    expect(result.studentName).toBeNull();
  });

  it('should handle student with no lessons', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: studentId },
      isStudent: true,
      isTeacher: false,
      isAdmin: false,
      isDevelopment: false,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { full_name: 'New Student' },
              }),
            }),
          }),
        };
      }

      if (table === 'lessons') {
        return {
          select: (fields: string, options?: any) => {
            if (options?.count === 'exact') {
              return {
                eq: () => ({
                  lt: () => Promise.resolve({ count: 0 }),
                }),
              };
            }
            return {
              eq: () => ({
                gte: () => ({
                  order: () => ({
                    limit: () => ({
                      maybeSingle: () => Promise.resolve({ data: null }),
                    }),
                  }),
                }),
                lt: () => ({
                  order: () => ({
                    limit: () => ({
                      maybeSingle: () => Promise.resolve({ data: null }),
                    }),
                  }),
                }),
              }),
            };
          },
        };
      }

      return createDefaultTableMock();
    });

    const result = await getStudentDashboardData();

    expect(result.nextLesson).toBeNull();
    expect(result.lastLesson).toBeNull();
    expect(result.stats.completedLessons).toBe(0);
  });

  it('should handle student with no assignments', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: studentId },
      isStudent: true,
      isTeacher: false,
      isAdmin: false,
      isDevelopment: false,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'assignments') {
        const chain = createDefaultChain();
        // Override to return empty array for assignments
        return {
          select: () => ({
            ...chain,
            eq: () => ({
              ...chain,
              eq: () => ({
                ...chain,
                order: () => ({
                  ...chain,
                  limit: () => Promise.resolve({ data: [] }),
                }),
              }),
            }),
          }),
        };
      }
      return createDefaultTableMock();
    });

    const result = await getStudentDashboardData();

    expect(result.assignments).toEqual([]);
    expect(result.stats.activeAssignments).toBe(0);
  });

  it('should handle student with no songs', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: studentId },
      isStudent: true,
      isTeacher: false,
      isAdmin: false,
      isDevelopment: false,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { full_name: 'Student' },
              }),
            }),
          }),
        };
      }

      if (table === 'lesson_songs') {
        const chain = createDefaultChain();
        return {
          select: () => ({
            ...chain,
            eq: () => ({
              ...chain,
              order: () => ({
                ...chain,
                limit: () => Promise.resolve({ data: [] }),
              }),
            }),
          }),
        };
      }

      if (table === 'songs') {
        const chain = createDefaultChain();
        return {
          select: (fields?: string, options?: any) => {
            if (options?.count === 'exact') {
              return {
                ...chain,
                eq: () => Promise.resolve({ count: 0 }),
              };
            }
            return {
              ...chain,
              eq: () => Promise.resolve({ data: [] }),
            };
          },
        };
      }

      return createDefaultTableMock();
    });

    const result = await getStudentDashboardData();

    expect(result.recentSongs).toEqual([]);
    expect(result.allSongs).toEqual([]);
    expect(result.stats.totalSongs).toBe(0);
  });

  it('should filter out null songs from recent songs', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: studentId },
      isStudent: true,
      isTeacher: false,
      isAdmin: false,
      isDevelopment: false,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { full_name: 'Student' },
              }),
            }),
          }),
        };
      }

      if (table === 'lesson_songs') {
        const chain = createDefaultChain();
        return {
          select: () => ({
            ...chain,
            eq: () => ({
              ...chain,
              order: () => ({
                ...chain,
                limit: () => Promise.resolve({
                  data: [
                    {
                      updated_at: '2026-01-30',
                      songs: {
                        id: 'song-1',
                        title: 'Song Title',
                        author: 'Artist',
                      },
                    },
                    {
                      updated_at: '2026-01-29',
                      songs: null, // Null song should be filtered out
                    },
                  ],
                }),
              }),
            }),
          }),
        };
      }

      return createDefaultTableMock();
    });

    const result = await getStudentDashboardData();

    expect(result.recentSongs).toHaveLength(1);
    expect(result.recentSongs[0].id).toBe('song-1');
  });

  it('should handle songs without author', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: studentId },
      isStudent: true,
      isTeacher: false,
      isAdmin: false,
      isDevelopment: false,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { full_name: 'Student' },
              }),
            }),
          }),
        };
      }

      if (table === 'songs') {
        const chain = createDefaultChain();
        return {
          select: (fields?: string, options?: any) => {
            if (options?.count === 'exact') {
              return {
                ...chain,
                eq: () => Promise.resolve({ count: 1 }),
              };
            }
            return {
              ...chain,
              eq: () => Promise.resolve({
                data: [
                  { id: 'song-1', title: 'Mystery Song', author: null },
                ],
              }),
            };
          },
        };
      }

      return createDefaultTableMock();
    });

    const result = await getStudentDashboardData();

    expect(result.allSongs[0].artist).toBe('Unknown Artist');
  });
});
