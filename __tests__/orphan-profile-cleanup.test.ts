import { createShadowUser } from '@/app/dashboard/actions';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}));

describe('createShadowUser Orphan Profile Cleanup', () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
    // createShadowUser authorizes the caller (must be admin/teacher) via a
    // `.from('profiles')` lookup on this cookie-bound client, before ever
    // touching the admin client the rest of this test exercises.
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { is_admin: false, is_teacher: true },
            error: null,
          }),
        }),
      }),
    }),
  };

  const mockAdminSupabase = {
    from: jest.fn(),
    auth: {
      admin: {
        listUsers: jest.fn(),
        generateLink: jest.fn(),
        updateUserById: jest.fn(),
        createUser: jest.fn(),
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    (createAdminClient as jest.Mock).mockReturnValue(mockAdminSupabase);
  });

  it('should handle duplicate email error by migrating orphan profile', async () => {
    const studentEmail = 'orphan@example.com';
    const newUserId = 'new-user-id';
    const orphanProfileId = 'orphan-profile-id';

    // 1. Mock Auth User (Teacher calling the action)
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'teacher-id' } },
    });

    // 2. Mock createShadowUser finding the new user ID (via generateLink)
    mockAdminSupabase.auth.admin.listUsers.mockResolvedValue({ data: { users: [] }, error: null });
    mockAdminSupabase.auth.admin.generateLink.mockResolvedValue({
      data: { user: { id: newUserId, email: studentEmail } },
      error: null,
    });
    mockAdminSupabase.auth.admin.updateUserById.mockResolvedValue({ data: {}, error: null });

    // 3. Mock DB interactions
    const mockUpsert = jest.fn();
    const mockSelect = jest.fn();
    const mockUpdate = jest.fn();
    const mockDelete = jest.fn();

    // Setup mock behavior
    let upsertCallCount = 0;
    mockUpsert.mockImplementation(async () => {
      upsertCallCount++;
      if (upsertCallCount === 1) {
        return {
          error: {
            code: '23505',
            message: 'duplicate key value violates unique constraint "profiles_email_key"',
          },
        };
      }
      return { error: null };
    });

    // Select finds orphan profile
    mockSelect.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: { id: orphanProfileId }, error: null }),
      }),
    });

    // Update succeeds
    mockUpdate.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    // Delete succeeds
    mockDelete.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    mockAdminSupabase.from.mockImplementation((table) => {
      if (table === 'profiles') {
        return {
          upsert: mockUpsert,
          select: mockSelect,
          update: mockUpdate,
          delete: mockDelete,
        };
      }
      // For other tables (lessons, assignments, user_roles)
      return {
        update: mockUpdate,
        delete: mockDelete,
        select: mockSelect,
      };
    });

    // Act
    const result = await createShadowUser(studentEmail);

    // Assert
    expect(result.success).toBe(true);
    expect(result.userId).toBe(newUserId);

    // Verify cleanup steps
    // 1. Upsert called twice (fail then success)
    expect(mockUpsert).toHaveBeenCalledTimes(2);

    // 2. Select orphan profile called
    expect(mockSelect).toHaveBeenCalled();

    // 3. Rename orphan profile (update called with temp email)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ email: expect.stringContaining(studentEmail + '_migrated_') })
    );

    // 4. Migrate data (lessons, assignments — migrateOrphanData in
    // app/dashboard/actions.ts does not touch user_roles).
    // We expect update calls for these tables.
    // Since we mock 'from' to return the same mockUpdate for all tables, we can check calls to mockUpdate.
    // But we can't easily distinguish which table it was called on with this simple mock setup unless we inspect the 'from' calls.

    // Verify 'from' was called for all migrated tables
    expect(mockAdminSupabase.from).toHaveBeenCalledWith('lessons');
    expect(mockAdminSupabase.from).toHaveBeenCalledWith('assignments');

    // 5. Delete orphan profile
    expect(mockDelete).toHaveBeenCalled();
  });
});
