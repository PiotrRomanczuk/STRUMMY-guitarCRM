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
  not: () => createDefaultChain(),
  is: () => createDefaultChain(),
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
              single: () =>
                Promise.resolve({
                  data: { full_name: 'John Doe' },
                }),
            }),
          }),
        };
      }

      if (table === 'lessons') {
        // Build a chain that returns rich data for the next/last lesson queries
        // (which terminate in .maybeSingle()) and falls through to the default
        // empty-data chain for everything else (count queries, week-range,
        // batched student queries, etc.).
        return {
          select: (_fields: string) => {
            const fallback = createDefaultChain();
            return {
              ...fallback,
              eq: () => ({
                ...fallback,
                gte: () => ({
                  ...fallback,
                  // For week-range chart queries, .gte().lt() returns rows.
                  lt: () => createDefaultChain(),
                  order: () => ({
                    ...fallback,
                    limit: () => ({
                      ...fallback,
                      maybeSingle: () =>
                        Promise.resolve({
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
                  ...fallback,
                  order: () => ({
                    ...fallback,
                    limit: () => ({
                      ...fallback,
                      maybeSingle: () =>
                        Promise.resolve({
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
            };
          },
        };
      }

      if (table === 'assignments') {
        return {
          select: () => ({
            eq: (field: string, _value: string) => {
              if (field === 'student_id') {
                return {
                  in: () => ({
                    order: () => ({
                      limit: () =>
                        Promise.resolve({
                          data: [
                            {
                              id: 'assignment-1',
                              title: 'Practice C Major Scale',
                              due_date: '2026-02-05',
                              status: 'not_started',
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
                limit: () =>
                  Promise.resolve({
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
              eq: () =>
                Promise.resolve({
                  data: [
                    { id: 'song-1', title: 'Wonderwall', author: 'Oasis' },
                    { id: 'song-2', title: 'Blackbird', author: 'The Beatles' },
                  ],
                }),
            };
          },
        };
      }

      // Default: full chain for any unspecified table (student_repertoire, practice_sessions, etc.)
      return createDefaultTableMock();
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
      // totalSongs now comes from student_repertoire count via
      // fetchRepertoireForDashboard (default mock returns count: 0).
      totalSongs: 0,
      completedLessons: expect.any(Number),
      activeAssignments: 1,
      practiceHours: 0,
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
              single: () =>
                Promise.resolve({
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
              single: () =>
                Promise.resolve({
                  data: { full_name: 'New Student' },
                }),
            }),
          }),
        };
      }

      // lessons: return null data for all queries → nextLesson/lastLesson/count all zero/null
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
              in: () => ({
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
              single: () =>
                Promise.resolve({
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
              single: () =>
                Promise.resolve({
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
                limit: () =>
                  Promise.resolve({
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
              single: () =>
                Promise.resolve({
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
              eq: () =>
                Promise.resolve({
                  data: [{ id: 'song-1', title: 'Mystery Song', author: null }],
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

// ============================================================================
// Week chart aggregation
//
// The per-day lesson and practice-minute buckets were never exercised: no
// fixture returned rows for the current week, so both loop bodies stayed dead.
// Clock frozen at Wednesday 2026-07-22 so the Mon..Sun window is 07-20..07-26.
// ============================================================================

describe('getStudentDashboardData — week chart', () => {
  const studentId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ doNotFake: ['nextTick'] });
    jest.setSystemTime(new Date('2026-07-22T12:00:00.000Z'));

    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: studentId, email: 'student@example.com' },
      isStudent: true,
      isTeacher: false,
      isAdmin: false,
      isDevelopment: false,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /** Resolve `lessons` / `practice_sessions` week queries with fixed rows. */
  const armWeek = (lessons: unknown[], practice: unknown[]) => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'lessons') {
        return {
          select: () => ({
            ...createDefaultChain(),
            eq: () => ({
              ...createDefaultChain(),
              gte: () => ({
                ...createDefaultChain(),
                lt: () => Promise.resolve({ data: lessons }),
              }),
            }),
          }),
        } as any;
      }
      if (table === 'practice_sessions') {
        return {
          select: () => ({
            ...createDefaultChain(),
            eq: () => ({
              ...createDefaultChain(),
              gte: () => ({
                ...createDefaultChain(),
                lt: () => Promise.resolve({ data: practice }),
              }),
            }),
          }),
        } as any;
      }
      return createDefaultTableMock();
    });
  };

  it('buckets lessons and practice minutes into the right weekday', async () => {
    armWeek(
      [
        { scheduled_at: '2026-07-20T10:00:00.000Z' },
        // Second lesson the same day must increment, not overwrite.
        { scheduled_at: '2026-07-20T15:00:00.000Z' },
        { scheduled_at: '2026-07-23T09:00:00.000Z' },
      ],
      [
        { created_at: '2026-07-20T18:00:00.000Z', duration_minutes: 30 },
        // Second session the same day must accumulate.
        { created_at: '2026-07-20T20:00:00.000Z', duration_minutes: 15 },
        { created_at: '2026-07-26T11:00:00.000Z', duration_minutes: 40 },
      ]
    );

    const { realChartData: chartData } = await getStudentDashboardData();

    expect(chartData).toHaveLength(7);
    expect(chartData[0]).toMatchObject({ lessons: 2, practiceMinutes: 45 }); // Mon
    expect(chartData[1]).toMatchObject({ lessons: 0, practiceMinutes: 0 }); // Tue
    expect(chartData[3]).toMatchObject({ lessons: 1, practiceMinutes: 0 }); // Thu
    expect(chartData[6]).toMatchObject({ lessons: 0, practiceMinutes: 40 }); // Sun
  });

  it('returns a zeroed week when both queries come back null', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'lessons' || table === 'practice_sessions') {
        return {
          select: () => ({
            ...createDefaultChain(),
            eq: () => ({
              ...createDefaultChain(),
              gte: () => ({
                ...createDefaultChain(),
                lt: () => Promise.resolve({ data: null }),
              }),
            }),
          }),
        } as any;
      }
      return createDefaultTableMock();
    });

    const { realChartData: chartData } = await getStudentDashboardData();

    expect(chartData).toHaveLength(7);
    expect(chartData.every((d) => d.lessons === 0 && d.practiceMinutes === 0)).toBe(true);
  });
});

// ============================================================================
// Null-coalescing and join-shape fallbacks in the response mapping.
// ============================================================================

describe('getStudentDashboardData — response fallbacks', () => {
  const studentId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: studentId, email: 'student@example.com' },
      isStudent: true,
      isTeacher: false,
      isAdmin: false,
      isDevelopment: false,
    });
  });

  /** Like createDefaultChain, but every terminal resolves null instead of []. */
  const createNullChain = (): any => ({
    eq: () => createNullChain(),
    gte: () => createNullChain(),
    gt: () => createNullChain(),
    lt: () => createNullChain(),
    lte: () => createNullChain(),
    in: () => createNullChain(),
    not: () => createNullChain(),
    is: () => createNullChain(),
    order: () => createNullChain(),
    limit: () => createNullChain(),
    single: () => Promise.resolve({ data: null }),
    maybeSingle: () => Promise.resolve({ data: null }),
    then: (resolve: any) => resolve({ data: null, count: null }),
  });

  it('coalesces null collections to empty arrays', async () => {
    // Every query resolves `data: null` — exercises the `|| []` right-arms on
    // assignments, recentSongs, allSongs and the practice-streak rows.
    mockFrom.mockImplementation(() => ({ select: () => createNullChain() }) as any);

    const result = await getStudentDashboardData();

    expect(result.assignments).toEqual([]);
    expect(result.recentSongs).toEqual([]);
    expect(result.allSongs).toEqual([]);
    expect(result.practiceStreakDays).toBe(0);
  });

  it('unwraps an array-shaped song join and drops rows with no song id', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'lesson_songs') {
        return {
          select: () => ({
            ...createDefaultChain(),
            eq: () => ({
              ...createDefaultChain(),
              order: () => ({
                ...createDefaultChain(),
                limit: () =>
                  Promise.resolve({
                    data: [
                      // Array-shaped join.
                      {
                        updated_at: '2026-07-19T10:00:00.000Z',
                        songs: [{ id: 'song-1', title: 'Creep', author: 'Radiohead' }],
                      },
                      // Object-shaped join with every field missing.
                      { updated_at: '2026-07-18T10:00:00.000Z', songs: {} },
                      // Filtered out before mapping.
                      { updated_at: '2026-07-17T10:00:00.000Z', songs: null },
                    ],
                  }),
              }),
            }),
          }),
        } as any;
      }
      return createDefaultTableMock();
    });

    const { recentSongs } = await getStudentDashboardData();

    // The empty-object row maps to id '' and is dropped by the trailing filter.
    expect(recentSongs).toEqual([
      {
        id: 'song-1',
        title: 'Creep',
        artist: 'Radiohead',
        last_played: '2026-07-19T10:00:00.000Z',
      },
    ]);
  });
});
