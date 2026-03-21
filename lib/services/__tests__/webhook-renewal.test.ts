import {
  findExpiringWebhooks,
  renewExpiringWebhooks,
  cleanupExpiredWebhooks,
} from '../webhook-renewal';
import { createAdminClient } from '@/lib/supabase/admin';
import * as googleLib from '@/lib/google';

// Mock dependencies
jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}));

jest.mock('@/lib/google', () => ({
  watchCalendar: jest.fn(),
}));

describe('webhook-renewal', () => {
  let mockSupabase: {
    from: jest.Mock;
    select: jest.Mock;
    eq: jest.Mock;
    lt: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  const createMockSupabase = () => {
    const mock = {
      from: jest.fn(),
      select: jest.fn(),
      eq: jest.fn(),
      lt: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    // Chain methods return the mock object itself
    mock.from.mockReturnValue(mock);
    mock.select.mockReturnValue(mock);
    mock.eq.mockReturnValue(mock);
    mock.lt.mockReturnValue(mock);
    mock.update.mockReturnValue(mock);
    mock.delete.mockReturnValue(mock);

    return mock;
  };

  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabase();
    (createAdminClient as jest.Mock).mockReturnValue(mockSupabase);

    // Set up environment
    process.env = { ...OLD_ENV };
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe('findExpiringWebhooks', () => {
    it('should find webhooks expiring within 24 hours', async () => {
      const expiringWebhooks = [
        {
          id: 'sub-1',
          user_id: 'user-1',
          provider: 'google_calendar',
          channel_id: 'channel-1',
          resource_id: 'resource-1',
          expiration: Date.now() + 12 * 60 * 60 * 1000, // 12 hours from now
        },
      ];

      // Final method in chain returns the result
      mockSupabase.lt.mockResolvedValue({
        data: expiringWebhooks,
        error: null,
      });

      const result = await findExpiringWebhooks();

      expect(result).toEqual(expiringWebhooks);
      expect(mockSupabase.from).toHaveBeenCalledWith('webhook_subscriptions');
      expect(mockSupabase.eq).toHaveBeenCalledWith('provider', 'google_calendar');
      expect(mockSupabase.lt).toHaveBeenCalledWith('expiration', expect.any(Number));
    });

    it('should return empty array when no webhooks are expiring', async () => {
      mockSupabase.lt.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await findExpiringWebhooks();

      expect(result).toEqual([]);
    });

    it('should return empty array on database error', async () => {
      mockSupabase.lt.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await findExpiringWebhooks();

      expect(result).toEqual([]);
    });
  });

  describe('renewExpiringWebhooks', () => {
    it('should successfully renew expiring webhooks', async () => {
      const expiringWebhooks = [
        {
          id: 'sub-1',
          user_id: 'user-1',
          provider: 'google_calendar',
          channel_id: 'old-channel-1',
          resource_id: 'old-resource-1',
          expiration: Date.now() + 12 * 60 * 60 * 1000,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];

      // Mock findExpiringWebhooks (from->select->eq->lt chain)
      // lt is the final method, so it returns the result
      mockSupabase.lt.mockResolvedValueOnce({
        data: expiringWebhooks,
        error: null,
      });

      // Mock watchCalendar
      (googleLib.watchCalendar as jest.Mock).mockResolvedValue({
        channelId: 'new-channel-1',
        resourceId: 'new-resource-1',
        expiration: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
      });

      // For update chain (from->update->eq), we need to return the result on second eq call
      // First eq call is in the findExpiringWebhooks chain (returns mock for chaining)
      // Second eq call is in the update chain (returns result)
      // We need to track call count or use a workaround
      let eqCallCount = 0;
      mockSupabase.eq.mockImplementation(() => {
        eqCallCount++;
        if (eqCallCount === 1) {
          // First call: findExpiringWebhooks chain, return mock for lt()
          return mockSupabase;
        } else {
          // Second call: update chain, return result
          return Promise.resolve({ data: {}, error: null });
        }
      });

      const result = await renewExpiringWebhooks();

      expect(result.totalChecked).toBe(1);
      expect(result.renewed).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.results[0].success).toBe(true);
      expect(result.results[0].newChannelId).toBe('new-channel-1');

      expect(googleLib.watchCalendar).toHaveBeenCalledWith(
        'user-1',
        'https://example.com/api/webhooks/google-calendar'
      );

      expect(mockSupabase.update).toHaveBeenCalledWith({
        channel_id: 'new-channel-1',
        resource_id: 'new-resource-1',
        expiration: expect.any(Number),
        updated_at: expect.any(String),
      });
    });

    it('should return early when no webhooks are expiring', async () => {
      mockSupabase.lt.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await renewExpiringWebhooks();

      expect(result.totalChecked).toBe(0);
      expect(result.renewed).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.results).toEqual([]);

      expect(googleLib.watchCalendar).not.toHaveBeenCalled();
    });

    it('should handle renewal failures gracefully', async () => {
      const expiringWebhooks = [
        {
          id: 'sub-1',
          user_id: 'user-1',
          provider: 'google_calendar',
          channel_id: 'old-channel-1',
          resource_id: 'old-resource-1',
          expiration: Date.now() + 12 * 60 * 60 * 1000,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];

      mockSupabase.lt.mockResolvedValueOnce({
        data: expiringWebhooks,
        error: null,
      });

      // Mock watchCalendar to fail
      (googleLib.watchCalendar as jest.Mock).mockRejectedValue(new Error('API rate limit'));

      const result = await renewExpiringWebhooks();

      expect(result.totalChecked).toBe(1);
      expect(result.renewed).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.results[0].success).toBe(false);
      expect(result.results[0].error).toBe('API rate limit');
    });

    it('should handle missing channel ID from Google API', async () => {
      const expiringWebhooks = [
        {
          id: 'sub-1',
          user_id: 'user-1',
          provider: 'google_calendar',
          channel_id: 'old-channel-1',
          resource_id: 'old-resource-1',
          expiration: Date.now() + 12 * 60 * 60 * 1000,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];

      mockSupabase.lt.mockResolvedValueOnce({
        data: expiringWebhooks,
        error: null,
      });

      // Mock watchCalendar returning missing fields
      (googleLib.watchCalendar as jest.Mock).mockResolvedValue({
        channelId: null,
        resourceId: 'new-resource-1',
        expiration: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });

      const result = await renewExpiringWebhooks();

      expect(result.totalChecked).toBe(1);
      expect(result.renewed).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.results[0].error).toContain('Missing required fields');
    });

    it('should handle database update errors', async () => {
      const expiringWebhooks = [
        {
          id: 'sub-1',
          user_id: 'user-1',
          provider: 'google_calendar',
          channel_id: 'old-channel-1',
          resource_id: 'old-resource-1',
          expiration: Date.now() + 12 * 60 * 60 * 1000,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];

      mockSupabase.lt.mockResolvedValueOnce({
        data: expiringWebhooks,
        error: null,
      });

      (googleLib.watchCalendar as jest.Mock).mockResolvedValue({
        channelId: 'new-channel-1',
        resourceId: 'new-resource-1',
        expiration: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });

      // Mock findExpiringWebhooks
      mockSupabase.lt.mockResolvedValueOnce({
        data: expiringWebhooks,
        error: null,
      });

      // Mock update to fail
      let eqCallCount = 0;
      mockSupabase.eq.mockImplementation(() => {
        eqCallCount++;
        if (eqCallCount === 1) {
          return mockSupabase;
        } else {
          // Return Supabase error format - code will throw it
          return Promise.resolve({
            data: null,
            error: new Error('Database error'),
          });
        }
      });

      const result = await renewExpiringWebhooks();

      expect(result.totalChecked).toBe(1);
      expect(result.renewed).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.results[0].error).toBe('Database error');
    });

    it('should renew multiple webhooks sequentially', async () => {
      const expiringWebhooks = [
        {
          id: 'sub-1',
          user_id: 'user-1',
          provider: 'google_calendar',
          channel_id: 'old-channel-1',
          resource_id: 'old-resource-1',
          expiration: Date.now() + 12 * 60 * 60 * 1000,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        {
          id: 'sub-2',
          user_id: 'user-2',
          provider: 'google_calendar',
          channel_id: 'old-channel-2',
          resource_id: 'old-resource-2',
          expiration: Date.now() + 6 * 60 * 60 * 1000,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];

      mockSupabase.lt.mockResolvedValueOnce({
        data: expiringWebhooks,
        error: null,
      });

      (googleLib.watchCalendar as jest.Mock)
        .mockResolvedValueOnce({
          channelId: 'new-channel-1',
          resourceId: 'new-resource-1',
          expiration: Date.now() + 7 * 24 * 60 * 60 * 1000,
        })
        .mockResolvedValueOnce({
          channelId: 'new-channel-2',
          resourceId: 'new-resource-2',
          expiration: Date.now() + 7 * 24 * 60 * 60 * 1000,
        });

      // Mock findExpiringWebhooks
      mockSupabase.lt.mockResolvedValueOnce({
        data: expiringWebhooks,
        error: null,
      });

      // Mock two successful updates (3 eq calls total: 1 for find, 2 for updates)
      let eqCallCount = 0;
      mockSupabase.eq.mockImplementation(() => {
        eqCallCount++;
        if (eqCallCount === 1) {
          return mockSupabase;
        } else {
          return Promise.resolve({ data: {}, error: null });
        }
      });

      const result = await renewExpiringWebhooks();

      expect(result.totalChecked).toBe(2);
      expect(result.renewed).toBe(2);
      expect(result.failed).toBe(0);
      expect(googleLib.watchCalendar).toHaveBeenCalledTimes(2);
    });
  });

  describe('cleanupExpiredWebhooks', () => {
    it('should delete expired webhooks from database', async () => {
      const expiredWebhooks = [
        { id: 'sub-1', user_id: 'user-1' },
        { id: 'sub-2', user_id: 'user-2' },
      ];

      mockSupabase.select.mockResolvedValue({
        data: expiredWebhooks,
        error: null,
      });

      const deletedCount = await cleanupExpiredWebhooks();

      expect(deletedCount).toBe(2);
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('provider', 'google_calendar');
      expect(mockSupabase.lt).toHaveBeenCalledWith('expiration', expect.any(Number));
    });

    it('should return 0 when no expired webhooks exist', async () => {
      mockSupabase.select.mockResolvedValue({
        data: [],
        error: null,
      });

      const deletedCount = await cleanupExpiredWebhooks();

      expect(deletedCount).toBe(0);
    });

    it('should return 0 on database error', async () => {
      mockSupabase.select.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const deletedCount = await cleanupExpiredWebhooks();

      expect(deletedCount).toBe(0);
    });
  });
});
