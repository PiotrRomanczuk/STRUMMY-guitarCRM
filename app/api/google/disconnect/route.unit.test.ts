import { POST } from '@/app/api/google/disconnect/route';
import { createClient } from '@/lib/supabase/server';
import { getGoogleOAuth2Client, stopCalendarWatch } from '@/lib/google';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/google', () => ({
  getGoogleOAuth2Client: jest.fn(),
  stopCalendarWatch: jest.fn(),
}));

describe('POST /api/google/disconnect', () => {
  const mockSupabase = {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const res = await POST();

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  it('returns success with alreadyDisconnected when no integration exists', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });
    mockSupabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null }),
    }));

    const res = await POST();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, alreadyDisconnected: true });
  });

  it('revokes credentials, stops webhooks, and deletes integration', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });

    const integration = {
      access_token: 'a-token',
      refresh_token: 'r-token',
      expires_at: 1234567890,
    };
    const subscriptions = [{ channel_id: 'chan-1', resource_id: 'res-1' }];

    const deleteEq = jest.fn();
    deleteEq.mockReturnValueOnce({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });
    deleteEq.mockReturnValueOnce({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    let integrationCallCount = 0;
    let webhookCallCount = 0;
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'user_integrations') {
        integrationCallCount++;
        if (integrationCallCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: integration }),
          };
        }
        return {
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          }),
        };
      }
      if (table === 'webhook_subscriptions') {
        webhookCallCount++;
        if (webhookCallCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest
              .fn()
              .mockReturnThis()
              .mockReturnValueOnce({
                eq: jest.fn().mockResolvedValue({ data: subscriptions }),
              }),
          };
        }
        return {
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          }),
        };
      }
      return {};
    });

    const revokeCredentials = jest.fn().mockResolvedValue(undefined);
    const setCredentials = jest.fn();
    (getGoogleOAuth2Client as jest.Mock).mockReturnValue({
      setCredentials,
      revokeCredentials,
    });
    (stopCalendarWatch as jest.Mock).mockResolvedValue(undefined);

    const res = await POST();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(stopCalendarWatch).toHaveBeenCalledWith('user-123', 'chan-1', 'res-1');
    expect(setCredentials).toHaveBeenCalledWith({
      access_token: 'a-token',
      refresh_token: 'r-token',
      expiry_date: 1234567890,
    });
    expect(revokeCredentials).toHaveBeenCalled();
  });

  it('still succeeds if Google revoke and webhook stop fail', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });

    let integrationCallCount = 0;
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'user_integrations') {
        integrationCallCount++;
        if (integrationCallCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { access_token: 'a', refresh_token: 'r', expires_at: 1 },
            }),
          };
        }
        return {
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          }),
        };
      }
      if (table === 'webhook_subscriptions') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest
            .fn()
            .mockReturnThis()
            .mockReturnValueOnce({
              eq: jest.fn().mockResolvedValue({ data: [{ channel_id: 'c', resource_id: 'r' }] }),
            }),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          }),
        };
      }
      return {};
    });

    (getGoogleOAuth2Client as jest.Mock).mockReturnValue({
      setCredentials: jest.fn(),
      revokeCredentials: jest.fn().mockRejectedValue(new Error('invalid_token')),
    });
    (stopCalendarWatch as jest.Mock).mockRejectedValue(new Error('channel gone'));

    const res = await POST();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });

  it('returns 500 when delete from user_integrations fails', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });

    let integrationCallCount = 0;
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'user_integrations') {
        integrationCallCount++;
        if (integrationCallCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { access_token: 'a', refresh_token: 'r', expires_at: 1 },
            }),
          };
        }
        return {
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: { message: 'boom' } }),
            }),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest
          .fn()
          .mockReturnThis()
          .mockReturnValueOnce({
            eq: jest.fn().mockResolvedValue({ data: [] }),
          }),
      };
    });

    (getGoogleOAuth2Client as jest.Mock).mockReturnValue({
      setCredentials: jest.fn(),
      revokeCredentials: jest.fn().mockResolvedValue(undefined),
    });

    const res = await POST();

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Failed to disconnect Google Calendar' });
  });
});
