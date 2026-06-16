import { GET as authRoute } from '@/app/api/auth/google/route';
import { GET as callbackRoute } from '@/app/api/oauth2/callback/route';
import { getGoogleAuthUrl, getGoogleOAuth2Client } from '@/lib/google';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/google', () => ({
  getGoogleAuthUrl: jest.fn(),
  getGoogleOAuth2Client: jest.fn(),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('Google Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/auth/google', () => {
    it('should redirect to Google Auth URL', async () => {
      (getGoogleAuthUrl as jest.Mock).mockReturnValue('https://google.com/auth');

      const req = new NextRequest('http://localhost:3000/api/auth/google');
      await authRoute(req);

      expect(getGoogleAuthUrl).toHaveBeenCalledWith('http://localhost:3000/api/oauth2/callback');
      expect(redirect).toHaveBeenCalledWith('https://google.com/auth');
    });
  });

  describe('GET /api/oauth2/callback', () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn().mockReturnThis(),
      upsert: jest.fn(),
    };

    beforeEach(() => {
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    });

    it('should redirect with error if error param is present', async () => {
      const req = {
        nextUrl: {
          searchParams: new URLSearchParams('error=access_denied'),
          origin: 'http://localhost:3000',
        },
      } as unknown as NextRequest;

      await callbackRoute(req);

      expect(redirect).toHaveBeenCalledWith('/dashboard?error=google_auth_error');
    });

    it('should redirect with error if code param is missing', async () => {
      const req = {
        nextUrl: {
          searchParams: new URLSearchParams(''),
          origin: 'http://localhost:3000',
        },
      } as unknown as NextRequest;

      await callbackRoute(req);

      expect(redirect).toHaveBeenCalledWith('/dashboard?error=no_code');
    });

    it('should redirect to login if user is not authenticated', async () => {
      const req = {
        nextUrl: {
          searchParams: new URLSearchParams('code=valid-code'),
          origin: 'http://localhost:3000',
        },
      } as unknown as NextRequest;
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: 'No user' });

      await callbackRoute(req);

      expect(redirect).toHaveBeenCalledWith('/login?error=unauthorized');
    });

    it('should exchange code for tokens and store them', async () => {
      const req = {
        nextUrl: {
          searchParams: new URLSearchParams('code=valid-code'),
          origin: 'http://localhost:3000',
        },
      } as unknown as NextRequest;

      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // Mock Google token exchange
      const mockOAuth2Client = {
        getToken: jest.fn().mockResolvedValue({
          tokens: {
            access_token: 'access-token',
            refresh_token: 'refresh-token',
            expiry_date: 1234567890,
          },
        }),
      };
      (getGoogleOAuth2Client as jest.Mock).mockReturnValue(mockOAuth2Client);

      // Mock Supabase upsert success
      mockSupabase.upsert.mockResolvedValue({ error: null });

      await callbackRoute(req);

      expect(mockOAuth2Client.getToken).toHaveBeenCalledWith('valid-code');
      expect(mockSupabase.from).toHaveBeenCalledWith('user_integrations');
      expect(mockSupabase.upsert).toHaveBeenCalledWith({
        user_id: 'user-123',
        provider: 'google',
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_at: 1234567890,
        updated_at: expect.any(String),
      });
      expect(redirect).toHaveBeenCalledWith('/dashboard?success=google_connected');
    });

    it('should handle database errors', async () => {
      const req = {
        nextUrl: {
          searchParams: new URLSearchParams('code=valid-code'),
          origin: 'http://localhost:3000',
        },
      } as unknown as NextRequest;

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const mockOAuth2Client = {
        getToken: jest.fn().mockResolvedValue({
          tokens: { access_token: 'token' },
        }),
      };
      (getGoogleOAuth2Client as jest.Mock).mockReturnValue(mockOAuth2Client);

      mockSupabase.upsert.mockResolvedValue({ error: 'DB Error' });

      await callbackRoute(req);

      expect(redirect).toHaveBeenCalledWith('/dashboard?error=db_error');
    });
  });
});
