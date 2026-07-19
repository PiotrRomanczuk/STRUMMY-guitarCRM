import { syncAllLessonsFromCalendar } from '@/app/dashboard/calendar-actions';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getGoogleOAuth2Client } from '@/lib/google';
import { google } from 'googleapis';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}));

jest.mock('@/lib/google', () => ({
  getGoogleOAuth2Client: jest.fn(),
}));

jest.mock('googleapis', () => ({
  google: {
    calendar: jest.fn(),
  },
}));

// Mock createShadowUser and syncSingleEvent (which are internal to actions.ts but we can mock the DB calls they make)
// Actually, since syncAllLessonsFromCalendar calls createShadowUser which is exported, we might want to mock it if we could.
// But since they are in the same file, jest.mock on the file itself won't work for internal calls easily without some rewiring.
// Instead, we will mock the underlying Supabase calls that createShadowUser makes.

describe('Sync All Lessons', () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  };

  const mockAdminSupabase = {
    from: jest.fn(),
    auth: {
      admin: {
        createUser: jest.fn(),
        listUsers: jest.fn(),
        generateLink: jest.fn(),
        updateUserById: jest.fn(),
      },
    },
  };

  const mockCalendar = {
    events: {
      list: jest.fn(),
    },
  };

  const mockOAuth2Client = {
    setCredentials: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    (createAdminClient as jest.Mock).mockReturnValue(mockAdminSupabase);
    (getGoogleOAuth2Client as jest.Mock).mockReturnValue(mockOAuth2Client);
    (google.calendar as unknown as jest.Mock).mockReturnValue(mockCalendar);
  });

  it('should sync lessons for all students found in calendar events', async () => {
    // 1. Mock Auth User (Teacher)
    const teacherId = 'teacher-123';
    const teacherEmail = 'teacher@example.com';
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: teacherId, email: teacherEmail } },
    });

    // Mock user_integrations query
    const mockSingleIntegration = jest.fn().mockResolvedValue({
      data: { access_token: 'mock-token', refresh_token: 'mock-refresh-token' },
      error: null,
    });

    mockSupabase.from.mockImplementation((table) => {
      if (table === 'user_integrations') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: mockSingleIntegration,
              }),
            }),
          }),
        };
      }
      if (table === 'profiles') {
        // createShadowUser authorizes the caller (must be admin/teacher) via
        // this exact query before ever looking for the student.
        return {
          select: () => ({
            eq: () => ({
              single: jest
                .fn()
                .mockResolvedValue({ data: { is_admin: false, is_teacher: true }, error: null }),
            }),
          }),
        };
      }
      return { select: jest.fn().mockReturnThis() };
    });

    // 2. Mock Calendar Events
    const student1Email = 'student1@example.com';
    const student2Email = 'student2@example.com';

    mockCalendar.events.list.mockResolvedValue({
      data: {
        items: [
          {
            id: 'event-1',
            summary: 'Lesson with Student 1',
            // isGuitarLesson() only treats Calendly-booked events as guitar
            // lessons — gates on this marker in the description.
            description: 'Powered by Calendly.com',
            start: { dateTime: '2023-10-27T10:00:00Z' },
            attendees: [{ email: teacherEmail }, { email: student1Email }],
          },
          {
            id: 'event-2',
            summary: 'Lesson with Student 2',
            description: 'Powered by Calendly.com',
            start: { dateTime: '2023-10-27T11:00:00Z' },
            attendees: [{ email: student2Email }],
          },
          {
            id: 'event-3', // Irrelevant event (no student)
            summary: 'Lunch',
            start: { dateTime: '2023-10-27T12:00:00Z' },
            attendees: [{ email: teacherEmail }],
          },
        ],
      },
    });

    // 3. Mock User Existence Check (createShadowUser logic)
    // We'll simulate that Student 1 exists, but Student 2 needs creation

    // listUsers mock
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mockAdminSupabase.auth.admin.listUsers.mockImplementation(async ({ page }) => {
      // For simplicity, return empty list so it falls back to generateLink for both
      // In a real scenario, we might want to return one found and one not.
      return { data: { users: [] }, error: null };
    });

    // generateLink mock (simulates finding/creating user)
    mockAdminSupabase.auth.admin.generateLink.mockImplementation(async ({ email }) => {
      if (email === student1Email) {
        return { data: { user: { id: 'student-1-id', email: student1Email } }, error: null };
      }
      if (email === student2Email) {
        return { data: { user: { id: 'student-2-id', email: student2Email } }, error: null };
      }
      return { data: null, error: 'Not found' };
    });

    // updateUserById mock (auto-confirm)
    mockAdminSupabase.auth.admin.updateUserById.mockResolvedValue({ data: {}, error: null });

    // upsert profile mock
    const mockUpsertProfile = jest.fn().mockResolvedValue({ error: null });

    // upsert lesson mock (syncSingleEvent logic)
    const mockSelectLesson = jest.fn().mockResolvedValue({ data: null }); // No existing lesson
    const mockInsertLesson = jest.fn().mockResolvedValue({ error: null });
    const mockSelectLastLesson = jest
      .fn()
      .mockResolvedValue({ data: { lesson_teacher_number: 5 } });

    mockAdminSupabase.from.mockImplementation((table) => {
      if (table === 'profiles') return { upsert: mockUpsertProfile };
      if (table === 'lessons') {
        return {
          select: () => ({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            eq: (_field: any, _val: any) => ({
              single: mockSelectLesson, // for checking existing lesson
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              eq: (_f2: any, _v2: any) => ({
                // for finding last lesson number
                order: () => ({
                  limit: () => ({
                    single: mockSelectLastLesson,
                  }),
                }),
              }),
            }),
          }),
          insert: mockInsertLesson,
          update: jest.fn().mockResolvedValue({ error: null }),
        };
      }
      return { select: jest.fn().mockReturnThis() };
    });

    // Act
    const result = await syncAllLessonsFromCalendar();

    // Assert
    expect(result.success).toBe(true);
    expect(result.count).toBe(2); // Should sync event-1 and event-2

    // Verify createShadowUser was called (via generateLink) for both students
    expect(mockAdminSupabase.auth.admin.generateLink).toHaveBeenCalledWith(
      expect.objectContaining({ email: student1Email })
    );
    expect(mockAdminSupabase.auth.admin.generateLink).toHaveBeenCalledWith(
      expect.objectContaining({ email: student2Email })
    );

    // Verify lessons were inserted
    expect(mockInsertLesson).toHaveBeenCalledTimes(2);
    expect(mockInsertLesson).toHaveBeenCalledWith(
      expect.objectContaining({
        google_event_id: 'event-1',
        student_id: 'student-1-id',
      })
    );
    expect(mockInsertLesson).toHaveBeenCalledWith(
      expect.objectContaining({
        google_event_id: 'event-2',
        student_id: 'student-2-id',
      })
    );
  });
});
