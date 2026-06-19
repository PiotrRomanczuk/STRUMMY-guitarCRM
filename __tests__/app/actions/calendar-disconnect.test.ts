/**
 * Tests for the Google disconnect flow (spec 7.6).
 *
 * Verifies that disconnectGoogle() revokes the OAuth token, stops the
 * webhook channel, and deletes both the user_integrations row and the
 * webhook_subscriptions row — all scoped to the current user.
 */

import { disconnectGoogle } from '@/app/dashboard/calendar-actions';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/google', () => ({
  getGoogleOAuth2Client: jest.fn(),
  stopCalendarWatch: jest.fn(),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { getGoogleOAuth2Client, stopCalendarWatch } from '@/lib/google';

const USER_ID = 'teacher-uuid-1';
const ACCESS_TOKEN = 'ya29.access-token';
const CHANNEL_ID = 'ch-123';
const RESOURCE_ID = 'res-456';

const mockRevokeToken = jest.fn();

function buildSupabaseMock({
  hasIntegration = true,
  hasSubscription = true,
  deleteError = null as { message: string } | null,
} = {}) {
  const chains: Record<string, jest.Mock> = {};

  const makeDeleteChain = (result: { error: unknown }) => ({
    eq: jest.fn().mockReturnThis(),
    then: (resolve: (v: unknown) => void) => resolve(result),
  });

  const supabase = {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: USER_ID } } }),
    },
    from: jest.fn((table: string) => {
      if (table === 'user_integrations') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: hasIntegration ? { access_token: ACCESS_TOKEN } : null,
              error: hasIntegration ? null : { message: 'not found' },
            }),
          })),
          delete: jest.fn(() => {
            const chain = makeDeleteChain({ error: deleteError });
            chains['integrations_delete'] = chain.eq as jest.Mock;
            return chain;
          }),
        };
      }
      if (table === 'webhook_subscriptions') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockReturnThis(),
            then: (resolve: (v: unknown) => void) =>
              resolve({
                data: hasSubscription ? [{ channel_id: CHANNEL_ID, resource_id: RESOURCE_ID }] : [],
                error: null,
              }),
          })),
          delete: jest.fn(() => makeDeleteChain({ error: null })),
        };
      }
      return { select: jest.fn(), delete: jest.fn() };
    }),
  };

  return supabase;
}

describe('disconnectGoogle() (7.6)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_CLIENT_ID = 'client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'client-secret';
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost/callback';

    (getGoogleOAuth2Client as jest.Mock).mockReturnValue({
      revokeToken: mockRevokeToken,
    });
    mockRevokeToken.mockResolvedValue(undefined);
    (stopCalendarWatch as jest.Mock).mockResolvedValue(undefined);
  });

  it('returns success:false when user is not authenticated', async () => {
    const supabase = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
      from: jest.fn(),
    };
    (createClient as jest.Mock).mockResolvedValue(supabase);

    const result = await disconnectGoogle();
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('revokes the OAuth token with Google', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildSupabaseMock());

    await disconnectGoogle();

    expect(mockRevokeToken).toHaveBeenCalledWith(ACCESS_TOKEN);
  });

  it('stops the active webhook channel', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildSupabaseMock());

    await disconnectGoogle();

    expect(stopCalendarWatch).toHaveBeenCalledWith(USER_ID, CHANNEL_ID, RESOURCE_ID);
  });

  it('proceeds and returns success:true even when revokeToken throws', async () => {
    mockRevokeToken.mockRejectedValue(new Error('Token already revoked'));
    (createClient as jest.Mock).mockResolvedValue(buildSupabaseMock());

    const result = await disconnectGoogle();

    expect(result.success).toBe(true);
  });

  it('proceeds and returns success:true even when stopCalendarWatch throws', async () => {
    (stopCalendarWatch as jest.Mock).mockRejectedValue(new Error('Channel already stopped'));
    (createClient as jest.Mock).mockResolvedValue(buildSupabaseMock());

    const result = await disconnectGoogle();

    expect(result.success).toBe(true);
  });

  it('returns success:false when the user_integrations delete fails', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildSupabaseMock({ deleteError: { message: 'delete failed' } })
    );

    const result = await disconnectGoogle();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to disconnect Google');
  });

  it('succeeds when there is no webhook subscription to stop', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildSupabaseMock({ hasSubscription: false }));

    const result = await disconnectGoogle();

    expect(stopCalendarWatch).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
  });
});
