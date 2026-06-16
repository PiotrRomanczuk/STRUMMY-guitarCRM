/**
 * Tests for Supabase-backed email rate limiter
 */

import {
  checkRateLimit,
  checkSystemRateLimit,
  recordEmailSent,
  __testing__,
} from '../rate-limiter';

// Mock the admin client
const mockRpc = jest.fn();
const mockSupabase = { rpc: mockRpc };

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => mockSupabase),
}));

jest.mock('@/lib/logging/notification-logger', () => ({
  logRateLimitExceeded: jest.fn(),
  logError: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Email Rate Limiter (Supabase-backed)', () => {
  describe('checkRateLimit', () => {
    it('should allow when user count is below limit', async () => {
      mockRpc.mockResolvedValue({ data: 50, error: null });

      const result = await checkRateLimit('user-123');

      expect(result.allowed).toBe(true);
      expect(result.retryAfter).toBeUndefined();
      expect(mockRpc).toHaveBeenCalledWith(
        'get_user_email_count_last_hour',
        { p_user_id: 'user-123' }
      );
    });

    it('should block when user count reaches limit', async () => {
      mockRpc.mockResolvedValue({ data: 100, error: null });

      const result = await checkRateLimit('user-123');

      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBe(__testing__.WINDOW_SECONDS);
    });

    it('should block when user count exceeds limit', async () => {
      mockRpc.mockResolvedValue({ data: 150, error: null });

      const result = await checkRateLimit('user-123');

      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBe(__testing__.WINDOW_SECONDS);
    });

    it('should fail open on RPC error', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'DB error' } });

      const result = await checkRateLimit('user-123');

      expect(result.allowed).toBe(true);
    });

    it('should fail open on thrown exception', async () => {
      mockRpc.mockRejectedValue(new Error('Connection failed'));

      const result = await checkRateLimit('user-123');

      expect(result.allowed).toBe(true);
    });

    it('should treat null data as 0 count', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null });

      const result = await checkRateLimit('user-123');

      expect(result.allowed).toBe(true);
    });

    it('should allow at count just below limit', async () => {
      mockRpc.mockResolvedValue({ data: __testing__.USER_LIMIT - 1, error: null });

      const result = await checkRateLimit('user-123');

      expect(result.allowed).toBe(true);
    });
  });

  describe('checkSystemRateLimit', () => {
    it('should allow when system count is below limit', async () => {
      mockRpc.mockResolvedValue({ data: 500, error: null });

      const result = await checkSystemRateLimit();

      expect(result.allowed).toBe(true);
      expect(result.retryAfter).toBeUndefined();
      expect(mockRpc).toHaveBeenCalledWith('get_system_email_count_last_hour');
    });

    it('should block when system count reaches limit', async () => {
      mockRpc.mockResolvedValue({ data: 1000, error: null });

      const result = await checkSystemRateLimit();

      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBe(__testing__.WINDOW_SECONDS);
    });

    it('should block when system count exceeds limit', async () => {
      mockRpc.mockResolvedValue({ data: 1500, error: null });

      const result = await checkSystemRateLimit();

      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBe(__testing__.WINDOW_SECONDS);
    });

    it('should fail open on RPC error', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'DB error' } });

      const result = await checkSystemRateLimit();

      expect(result.allowed).toBe(true);
    });

    it('should fail open on thrown exception', async () => {
      mockRpc.mockRejectedValue(new Error('Connection failed'));

      const result = await checkSystemRateLimit();

      expect(result.allowed).toBe(true);
    });

    it('should allow at count just below limit', async () => {
      mockRpc.mockResolvedValue({ data: __testing__.SYSTEM_LIMIT - 1, error: null });

      const result = await checkSystemRateLimit();

      expect(result.allowed).toBe(true);
    });
  });

  describe('recordEmailSent', () => {
    it('should be a no-op', async () => {
      await recordEmailSent('user-123');

      expect(mockRpc).not.toHaveBeenCalled();
    });
  });

  describe('constants', () => {
    it('should have correct user limit', () => {
      expect(__testing__.USER_LIMIT).toBe(100);
    });

    it('should have correct system limit', () => {
      expect(__testing__.SYSTEM_LIMIT).toBe(1000);
    });

    it('should have 1 hour window', () => {
      expect(__testing__.WINDOW_SECONDS).toBe(3600);
    });
  });
});
