/**
 * Tests for user-session token refresh in getGoogleClient() (spec 7.5).
 *
 * Verifies that getGoogleClient() refreshes and persists a new access token
 * when expires_at is in the past, matching the behaviour already present in
 * getGoogleClientAdmin().
 */

import { createClient } from '@/lib/supabase/server';
import { getGoogleClient } from '@/lib/google';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock googleapis OAuth2 client
const mockSetCredentials = jest.fn();
const mockRefreshAccessToken = jest.fn();

jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        setCredentials: mockSetCredentials,
        refreshAccessToken: mockRefreshAccessToken,
        generateAuthUrl: jest.fn(),
      })),
    },
    calendar: jest.fn(),
  },
}));

function buildSupabaseMock(integration: Record<string, unknown>) {
  // The persist callback does: await supabase.from(...).update({...}).eq(...).eq(...)
  // Each .eq() must return a thenable so await resolves.
  const makeEqChain = (): { eq: jest.Mock } & PromiseLike<{ error: null }> => {
    const chain: { eq: jest.Mock } & PromiseLike<{ error: null }> = {
      eq: jest.fn(() => chain),
      then: (resolve: (v: { error: null }) => unknown) =>
        Promise.resolve({ error: null }).then(resolve),
    } as unknown as { eq: jest.Mock } & PromiseLike<{ error: null }>;
    return chain;
  };

  const update = jest.fn(() => makeEqChain());

  const selectChain = {
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: integration, error: null }),
  };
  const select = jest.fn(() => selectChain);

  return {
    from: jest.fn(() => ({ select, update })),
    auth: { getUser: jest.fn() },
    _update: update,
  };
}

const VALID_TOKEN = {
  access_token: 'ya29.valid-token',
  refresh_token: 'refresh-token',
  expires_at: Date.now() + 3600_000, // valid for 1 h
};

const EXPIRED_TOKEN = {
  access_token: 'ya29.expired-token',
  refresh_token: 'refresh-token',
  expires_at: Date.now() - 5_000, // expired 5 s ago
};

describe('getGoogleClient() — token refresh (7.5)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_CLIENT_ID = 'client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'client-secret';
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost/api/auth/google/callback';
  });

  it('sets credentials without refreshing when token is still valid', async () => {
    const supabase = buildSupabaseMock(VALID_TOKEN);
    (createClient as jest.Mock).mockResolvedValue(supabase);

    await getGoogleClient('user-123');

    expect(mockSetCredentials).toHaveBeenCalledTimes(1);
    expect(mockRefreshAccessToken).not.toHaveBeenCalled();
  });

  it('calls refreshAccessToken when expires_at is in the past', async () => {
    const supabase = buildSupabaseMock(EXPIRED_TOKEN);
    (createClient as jest.Mock).mockResolvedValue(supabase);

    const newCredentials = {
      access_token: 'ya29.new-token',
      expiry_date: Date.now() + 3600_000,
    };
    mockRefreshAccessToken.mockResolvedValue({ credentials: newCredentials });

    await getGoogleClient('user-123');

    expect(mockRefreshAccessToken).toHaveBeenCalledTimes(1);
    // setCredentials called twice: initial + after refresh
    expect(mockSetCredentials).toHaveBeenCalledTimes(2);
    expect(mockSetCredentials).toHaveBeenLastCalledWith(newCredentials);
  });

  it('persists the refreshed token to user_integrations', async () => {
    const supabase = buildSupabaseMock(EXPIRED_TOKEN);
    (createClient as jest.Mock).mockResolvedValue(supabase);

    const newCredentials = {
      access_token: 'ya29.persisted-token',
      expiry_date: Date.now() + 3600_000,
    };
    mockRefreshAccessToken.mockResolvedValue({ credentials: newCredentials });

    await getGoogleClient('user-123');

    expect(supabase._update).toHaveBeenCalledWith(
      expect.objectContaining({
        access_token: 'ya29.persisted-token',
        expires_at: newCredentials.expiry_date,
      })
    );
  });

  it('throws when refreshAccessToken rejects', async () => {
    const supabase = buildSupabaseMock(EXPIRED_TOKEN);
    (createClient as jest.Mock).mockResolvedValue(supabase);

    mockRefreshAccessToken.mockRejectedValue(new Error('invalid_grant'));

    await expect(getGoogleClient('user-123')).rejects.toThrow(
      'Failed to refresh Google access token'
    );
  });

  it('throws when integration is not found', async () => {
    const selectChain = {
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
    };
    const supabase = { from: jest.fn(() => ({ select: jest.fn(() => selectChain) })) };
    (createClient as jest.Mock).mockResolvedValue(supabase);

    await expect(getGoogleClient('user-123')).rejects.toThrow('Google integration not found');
  });
});
