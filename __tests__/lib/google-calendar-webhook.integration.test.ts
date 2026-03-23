/**
 * Integration tests for Google Calendar Webhook (Journey 7)
 *
 * Tests webhook route handler (POST), enableCalendarWebhook server action,
 * and fetchAndSyncRecentEvents trigger flow.
 */

import { POST } from '@/app/api/webhooks/google-calendar/route';
import { enableCalendarWebhook } from '@/app/actions/calendar-webhook';
import { createMockNextRequest, createMockQueryBuilder } from '@/lib/testing/integration-helpers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('@/lib/supabase/admin', () => ({ createAdminClient: jest.fn() }));

jest.mock('@/lib/services/google-calendar-sync', () => ({
  fetchAndSyncRecentEvents: jest.fn().mockResolvedValue({ success: true, count: 3 }),
}));

jest.mock('@/lib/google', () => ({
  watchCalendar: jest.fn().mockResolvedValue({
    channelId: 'ch-new-1', resourceId: 'res-new-1',
    expiration: Date.now() + 7 * 24 * 60 * 60 * 1000,
  }),
  getGoogleOAuth2Client: jest.fn(),
}));

jest.mock('@/lib/getUserWithRolesSSR', () => ({
  getUserWithRolesSSR: jest.fn().mockResolvedValue({ user: { id: 'teacher-user-id' }, isTeacher: true }),
}));

jest.mock('@/lib/config', () => ({
  getAppConfig: jest.fn().mockReturnValue({ apiUrl: 'https://strummy.app' }),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fetchAndSyncRecentEvents } = require('@/lib/services/google-calendar-sync');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getUserWithRolesSSR } = require('@/lib/getUserWithRolesSSR');

describe('Google Calendar Webhook (Journey 7)', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV };
    process.env.GOOGLE_CALENDAR_WEBHOOK_SECRET = 'test-webhook-secret';
    process.env.GOOGLE_CLIENT_ID = 'test-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-secret';
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/api/oauth2/callback';
  });

  afterAll(() => { process.env = OLD_ENV; });

  describe('POST /api/webhooks/google-calendar', () => {
    it('returns 400 when required headers are missing', async () => {
      const req = createMockNextRequest('/api/webhooks/google-calendar', { method: 'POST', headers: {} });
      const res = await POST(req);
      const body = await res.json();
      expect(res.status).toBe(400);
      expect(body.error).toBe('Missing headers');
    });

    it('returns 401 when webhook token is invalid (Gap 4)', async () => {
      const req = createMockNextRequest('/api/webhooks/google-calendar', {
        method: 'POST',
        headers: { 'x-goog-channel-id': 'ch-1', 'x-goog-resource-id': 'res-1', 'x-goog-channel-token': 'wrong-secret' },
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('returns 200 for sync verification (resourceState=sync)', async () => {
      const req = createMockNextRequest('/api/webhooks/google-calendar', {
        method: 'POST',
        headers: {
          'x-goog-channel-id': 'ch-1', 'x-goog-resource-id': 'res-1',
          'x-goog-resource-state': 'sync', 'x-goog-channel-token': 'test-webhook-secret',
        },
      });
      const res = await POST(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.status).toBe('ok');
    });

    it('triggers fetchAndSyncRecentEvents for a valid subscription', async () => {
      const subscriptionQb = createMockQueryBuilder({ user_id: 'user-abc' });
      (createAdminClient as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue(subscriptionQb) });

      const req = createMockNextRequest('/api/webhooks/google-calendar', {
        method: 'POST',
        headers: {
          'x-goog-channel-id': 'ch-1', 'x-goog-resource-id': 'res-1',
          'x-goog-resource-state': 'exists', 'x-goog-channel-token': 'test-webhook-secret',
        },
      });
      const res = await POST(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.status).toBe('processed');
      await new Promise((r) => setTimeout(r, 10));
      expect(fetchAndSyncRecentEvents).toHaveBeenCalledWith('user-abc');
    });

    it('returns 200 "ignored" for unknown channel (prevents Google retries)', async () => {
      const emptyQb = createMockQueryBuilder(null, { message: 'Not found' });
      (createAdminClient as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue(emptyQb) });

      const req = createMockNextRequest('/api/webhooks/google-calendar', {
        method: 'POST',
        headers: {
          'x-goog-channel-id': 'unknown-ch', 'x-goog-resource-id': 'unknown-res',
          'x-goog-resource-state': 'exists', 'x-goog-channel-token': 'test-webhook-secret',
        },
      });
      const res = await POST(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.status).toBe('ignored');
    });
  });

  describe('enableCalendarWebhook', () => {
    it('stores subscription in webhook_subscriptions on success', async () => {
      const insertQb = createMockQueryBuilder(null, null);
      const mockSupabase = { from: jest.fn().mockReturnValue(insertQb) };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await enableCalendarWebhook();
      expect(result).toEqual({ success: true });
      expect(mockSupabase.from).toHaveBeenCalledWith('webhook_subscriptions');
      expect(insertQb.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'teacher-user-id', provider: 'google_calendar',
          channel_id: 'ch-new-1', resource_id: 'res-new-1',
        })
      );
    });

    it('returns error when user is not a teacher', async () => {
      getUserWithRolesSSR.mockResolvedValueOnce({ user: { id: 'student-id' }, isTeacher: false });
      const result = await enableCalendarWebhook();
      expect(result).toEqual({ success: false, error: 'Unauthorized' });
    });

    it('returns error when DB insert fails', async () => {
      const errorQb = createMockQueryBuilder(null, { message: 'DB error' });
      errorQb.insert.mockImplementation(() => { throw { message: 'DB error' }; });
      (createClient as jest.Mock).mockResolvedValue({ from: jest.fn().mockReturnValue(errorQb) });

      const result = await enableCalendarWebhook();
      expect(result.success).toBe(false);
    });
  });
});
