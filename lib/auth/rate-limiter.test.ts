/**
 * Auth Rate Limiter Tests (Supabase-backed)
 */

import {
  checkAuthRateLimit,
  resetAuthRateLimit,
  clearAllAuthRateLimits,
  cleanupExpiredAuthEntries,
  AUTH_RATE_LIMITS,
} from './rate-limiter';

// Mock Supabase admin client
const mockRpc = jest.fn();
const mockInsert = jest.fn().mockResolvedValue({ error: null });
const mockDeleteEq = jest.fn().mockReturnThis();
const mockDeleteEq2 = jest.fn().mockResolvedValue({ error: null });
const mockDeleteNeq = jest.fn().mockResolvedValue({ error: null });
const mockDelete = jest.fn().mockReturnValue({ eq: mockDeleteEq, neq: mockDeleteNeq });

const mockSupabase = {
  rpc: mockRpc,
  from: jest.fn().mockReturnValue({
    insert: mockInsert,
    delete: mockDelete,
  }),
};

// Make delete().eq().eq() chain work
mockDeleteEq.mockReturnValue({ eq: mockDeleteEq2 });

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => mockSupabase),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockDeleteEq.mockReturnValue({ eq: mockDeleteEq2 });
  mockDelete.mockReturnValue({ eq: mockDeleteEq, neq: mockDeleteNeq });
  mockSupabase.from.mockReturnValue({
    insert: mockInsert,
    delete: mockDelete,
  });
});

describe('Auth Rate Limiter (Supabase-backed)', () => {
  describe('AUTH_RATE_LIMITS Configuration', () => {
    it('should have correct password reset limits', () => {
      expect(AUTH_RATE_LIMITS.passwordReset.maxAttempts).toBe(5);
      expect(AUTH_RATE_LIMITS.passwordReset.windowMs).toBe(60 * 60 * 1000);
    });

    it('should have correct login limits', () => {
      expect(AUTH_RATE_LIMITS.login.maxAttempts).toBe(10);
      expect(AUTH_RATE_LIMITS.login.windowMs).toBe(15 * 60 * 1000);
    });

    it('should have correct signup limits', () => {
      expect(AUTH_RATE_LIMITS.signup.maxAttempts).toBe(3);
      expect(AUTH_RATE_LIMITS.signup.windowMs).toBe(60 * 60 * 1000);
    });

    it('should have correct resendEmail limits', () => {
      expect(AUTH_RATE_LIMITS.resendEmail.maxAttempts).toBe(3);
      expect(AUTH_RATE_LIMITS.resendEmail.windowMs).toBe(60 * 60 * 1000);
    });
  });

  describe('checkAuthRateLimit', () => {
    it('should allow first request and return correct remaining', async () => {
      mockRpc.mockResolvedValue({ data: 0, error: null });

      const result = await checkAuthRateLimit('test@example.com', 'passwordReset');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4); // 5 - 0 - 1
      expect(result.retryAfter).toBeUndefined();
      expect(result.resetTime).toBeGreaterThan(Date.now() - 1000);
    });

    it('should pass correct params to RPC', async () => {
      mockRpc.mockResolvedValue({ data: 0, error: null });

      await checkAuthRateLimit('user@test.com', 'passwordReset');

      expect(mockRpc).toHaveBeenCalledWith('check_auth_rate_limit', {
        p_identifier: 'user@test.com',
        p_operation: 'passwordReset',
        p_window_ms: AUTH_RATE_LIMITS.passwordReset.windowMs,
      });
    });

    it('should record the attempt via insert', async () => {
      mockRpc.mockResolvedValue({ data: 2, error: null });

      await checkAuthRateLimit('test@example.com', 'login');

      expect(mockSupabase.from).toHaveBeenCalledWith('auth_rate_limits');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: 'test@example.com',
          operation: 'login',
        })
      );
    });

    it('should block when count reaches max attempts', async () => {
      mockRpc.mockResolvedValue({ data: 5, error: null });

      const result = await checkAuthRateLimit('test@example.com', 'passwordReset');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(3600);
    });

    it('should block when count exceeds max attempts', async () => {
      mockRpc.mockResolvedValue({ data: 10, error: null });

      const result = await checkAuthRateLimit('test@example.com', 'passwordReset');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should allow when count is below max attempts', async () => {
      mockRpc.mockResolvedValue({ data: 3, error: null });

      const result = await checkAuthRateLimit('test@example.com', 'passwordReset');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1); // 5 - 3 - 1
    });

    it('should fail closed on RPC error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockRpc.mockResolvedValue({ data: null, error: { message: 'DB error' } });

      const result = await checkAuthRateLimit('test@example.com', 'passwordReset');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBe(60);
      consoleSpy.mockRestore();
    });

    it('should fail closed on thrown exception', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockRpc.mockRejectedValue(new Error('Connection failed'));

      const result = await checkAuthRateLimit('test@example.com', 'passwordReset');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      consoleSpy.mockRestore();
    });

    it('should treat null data as 0 count', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null });

      const result = await checkAuthRateLimit('test@example.com', 'passwordReset');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should use correct window for login operation', async () => {
      mockRpc.mockResolvedValue({ data: 0, error: null });

      await checkAuthRateLimit('test@example.com', 'login');

      expect(mockRpc).toHaveBeenCalledWith(
        'check_auth_rate_limit',
        expect.objectContaining({
          p_window_ms: AUTH_RATE_LIMITS.login.windowMs,
        })
      );
    });

    it('should use correct window for signup operation', async () => {
      mockRpc.mockResolvedValue({ data: 0, error: null });

      await checkAuthRateLimit('test@example.com', 'signup');

      expect(mockRpc).toHaveBeenCalledWith(
        'check_auth_rate_limit',
        expect.objectContaining({
          p_window_ms: AUTH_RATE_LIMITS.signup.windowMs,
        })
      );
    });

    it('should block signup after 3 attempts', async () => {
      mockRpc.mockResolvedValue({ data: 3, error: null });

      const result = await checkAuthRateLimit('test@example.com', 'signup');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe('resetAuthRateLimit', () => {
    it('should delete entries for identifier and operation', async () => {
      await resetAuthRateLimit('test@example.com', 'passwordReset');

      expect(mockSupabase.from).toHaveBeenCalledWith('auth_rate_limits');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockDeleteEq).toHaveBeenCalledWith('identifier', 'test@example.com');
      expect(mockDeleteEq2).toHaveBeenCalledWith('operation', 'passwordReset');
    });

    it('should not throw on error', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(
        resetAuthRateLimit('test@example.com', 'passwordReset')
      ).resolves.toBeUndefined();
    });
  });

  describe('clearAllAuthRateLimits', () => {
    it('should delete all entries', async () => {
      await clearAllAuthRateLimits();

      expect(mockSupabase.from).toHaveBeenCalledWith('auth_rate_limits');
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should not throw on error', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(clearAllAuthRateLimits()).resolves.toBeUndefined();
    });
  });

  describe('cleanupExpiredAuthEntries', () => {
    it('should call cleanup RPC function', async () => {
      mockRpc.mockResolvedValue({ error: null });

      await cleanupExpiredAuthEntries();

      expect(mockRpc).toHaveBeenCalledWith('cleanup_auth_rate_limits');
    });

    it('should not throw on error', async () => {
      mockRpc.mockRejectedValue(new Error('DB error'));

      await expect(cleanupExpiredAuthEntries()).resolves.toBeUndefined();
    });
  });
});
