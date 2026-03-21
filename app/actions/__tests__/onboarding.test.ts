/**
 * Onboarding Server Actions Tests
 *
 * Tests the onboarding completion flow:
 * - completeOnboarding - Student onboarding process
 *
 * @see app/actions/onboarding.ts
 */

import { completeOnboarding } from '../onboarding';
import type { OnboardingData } from '@/types/onboarding';

// Mock getUserWithRolesSSR
jest.mock('@/lib/getUserWithRolesSSR', () => ({
  getUserWithRolesSSR: jest.fn(() => Promise.resolve({ isDevelopment: false })),
}));

// Mock Supabase client
const mockGetUser = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        getUser: () => mockGetUser(),
      },
    })
  ),
}));

// Mock Admin client
const mockAdminUpdate = jest.fn();
const mockAdminInsert = jest.fn();
const mockAdminUpsert = jest.fn();
const mockAdminEq = jest.fn();
const mockAdminFrom = jest.fn((_table: string) => {
  // Default behavior
  return {
    update: (data: unknown) => {
      mockAdminUpdate(data);
      return {
        eq: (field: string, value: string) => {
          mockAdminEq(field, value);
          return Promise.resolve({ error: null });
        },
      };
    },
    insert: (data: unknown) => {
      mockAdminInsert(data);
      return Promise.resolve({ error: null });
    },
    upsert: (data: unknown, _options?: unknown) => {
      mockAdminUpsert(data);
      return Promise.resolve({ error: null });
    },
  };
});

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({
    from: (table: string) => mockAdminFrom(table),
  })),
}));

// Mock Next.js functions
const mockRevalidatePath = jest.fn();
const mockRedirect = jest.fn(() => {
  throw new Error('NEXT_REDIRECT'); // redirect throws to stop execution
});

jest.mock('next/cache', () => ({
  revalidatePath: (path: string) => mockRevalidatePath(path),
}));

jest.mock('next/navigation', () => ({
  redirect: (path: string) => mockRedirect(path),
}));

describe('completeOnboarding', () => {
  const validOnboardingData: OnboardingData = {
    goals: ['Learn chords', 'Play songs'],
    skillLevel: 'beginner',
    learningStyle: ['visual', 'hands-on'],
    instrumentPreference: ['acoustic-guitar'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should complete onboarding for authenticated user', async () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: userId,
          email: 'student@example.com',
          user_metadata: {
            first_name: 'John',
            last_name: 'Doe',
            full_name: 'John Doe',
          },
        },
      },
      error: null,
    });

    // Expect redirect to throw
    await expect(completeOnboarding(validOnboardingData)).rejects.toThrow('NEXT_REDIRECT');

    // Verify profile was updated with first_name/last_name (trigger syncs full_name)
    expect(mockAdminUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: 'John',
        last_name: 'Doe',
        is_student: true,
        onboarding_completed: true,
      })
    );

    // Verify preferences were persisted
    expect(mockAdminFrom).toHaveBeenCalledWith('user_preferences');
    expect(mockAdminUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: userId,
        goals: validOnboardingData.goals,
        skill_level: validOnboardingData.skillLevel,
        learning_style: validOnboardingData.learningStyle,
        instrument_preference: validOnboardingData.instrumentPreference,
      })
    );

    // Verify path was revalidated
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard');

    // Verify redirect was called
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
  });

  it('should handle user with partial metadata', async () => {
    const userId = '223e4567-e89b-12d3-a456-426614174001';
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: userId,
          email: 'student@example.com',
          user_metadata: {
            first_name: 'Jane',
            // No last_name or full_name
          },
        },
      },
      error: null,
    });

    await expect(completeOnboarding(validOnboardingData)).rejects.toThrow('NEXT_REDIRECT');

    expect(mockAdminUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: 'Jane',
        last_name: '',
        is_student: true,
      })
    );
  });

  it('should handle user with no metadata', async () => {
    const userId = '323e4567-e89b-12d3-a456-426614174002';
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: userId,
          email: 'student@example.com',
          user_metadata: {},
        },
      },
      error: null,
    });

    await expect(completeOnboarding(validOnboardingData)).rejects.toThrow('NEXT_REDIRECT');

    expect(mockAdminUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: '',
        last_name: '',
        is_student: true,
      })
    );
  });

  it('should reject unauthenticated user', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await completeOnboarding(validOnboardingData);

    expect(result).toEqual({ error: 'Unauthorized' });
    expect(mockAdminUpdate).not.toHaveBeenCalled();
    expect(mockAdminUpsert).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('should handle auth error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    });

    const result = await completeOnboarding(validOnboardingData);

    expect(result).toEqual({ error: 'Unauthorized' });
    expect(mockAdminUpdate).not.toHaveBeenCalled();
  });

  it('should handle profile update error', async () => {
    const userId = '423e4567-e89b-12d3-a456-426614174003';
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: userId,
          email: 'student@example.com',
          user_metadata: { full_name: 'Test User' },
        },
      },
      error: null,
    });

    // Mock profile update to return error - use mockImplementationOnce for this test only
    mockAdminFrom.mockImplementationOnce((table: string) => {
      if (table === 'profiles') {
        return {
          update: (_data: unknown) => ({
            eq: (_field: string, _value: string) =>
              Promise.resolve({ error: { message: 'Database error' } }),
          }),
        };
      }
      return {
        insert: (_data: unknown) => Promise.resolve({ error: null }),
        upsert: (_data: unknown) => Promise.resolve({ error: null }),
      };
    });

    const result = await completeOnboarding(validOnboardingData);

    expect(result).toEqual({ error: 'Failed to update profile' });
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('should handle duplicate role assignment gracefully', async () => {
    const userId = '523e4567-e89b-12d3-a456-426614174004';
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: userId,
          email: 'student@example.com',
          user_metadata: { full_name: 'Test User' },
        },
      },
      error: null,
    });

    // Mock duplicate key error (role already exists) - this should be ignored
    let callCount = 0;
    mockAdminFrom.mockImplementation((table: string) => {
      callCount++;
      if (table === 'profiles' && callCount === 1) {
        return {
          update: (_data: unknown) => ({
            eq: (_field: string, _value: string) => Promise.resolve({ error: null }),
          }),
        };
      }
      if (table === 'user_roles' && callCount === 2) {
        return {
          insert: (_data: unknown) =>
            Promise.resolve({ error: { code: '23505', message: 'Duplicate key' } }),
        };
      }
      // Fallback (includes user_preferences)
      return {
        insert: (_data: unknown) => Promise.resolve({ error: null }),
        upsert: (_data: unknown) => Promise.resolve({ error: null }),
        update: (_data: unknown) => ({
          eq: (_field: string, _value: string) => Promise.resolve({ error: null }),
        }),
      };
    });

    // Should succeed despite duplicate role error
    await expect(completeOnboarding(validOnboardingData)).rejects.toThrow('NEXT_REDIRECT');

    expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
  });

  it('should succeed when profile update works (no separate role assignment)', async () => {
    const userId = '623e4567-e89b-12d3-a456-426614174005';
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: userId,
          email: 'student@example.com',
          user_metadata: { full_name: 'Test User' },
        },
      },
      error: null,
    });

    // Reset mockAdminFrom to default behavior (may have been overridden by previous test)
    mockAdminFrom.mockImplementation((_table: string) => {
      return {
        update: (data: unknown) => {
          mockAdminUpdate(data);
          return {
            eq: (field: string, value: string) => {
              mockAdminEq(field, value);
              return Promise.resolve({ error: null });
            },
          };
        },
        insert: (data: unknown) => {
          mockAdminInsert(data);
          return Promise.resolve({ error: null });
        },
        upsert: (data: unknown, _options?: unknown) => {
          mockAdminUpsert(data);
          return Promise.resolve({ error: null });
        },
      };
    });

    // Profile update succeeds - role is set via boolean flag, no separate insert
    await expect(completeOnboarding(validOnboardingData)).rejects.toThrow('NEXT_REDIRECT');

    expect(mockAdminUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        is_student: true,
        onboarding_completed: true,
      })
    );
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
  });

  it('should handle unexpected errors', async () => {
    const userId = '723e4567-e89b-12d3-a456-426614174006';
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: userId,
          email: 'student@example.com',
          user_metadata: { full_name: 'Test User' },
        },
      },
      error: null,
    });

    // Make adminFrom throw an unexpected error
    mockAdminFrom.mockImplementationOnce(() => {
      throw new Error('Unexpected database error');
    });

    const result = await completeOnboarding(validOnboardingData);

    expect(result).toEqual({ error: 'An unexpected error occurred' });
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('should store correct onboarding preferences', async () => {
    const userId = '823e4567-e89b-12d3-a456-426614174007';

    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: userId,
          email: 'student@example.com',
          user_metadata: { full_name: 'Test User' },
        },
      },
      error: null,
    });

    const customOnboardingData: OnboardingData = {
      goals: ['Master fingerpicking', 'Write songs'],
      skillLevel: 'intermediate',
      learningStyle: ['audio', 'practice'],
      instrumentPreference: ['electric-guitar', 'bass'],
    };

    await expect(completeOnboarding(customOnboardingData)).rejects.toThrow('NEXT_REDIRECT');

    // Verify preferences were persisted with correct data
    expect(mockAdminFrom).toHaveBeenCalledWith('user_preferences');
    expect(mockAdminUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: userId,
        goals: ['Master fingerpicking', 'Write songs'],
        skill_level: 'intermediate',
        learning_style: ['audio', 'practice'],
        instrument_preference: ['electric-guitar', 'bass'],
      })
    );
  });

  it('should save all onboarding steps to user_preferences table', async () => {
    const userId = '923e4567-e89b-12d3-a456-426614174008';
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: userId,
          email: 'student@example.com',
          user_metadata: { first_name: 'Alice', last_name: 'Smith' },
        },
      },
      error: null,
    });

    // Reset mockAdminFrom to default behavior with tracking
    mockAdminFrom.mockImplementation((_table: string) => ({
      update: (data: unknown) => {
        mockAdminUpdate(data);
        return {
          eq: (field: string, value: string) => {
            mockAdminEq(field, value);
            return Promise.resolve({ error: null });
          },
        };
      },
      upsert: (data: unknown, _options?: unknown) => {
        mockAdminUpsert(data);
        return Promise.resolve({ error: null });
      },
    }));

    const fullOnboardingData: OnboardingData = {
      role: 'student',
      goals: ['Learn chords', 'Play songs', 'Perform live'],
      skillLevel: 'beginner',
      learningStyle: ['visual', 'hands-on'],
      instrumentPreference: ['acoustic-guitar'],
    };

    await expect(completeOnboarding(fullOnboardingData)).rejects.toThrow(
      'NEXT_REDIRECT'
    );

    // Step 1: Profile was updated with role
    expect(mockAdminFrom).toHaveBeenCalledWith('profiles');
    expect(mockAdminUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: 'Alice',
        last_name: 'Smith',
        is_student: true,
        is_teacher: false,
        onboarding_completed: true,
      })
    );

    // Step 2: Preferences were persisted to user_preferences table
    expect(mockAdminFrom).toHaveBeenCalledWith('user_preferences');
    expect(mockAdminUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: userId,
        goals: ['Learn chords', 'Play songs', 'Perform live'],
        skill_level: 'beginner',
        learning_style: ['visual', 'hands-on'],
        instrument_preference: ['acoustic-guitar'],
      })
    );

    // Step 3: Redirect to dashboard
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard');
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
  });

  it('should upsert preferences on re-onboarding (not duplicate)', async () => {
    const userId = 'a23e4567-e89b-12d3-a456-426614174009';
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: userId,
          email: 'student@example.com',
          user_metadata: { first_name: 'Bob', last_name: 'Jones' },
        },
      },
      error: null,
    });

    // Track all upsert calls with their options
    const upsertCalls: { data: unknown; options: unknown }[] = [];
    mockAdminFrom.mockImplementation((_table: string) => ({
      update: (data: unknown) => {
        mockAdminUpdate(data);
        return {
          eq: (field: string, value: string) => {
            mockAdminEq(field, value);
            return Promise.resolve({ error: null });
          },
        };
      },
      upsert: (data: unknown, options?: unknown) => {
        upsertCalls.push({ data, options });
        mockAdminUpsert(data);
        return Promise.resolve({ error: null });
      },
    }));

    // First onboarding
    const firstData: OnboardingData = {
      goals: ['Learn chords'],
      skillLevel: 'beginner',
      learningStyle: ['visual'],
      instrumentPreference: ['acoustic-guitar'],
    };

    await expect(completeOnboarding(firstData)).rejects.toThrow(
      'NEXT_REDIRECT'
    );

    // Second onboarding (re-onboarding with updated preferences)
    const secondData: OnboardingData = {
      goals: ['Master fingerpicking', 'Write songs'],
      skillLevel: 'intermediate',
      learningStyle: ['audio', 'practice'],
      instrumentPreference: ['electric-guitar', 'bass'],
    };

    await expect(completeOnboarding(secondData)).rejects.toThrow(
      'NEXT_REDIRECT'
    );

    // Both calls used upsert (not insert) with onConflict: 'user_id'
    expect(upsertCalls).toHaveLength(2);
    expect(upsertCalls[0].options).toEqual({ onConflict: 'user_id' });
    expect(upsertCalls[1].options).toEqual({ onConflict: 'user_id' });

    // Second call has updated data — it replaces, not duplicates
    expect(upsertCalls[1].data).toEqual(
      expect.objectContaining({
        user_id: userId,
        goals: ['Master fingerpicking', 'Write songs'],
        skill_level: 'intermediate',
        learning_style: ['audio', 'practice'],
        instrument_preference: ['electric-guitar', 'bass'],
      })
    );

    // insert was never called for user_preferences — only upsert
    const insertCallsForPrefs = mockAdminInsert.mock.calls;
    const prefsInserts = insertCallsForPrefs.filter(
      (call: unknown[]) =>
        call[0] &&
        typeof call[0] === 'object' &&
        'goals' in (call[0] as Record<string, unknown>)
    );
    expect(prefsInserts).toHaveLength(0);
  });
});
