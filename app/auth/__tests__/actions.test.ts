/**
 * Auth Actions Tests
 *
 * Tests for authentication server actions: signIn, signUp,
 * resendVerificationEmail, and resetPassword with rate limiting
 */

import { signIn, signUp, resendVerificationEmail, resetPassword } from '../actions';
import { checkAuthRateLimit, clearAllAuthRateLimits } from '@/lib/auth/rate-limiter';
import {
  checkAccountLockout,
  incrementFailedAttempts,
  resetFailedAttempts,
} from '@/lib/auth/account-lockout';

// Mock Supabase client
const mockSignInWithPassword = jest.fn();
const mockSignUp = jest.fn();
const mockResend = jest.fn();
const mockResetPasswordForEmail = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      resend: mockResend,
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  })),
}));

// Mock Next.js headers
const mockHeaders = new Map<string, string>();
mockHeaders.set('x-forwarded-for', '192.168.1.1');
mockHeaders.set('origin', 'http://localhost:3000');

jest.mock('next/headers', () => ({
  headers: jest.fn(() => ({
    get: (key: string) => mockHeaders.get(key),
  })),
}));

// Mock rate limiter
jest.mock('@/lib/auth/rate-limiter', () => ({
  checkAuthRateLimit: jest.fn().mockResolvedValue({
    allowed: true,
    remaining: 4,
    resetTime: Date.now() + 3600000,
  }),
  clearAllAuthRateLimits: jest.fn().mockResolvedValue(undefined),
  AUTH_RATE_LIMITS: {
    passwordReset: { maxAttempts: 5, windowMs: 60 * 60 * 1000 },
    login: { maxAttempts: 10, windowMs: 15 * 60 * 1000 },
    signup: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },
    resendEmail: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },
  },
}));

// Mock account lockout
jest.mock('@/lib/auth/account-lockout', () => ({
  checkAccountLockout: jest.fn().mockResolvedValue({ locked: false }),
  incrementFailedAttempts: jest.fn().mockResolvedValue(undefined),
  resetFailedAttempts: jest.fn().mockResolvedValue(undefined),
}));

// Mock account actions (updateLastSignIn)
jest.mock('@/app/actions/account', () => ({
  updateLastSignIn: jest.fn().mockResolvedValue(undefined),
}));

describe('Auth Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearAllAuthRateLimits();
    mockHeaders.set('x-forwarded-for', '192.168.1.1');
    mockHeaders.set('origin', 'http://localhost:3000');
  });

  describe('signIn', () => {
    const email = 'test@example.com';
    const password = 'password123';

    beforeEach(() => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: '123' } },
        error: null,
      });
    });

    it('should successfully sign in', async () => {
      const result = await signIn(email, password);
      expect(result.success).toBe(true);
    });

    it('should validate input with SignInSchema', async () => {
      const result = await signIn('bad-email', 'pw');
      expect(result.error).toBeDefined();
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });

    it('should check rate limit before signing in', async () => {
      await signIn(email, password);
      expect(checkAuthRateLimit).toHaveBeenCalledWith(expect.stringContaining(email), 'login');
    });

    it('should block when rate limited', async () => {
      (checkAuthRateLimit as jest.Mock).mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 900000,
        retryAfter: 900,
      });

      const result = await signIn(email, password);
      expect(result.error).toContain('Too many login attempts');
      expect(result.rateLimited).toBe(true);
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });

    it('should check account lockout', async () => {
      await signIn(email, password);
      expect(checkAccountLockout).toHaveBeenCalledWith(email);
    });

    it('should block when account is locked', async () => {
      (checkAccountLockout as jest.Mock).mockResolvedValueOnce({
        locked: true,
        retryAfterMs: 15 * 60 * 1000,
      });

      const result = await signIn(email, password);
      expect(result.error).toContain('Account temporarily locked');
      expect(result.locked).toBe(true);
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });

    it('should increment failed attempts on auth error', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' },
      });

      await signIn(email, password);
      expect(incrementFailedAttempts).toHaveBeenCalledWith(email);
    });

    it('should reset failed attempts on success', async () => {
      await signIn(email, password);
      expect(resetFailedAttempts).toHaveBeenCalledWith(email);
    });

    it('should show friendly message for invalid credentials', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' },
      });

      const result = await signIn(email, password);
      expect(result.error).toContain('Invalid email or password');
    });
  });

  describe('signUp', () => {
    const validArgs = ['John', 'Doe', 'john@example.com', 'MyPass12', 'MyPass12'] as const;

    beforeEach(() => {
      mockSignUp.mockResolvedValue({
        data: { user: { id: '123', identities: [{ id: 'i1' }] } },
        error: null,
      });
    });

    it('should successfully sign up', async () => {
      const result = await signUp(...validArgs);
      expect(result.success).toBe(true);
    });

    it('should validate input with SignUpSchema', async () => {
      const result = await signUp('', '', 'bad', '123', '456');
      expect(result.error).toBeDefined();
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('should reject weak passwords (no number)', async () => {
      const result = await signUp('John', 'Doe', 'john@example.com', 'abcdefgh', 'abcdefgh');
      expect(result.error).toBeDefined();
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('should reject weak passwords (too short)', async () => {
      const result = await signUp('John', 'Doe', 'john@example.com', 'Pass1', 'Pass1');
      expect(result.error).toBeDefined();
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('should check rate limit', async () => {
      await signUp(...validArgs);
      expect(checkAuthRateLimit).toHaveBeenCalledWith(
        expect.stringContaining('john@example.com'),
        'signup'
      );
    });

    it('should block when rate limited', async () => {
      (checkAuthRateLimit as jest.Mock).mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 3600000,
        retryAfter: 3600,
      });

      const result = await signUp(...validArgs);
      expect(result.error).toContain('Too many sign-up attempts');
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('should detect already registered emails', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered' },
      });

      const result = await signUp(...validArgs);
      expect(result.error).toContain('already has an account');
    });

    it('should detect shadow users (empty identities)', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: { id: '123', identities: [] } },
        error: null,
      });

      const result = await signUp(...validArgs);
      expect(result.error).toContain('invitation');
    });

    it('should reject disposable email addresses', async () => {
      const result = await signUp('John', 'Doe', 'john@mailinator.com', 'MyPass12', 'MyPass12');
      expect(result.error).toContain('Disposable email');
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('should pass first_name and last_name in metadata', async () => {
      await signUp(...validArgs);
      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'john@example.com',
          password: 'MyPass12',
          options: {
            data: {
              first_name: 'John',
              last_name: 'Doe',
            },
          },
        })
      );
    });
  });

  describe('resendVerificationEmail', () => {
    beforeEach(() => {
      mockResend.mockResolvedValue({ error: null });
    });

    it('should successfully resend email', async () => {
      const result = await resendVerificationEmail('test@example.com');
      expect(result.success).toBe(true);
    });

    it('should check rate limit with resendEmail key', async () => {
      await resendVerificationEmail('test@example.com');
      expect(checkAuthRateLimit).toHaveBeenCalledWith(
        expect.stringContaining('test@example.com'),
        'resendEmail'
      );
    });

    it('should block when rate limited', async () => {
      (checkAuthRateLimit as jest.Mock).mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 3600000,
        retryAfter: 3600,
      });

      const result = await resendVerificationEmail('test@example.com');
      expect(result.error).toContain('Too many resend attempts');
      expect(mockResend).not.toHaveBeenCalled();
    });

    it('should handle Supabase errors', async () => {
      mockResend.mockResolvedValue({
        error: { message: 'Email rate limit exceeded' },
      });

      const result = await resendVerificationEmail('test@example.com');
      expect(result.error).toBe('Email rate limit exceeded');
    });
  });

  describe('resetPassword', () => {
    beforeEach(() => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null });
    });

    it('should successfully send password reset email', async () => {
      const result = await resetPassword('test@example.com');
      expect(result).toEqual({ success: true });
    });

    it('should check rate limit before sending email', async () => {
      await resetPassword('test@example.com');
      expect(checkAuthRateLimit).toHaveBeenCalledWith(
        expect.stringContaining('test@example.com'),
        'passwordReset'
      );
    });

    it('should block request when rate limit exceeded', async () => {
      (checkAuthRateLimit as jest.Mock).mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 3600000,
        retryAfter: 3600,
      });

      const result = await resetPassword('test@example.com');
      expect(result.error).toContain('Too many password reset attempts');
      expect(result.rateLimited).toBe(true);
      expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
    });

    it('should handle missing origin header', async () => {
      mockHeaders.delete('origin');
      const result = await resetPassword('test@example.com');
      expect(result.error).toContain('Configuration error');
    });

    it('should handle Supabase errors', async () => {
      mockResetPasswordForEmail.mockResolvedValue({
        error: { message: 'Invalid email format' },
      });

      const result = await resetPassword('test@example.com');
      expect(result.error).toBe('Invalid email format');
    });
  });
});
