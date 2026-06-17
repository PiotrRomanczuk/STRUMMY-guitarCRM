import {
  getSongsHandler,
  createSongHandler,
  updateSongHandler,
  deleteSongHandler,
  validateMutationPermission,
} from '@/app/api/song/handlers';

describe('Song API Handlers', () => {
  const mockSupabase = {
    from: jest.fn(),
    rpc: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  };

  const mockUser = { id: 'user-123' };
  const mockAdminProfile = { isAdmin: true, isTeacher: false };
  const mockTeacherProfile = { isAdmin: false, isTeacher: true };
  const mockStudentProfile = { isAdmin: false, isTeacher: false };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateMutationPermission', () => {
    it('should allow admins', () => {
      expect(validateMutationPermission(mockAdminProfile)).toBe(true);
    });

    it('should allow teachers', () => {
      expect(validateMutationPermission(mockTeacherProfile)).toBe(true);
    });

    it('should deny students', () => {
      expect(validateMutationPermission(mockStudentProfile)).toBe(false);
    });

    it('should deny null profile', () => {
      expect(validateMutationPermission(null)).toBe(false);
    });

    it('should allow both admin and teacher together', () => {
      const dualRole = { isAdmin: true, isTeacher: true };
      expect(validateMutationPermission(dualRole)).toBe(true);
    });
  });

  describe('getSongsHandler', () => {
    it('should return 401 if no user', async () => {
      const result = await getSongsHandler(mockSupabase, null, mockAdminProfile, {});
      expect(result).toEqual({ error: 'Unauthorized', status: 401 });
    });

    it('should fetch songs successfully', async () => {
      const mockSongs = [
        { id: '1', title: 'Song 1', level: 'beginner' },
        { id: '2', title: 'Song 2', level: 'intermediate' },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockSongs,
          error: null,
          count: 2,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await getSongsHandler(mockSupabase, mockUser, mockAdminProfile, {
        page: 1,
        limit: 10,
      });

      expect(result).toEqual({
        songs: mockSongs,
        count: 2,
        status: 200,
      });
    });

    it('should apply filters correctly', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await getSongsHandler(mockSupabase, mockUser, mockAdminProfile, {
        level: 'beginner',
        key: 'C',
        search: 'test',
        page: 1,
        limit: 10,
      });

      // Verify filters were applied
      expect(mockQuery.eq).toHaveBeenCalledWith('level', 'beginner');
      expect(mockQuery.eq).toHaveBeenCalledWith('key', 'C');
      expect(mockQuery.ilike).toHaveBeenCalledWith('title', '%test%');
    });

    it('should handle database errors', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await getSongsHandler(mockSupabase, mockUser, mockAdminProfile, {});

      expect(result).toEqual({
        error: 'Database error',
        status: 500,
      });
    });
  });

  describe('createSongHandler', () => {
    const validSongData = {
      title: 'New Song',
      author: 'Artist',
      level: 'intermediate',
      key: 'C',
      ultimate_guitar_link: 'https://ultimate-guitar.com/tabs/123',
    };

    it('should return 401 if no user', async () => {
      const result = await createSongHandler(mockSupabase, null, mockAdminProfile, validSongData);
      expect(result).toEqual({ error: 'Unauthorized', status: 401 });
    });

    it('should return 403 if user is student', async () => {
      const result = await createSongHandler(
        mockSupabase,
        mockUser,
        mockStudentProfile,
        validSongData
      );
      expect(result).toEqual({
        error: 'Forbidden: Only teachers and admins can create songs',
        status: 403,
      });
    });

    it('should allow teachers to create songs', async () => {
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: validSongData,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await createSongHandler(
        mockSupabase,
        mockUser,
        mockTeacherProfile,
        validSongData
      );

      expect(result.status).toBe(201);
      expect(result.song).toEqual(validSongData);
    });

    it('should allow admins to create songs', async () => {
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: validSongData,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await createSongHandler(
        mockSupabase,
        mockUser,
        mockAdminProfile,
        validSongData
      );

      expect(result.status).toBe(201);
      expect(result.song).toEqual(validSongData);
    });

    it('should validate input with Zod schema', async () => {
      const invalidData = { title: '' }; // Missing required fields

      const result = await createSongHandler(
        mockSupabase,
        mockUser,
        mockTeacherProfile,
        invalidData
      );

      expect(result.status).toBe(422);
      expect(result.error).toContain('Validation failed');
    });
  });

  describe('updateSongHandler', () => {
    // is_draft: true uses SongDraftSchema which doesn't require level/key
    const updateData = {
      title: 'Updated Title',
      author: 'Updated Artist',
      is_draft: true,
    };

    it('should return 401 if no user', async () => {
      const result = await updateSongHandler(
        mockSupabase,
        null,
        mockAdminProfile,
        'song-id',
        updateData
      );
      expect(result).toEqual({ error: 'Unauthorized', status: 401 });
    });

    it('should return 403 if user is student', async () => {
      const result = await updateSongHandler(
        mockSupabase,
        mockUser,
        mockStudentProfile,
        'song-id',
        updateData
      );
      expect(result).toEqual({
        error: 'Forbidden: Only teachers and admins can update songs',
        status: 403,
      });
    });

    it('should allow teachers to update songs', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: updateData,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await updateSongHandler(
        mockSupabase,
        mockUser,
        mockTeacherProfile,
        'song-id',
        updateData
      );

      expect(result.status).toBe(200);
      expect(result.song).toEqual(updateData);
    });

    it('should add updated_at timestamp', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: updateData,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await updateSongHandler(mockSupabase, mockUser, mockTeacherProfile, 'song-id', updateData);

      // Verify updated_at was added
      expect(mockQuery.update).toHaveBeenCalled();
      const updateCall = mockQuery.update.mock.calls[0][0];
      expect(updateCall).toHaveProperty('updated_at');
    });
  });

  describe('deleteSongHandler', () => {
    it('should return 401 if no user', async () => {
      const result = await deleteSongHandler(mockSupabase, null, mockAdminProfile, 'song-id');
      expect(result).toEqual({ error: 'Unauthorized', status: 401 });
    });

    it('should return 403 if user is student', async () => {
      const result = await deleteSongHandler(mockSupabase, mockUser, mockStudentProfile, 'song-id');
      expect(result).toEqual({
        error: 'Forbidden: Only teachers and admins can delete songs',
        status: 403,
      });
    });

    it('should allow teachers to delete songs', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: {
          success: true,
          lesson_assignments_removed: 0,
          favorite_assignments_removed: 0,
        },
        error: null,
      });

      const result = await deleteSongHandler(mockSupabase, mockUser, mockTeacherProfile, 'song-id');

      expect(result.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.cascadeInfo).toEqual({
        lessonSongsDeleted: 0,
        userFavoritesDeleted: 0,
      });
    });

    it('should allow admins to delete songs', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: {
          success: true,
          lesson_assignments_removed: 2,
          favorite_assignments_removed: 1,
        },
        error: null,
      });

      const result = await deleteSongHandler(mockSupabase, mockUser, mockAdminProfile, 'song-id');

      expect(result.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.cascadeInfo).toEqual({
        lessonSongsDeleted: 2,
        userFavoritesDeleted: 1,
      });
    });

    it('should handle database errors', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Delete failed' },
      });

      const result = await deleteSongHandler(mockSupabase, mockUser, mockAdminProfile, 'song-id');

      expect(result.status).toBe(500);
      expect(result.error).toBe('Delete failed');
    });
  });
});
