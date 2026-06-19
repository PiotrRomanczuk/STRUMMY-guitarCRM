import {
  getGoogleOAuth2Client,
  getGoogleAuthUrl,
  getGoogleClient,
  getCalendarEventsInRange,
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  stopCalendarWatch,
} from '@/lib/google';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';

// Mock dependencies
jest.mock('googleapis', () => {
  const mOAuth2Client = {
    generateAuthUrl: jest
      .fn()
      .mockReturnValue('https://accounts.google.com/o/oauth2/v2/auth?mock=true'),
    setCredentials: jest.fn(),
  };
  return {
    google: {
      auth: {
        OAuth2: jest.fn(() => mOAuth2Client),
      },
      calendar: jest.fn().mockReturnValue({
        events: {
          list: jest.fn(),
          insert: jest.fn(),
          patch: jest.fn(),
          delete: jest.fn(),
          watch: jest.fn(),
        },
        channels: {
          stop: jest.fn(),
        },
      }),
    },
  };
});

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/ai/retry', () => ({
  withRetry: jest.fn((fn) => fn()),
  AI_PROVIDER_RETRY_CONFIG: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 8000,
    backoffMultiplier: 2,
  },
}));

describe('Google Library', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV };
    process.env.GOOGLE_CLIENT_ID = 'mock-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'mock-client-secret';
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/api/oauth2/callback';
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe('getGoogleOAuth2Client', () => {
    it('should create an OAuth2 client with correct credentials', () => {
      getGoogleOAuth2Client();
      expect(google.auth.OAuth2).toHaveBeenCalledWith(
        'mock-client-id',
        'mock-client-secret',
        'http://localhost:3000/api/oauth2/callback'
      );
    });

    it('should throw error if credentials are missing', () => {
      delete process.env.GOOGLE_CLIENT_ID;
      expect(() => getGoogleOAuth2Client()).toThrow('Missing Google OAuth2 credentials');
    });
  });

  describe('getGoogleAuthUrl', () => {
    it('should generate a valid auth URL', () => {
      const url = getGoogleAuthUrl();
      expect(url).toBe('https://accounts.google.com/o/oauth2/v2/auth?mock=true');

      // Get the mock instance to check generateAuthUrl arguments
      const mockOAuth2Client = (google.auth.OAuth2 as unknown as jest.Mock).mock.results[0].value;
      expect(mockOAuth2Client.generateAuthUrl).toHaveBeenCalledWith({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/drive.file',
        ],
        prompt: 'consent',
      });
    });
  });

  describe('getGoogleClient', () => {
    it('should return an authenticated client when integration exists', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expires_at: 9999999999999,
          },
          error: null,
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const client = await getGoogleClient('user-123');

      expect(client.setCredentials).toHaveBeenCalledWith({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expiry_date: 9999999999999,
      });
    });

    it('should throw error when integration is not found', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      await expect(getGoogleClient('user-123')).rejects.toThrow('Google integration not found');
    });
  });

  describe('getCalendarEventsInRange', () => {
    it('should fetch events from Google Calendar', async () => {
      // Mock getGoogleClient behavior internally since we can't easily mock the exported function within the same module
      // However, we can mock the dependencies it uses (Supabase) which we already did.

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            access_token: 'mock-access-token',
          },
          error: null,
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const mockList = jest.fn().mockResolvedValue({
        data: {
          items: [{ id: 'event-1', summary: 'Lesson 1' }],
        },
      });

      (google.calendar as unknown as jest.Mock).mockReturnValue({
        events: {
          list: mockList,
        },
      });

      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      const events = await getCalendarEventsInRange('user-123', startDate, endDate);

      expect(events).toHaveLength(1);
      expect(events[0].id).toBe('event-1');
      expect(mockList).toHaveBeenCalledWith({
        calendarId: 'primary',
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });
    });
  });

  describe('createGoogleCalendarEvent', () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_at: 9999999999999,
        },
        error: null,
      }),
    };

    beforeEach(() => {
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    });

    it('should create a Google Calendar event with correct parameters', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: { id: 'event-123' },
      });

      (google.calendar as unknown as jest.Mock).mockReturnValue({
        events: { insert: mockInsert },
      });

      const lesson = {
        title: 'Guitar Lesson',
        scheduled_at: '2026-02-10T15:00:00Z',
        notes: 'Practice scales',
        student_email: 'student@example.com',
        duration_minutes: 45,
      };

      const result = await createGoogleCalendarEvent('user-123', lesson);

      expect(result.eventId).toBe('event-123');
      expect(mockInsert).toHaveBeenCalledWith({
        calendarId: 'primary',
        requestBody: expect.objectContaining({
          summary: 'Guitar Lesson',
          description: 'Practice scales',
          attendees: [{ email: 'student@example.com' }],
          start: expect.objectContaining({
            dateTime: '2026-02-10T15:00:00.000Z',
            timeZone: 'UTC',
          }),
          end: expect.objectContaining({
            dateTime: '2026-02-10T15:45:00.000Z',
            timeZone: 'UTC',
          }),
        }),
      });
    });

    it('should use default 60-minute duration when not specified', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: { id: 'event-456' },
      });

      (google.calendar as unknown as jest.Mock).mockReturnValue({
        events: { insert: mockInsert },
      });

      const lesson = {
        title: 'Guitar Lesson',
        scheduled_at: '2026-02-10T15:00:00Z',
        student_email: 'student@example.com',
      };

      await createGoogleCalendarEvent('user-123', lesson);

      const call = mockInsert.mock.calls[0][0];
      expect(call.requestBody.end.dateTime).toBe('2026-02-10T16:00:00.000Z');
    });

    it('should throw error when event ID is not returned', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: {},
      });

      (google.calendar as unknown as jest.Mock).mockReturnValue({
        events: { insert: mockInsert },
      });

      const lesson = {
        title: 'Guitar Lesson',
        scheduled_at: '2026-02-10T15:00:00Z',
        student_email: 'student@example.com',
      };

      await expect(createGoogleCalendarEvent('user-123', lesson)).rejects.toThrow(
        'Failed to create Google Calendar event: No event ID returned'
      );
    });
  });

  describe('updateGoogleCalendarEvent', () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_at: 9999999999999,
        },
        error: null,
      }),
    };

    beforeEach(() => {
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    });

    it('should update event title only when specified', async () => {
      const mockPatch = jest.fn().mockResolvedValue({ data: {} });

      (google.calendar as unknown as jest.Mock).mockReturnValue({
        events: { patch: mockPatch },
      });

      await updateGoogleCalendarEvent('user-123', 'event-123', {
        title: 'Updated Lesson Title',
      });

      expect(mockPatch).toHaveBeenCalledWith({
        calendarId: 'primary',
        eventId: 'event-123',
        requestBody: {
          summary: 'Updated Lesson Title',
        },
      });
    });

    it('should update scheduled time and duration', async () => {
      const mockPatch = jest.fn().mockResolvedValue({ data: {} });

      (google.calendar as unknown as jest.Mock).mockReturnValue({
        events: { patch: mockPatch },
      });

      await updateGoogleCalendarEvent('user-123', 'event-123', {
        scheduled_at: '2026-02-15T10:00:00Z',
        duration_minutes: 90,
      });

      expect(mockPatch).toHaveBeenCalledWith({
        calendarId: 'primary',
        eventId: 'event-123',
        requestBody: {
          start: {
            dateTime: '2026-02-15T10:00:00.000Z',
            timeZone: 'UTC',
          },
          end: {
            dateTime: '2026-02-15T11:30:00.000Z',
            timeZone: 'UTC',
          },
        },
      });
    });

    it('should update multiple fields at once', async () => {
      const mockPatch = jest.fn().mockResolvedValue({ data: {} });

      (google.calendar as unknown as jest.Mock).mockReturnValue({
        events: { patch: mockPatch },
      });

      await updateGoogleCalendarEvent('user-123', 'event-123', {
        title: 'New Title',
        notes: 'New notes',
        scheduled_at: '2026-02-20T14:00:00Z',
      });

      expect(mockPatch).toHaveBeenCalledWith({
        calendarId: 'primary',
        eventId: 'event-123',
        requestBody: {
          summary: 'New Title',
          description: 'New notes',
          start: expect.any(Object),
          end: expect.any(Object),
        },
      });
    });
  });

  describe('deleteGoogleCalendarEvent', () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_at: 9999999999999,
        },
        error: null,
      }),
    };

    beforeEach(() => {
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    });

    it('should delete a Google Calendar event', async () => {
      const mockDelete = jest.fn().mockResolvedValue({ data: {} });

      (google.calendar as unknown as jest.Mock).mockReturnValue({
        events: { delete: mockDelete },
      });

      await deleteGoogleCalendarEvent('user-123', 'event-123');

      expect(mockDelete).toHaveBeenCalledWith({
        calendarId: 'primary',
        eventId: 'event-123',
      });
    });
  });

  describe('stopCalendarWatch', () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_at: 9999999999999,
        },
        error: null,
      }),
    };

    beforeEach(() => {
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    });

    it('should stop a calendar watch subscription', async () => {
      const mockStop = jest.fn().mockResolvedValue({ data: {} });

      (google.calendar as unknown as jest.Mock).mockReturnValue({
        channels: { stop: mockStop },
      });

      await stopCalendarWatch('user-123', 'channel-123', 'resource-123');

      expect(mockStop).toHaveBeenCalledWith({
        requestBody: {
          id: 'channel-123',
          resourceId: 'resource-123',
        },
      });
    });
  });
});
