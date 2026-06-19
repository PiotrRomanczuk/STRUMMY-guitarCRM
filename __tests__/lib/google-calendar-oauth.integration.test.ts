/**
 * Integration tests for Google Calendar OAuth (Journey 5)
 *
 * Tests OAuth connection, auth URL scope, calendar event fetching, and isGuitarLesson filtering.
 */

import { getGoogleAuthUrl, getGoogleClient, getCalendarEventsInRange } from '@/lib/google';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';
import { isGuitarLesson } from '@/lib/calendar/calendar-utils';

const mockSetCredentials = jest.fn();
const mockGenerateAuthUrl = jest.fn().mockReturnValue('https://accounts.google.com/o/oauth2/v2/auth');

jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn(() => ({ generateAuthUrl: mockGenerateAuthUrl, setCredentials: mockSetCredentials })),
    },
    calendar: jest.fn().mockReturnValue({ events: { list: jest.fn() } }),
  },
}));

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));

jest.mock('@/lib/ai/retry', () => ({
  withRetry: jest.fn((fn: () => Promise<unknown>) => fn()),
  AI_PROVIDER_RETRY_CONFIG: { maxRetries: 0, retryableErrors: [] },
}));

describe('Google Calendar OAuth (Journey 5)', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV };
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/api/oauth2/callback';
  });

  afterAll(() => { process.env = OLD_ENV; });

  describe('getGoogleAuthUrl scope (Gap 7)', () => {
    it('requests full calendar scope (not calendar.readonly) plus drive.file', () => {
      getGoogleAuthUrl();
      expect(mockGenerateAuthUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          scope: expect.arrayContaining([
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/drive.file',
          ]),
        })
      );
      const calledScope = mockGenerateAuthUrl.mock.calls[0][0].scope;
      expect(calledScope).not.toContain('https://www.googleapis.com/auth/calendar.readonly');
    });
  });

  describe('getGoogleClient', () => {
    it('sets credentials from Supabase integration record', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { access_token: 'access-abc', refresh_token: 'refresh-xyz', expires_at: 9999999999999 }, error: null,
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      await getGoogleClient('user-1');
      expect(mockSetCredentials).toHaveBeenCalledWith({
        access_token: 'access-abc', refresh_token: 'refresh-xyz', expiry_date: 9999999999999,
      });
    });

    it('throws when integration is not found', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      await expect(getGoogleClient('user-1')).rejects.toThrow('Google integration not found');
    });
  });

  describe('getCalendarEventsInRange (Gap 1)', () => {
    it('passes timeMin and timeMax to Google Calendar API', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { access_token: 'token', refresh_token: 'refresh', expires_at: 9999999999999 }, error: null,
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const mockList = jest.fn().mockResolvedValue({ data: { items: [{ id: 'e1', summary: 'Lesson' }] } });
      (google.calendar as unknown as jest.Mock).mockReturnValue({ events: { list: mockList } });

      const startDate = new Date('2025-02-14');
      const endDate = new Date('2025-03-14');
      await getCalendarEventsInRange('user-1', startDate, endDate);

      expect(mockList).toHaveBeenCalledWith(
        expect.objectContaining({
          calendarId: 'primary', timeMin: startDate.toISOString(), timeMax: endDate.toISOString(), singleEvents: true,
        })
      );
    });
  });

  describe('isGuitarLesson filter', () => {
    it('filters events through isGuitarLesson based on Calendly description', () => {
      const events = [
        { description: 'Powered by Calendly.com — Guitar lesson with John' },
        { description: 'Team standup meeting' },
        { description: 'Powered by Calendly.com — First lesson' },
      ];
      const filtered = events.filter(isGuitarLesson);
      expect(filtered).toHaveLength(2);
    });

    it('returns false for events without description', () => {
      expect(isGuitarLesson({ description: null })).toBe(false);
      expect(isGuitarLesson({ description: undefined })).toBe(false);
      expect(isGuitarLesson({})).toBe(false);
    });
  });
});
