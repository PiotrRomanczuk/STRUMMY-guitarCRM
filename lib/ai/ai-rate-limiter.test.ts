/**
 * Rate Limiter Tests
 *
 * Tests for the AI rate limiter functionality
 */

import {
  checkRateLimit,
  resetRateLimit,
  clearAllRateLimits,
  cleanupExpiredEntries,
  DEFAULT_RATE_LIMITS,
} from './rate-limiter';

describe('Rate Limiter', () => {
  // Clear rate limits before each test to ensure isolation
  beforeEach(() => {
    clearAllRateLimits();
  });

  describe('DEFAULT_RATE_LIMITS', () => {
    it('should have configuration for all user roles', () => {
      expect(DEFAULT_RATE_LIMITS).toHaveProperty('admin');
      expect(DEFAULT_RATE_LIMITS).toHaveProperty('teacher');
      expect(DEFAULT_RATE_LIMITS).toHaveProperty('student');
      expect(DEFAULT_RATE_LIMITS).toHaveProperty('anonymous');
    });

    it('should have admin with highest limits', () => {
      expect(DEFAULT_RATE_LIMITS.admin.maxRequests).toBe(100);
      expect(DEFAULT_RATE_LIMITS.admin.windowMs).toBe(60000);
    });

    it('should have teacher with medium-high limits', () => {
      expect(DEFAULT_RATE_LIMITS.teacher.maxRequests).toBe(50);
      expect(DEFAULT_RATE_LIMITS.teacher.windowMs).toBe(60000);
    });

    it('should have student with medium limits', () => {
      expect(DEFAULT_RATE_LIMITS.student.maxRequests).toBe(20);
      expect(DEFAULT_RATE_LIMITS.student.windowMs).toBe(60000);
    });

    it('should have anonymous with lowest limits', () => {
      expect(DEFAULT_RATE_LIMITS.anonymous.maxRequests).toBe(5);
      expect(DEFAULT_RATE_LIMITS.anonymous.windowMs).toBe(60000);
    });

    it('should have correct limit hierarchy', () => {
      expect(DEFAULT_RATE_LIMITS.admin.maxRequests).toBeGreaterThan(
        DEFAULT_RATE_LIMITS.teacher.maxRequests
      );
      expect(DEFAULT_RATE_LIMITS.teacher.maxRequests).toBeGreaterThan(
        DEFAULT_RATE_LIMITS.student.maxRequests
      );
      expect(DEFAULT_RATE_LIMITS.student.maxRequests).toBeGreaterThan(
        DEFAULT_RATE_LIMITS.anonymous.maxRequests
      );
    });
  });

  describe('checkRateLimit', () => {
    it('should allow first request', async () => {
      const result = await checkRateLimit('user-1', 'admin');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99); // 100 - 1
      expect(result.retryAfter).toBeUndefined();
    });

    it('should track request count correctly', async () => {
      const result1 = await checkRateLimit('user-2', 'student');
      expect(result1.remaining).toBe(19); // 20 - 1

      const result2 = await checkRateLimit('user-2', 'student');
      expect(result2.remaining).toBe(18); // 20 - 2

      const result3 = await checkRateLimit('user-2', 'student');
      expect(result3.remaining).toBe(17); // 20 - 3
    });

    it('should block requests when limit exceeded', async () => {
      const userId = 'user-3';

      // Make 5 requests (anonymous limit)
      for (let i = 0; i < 5; i++) {
        const result = await checkRateLimit(userId, 'anonymous');
        expect(result.allowed).toBe(true);
      }

      // 6th request should be blocked
      const result = await checkRateLimit(userId, 'anonymous');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should provide retryAfter in seconds', async () => {
      const userId = 'user-4';

      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        await checkRateLimit(userId, 'anonymous');
      }

      const result = await checkRateLimit(userId, 'anonymous');
      expect(result.retryAfter).toBeLessThanOrEqual(60); // Window is 60 seconds
    });

    it('should track different users independently', async () => {
      // Exhaust user A's limit
      for (let i = 0; i < 5; i++) {
        await checkRateLimit('user-A', 'anonymous');
      }

      // User B should still be allowed
      const resultB = await checkRateLimit('user-B', 'anonymous');
      expect(resultB.allowed).toBe(true);
      expect(resultB.remaining).toBe(4);
    });

    it('should use different limits for different roles', async () => {
      const adminResult = await checkRateLimit('admin-user', 'admin');
      expect(adminResult.remaining).toBe(99);

      const studentResult = await checkRateLimit('student-user', 'student');
      expect(studentResult.remaining).toBe(19);
    });

    it('should support agent-specific rate limiting', async () => {
      const userId = 'user-5';

      // Request for agent-1
      const result1 = await checkRateLimit(userId, 'anonymous', 'agent-1');
      expect(result1.remaining).toBe(4);

      // Request for agent-2 should have separate count
      const result2 = await checkRateLimit(userId, 'anonymous', 'agent-2');
      expect(result2.remaining).toBe(4);

      // Another request for agent-1 should decrement its count
      const result3 = await checkRateLimit(userId, 'anonymous', 'agent-1');
      expect(result3.remaining).toBe(3);
    });

    it('should reset after window expires', async () => {
      jest.useFakeTimers();

      const userId = 'user-6';

      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        await checkRateLimit(userId, 'anonymous');
      }

      // Should be blocked
      const blockedResult = await checkRateLimit(userId, 'anonymous');
      expect(blockedResult.allowed).toBe(false);

      // Advance time past the window
      jest.advanceTimersByTime(61000);

      // Should be allowed again
      const allowedResult = await checkRateLimit(userId, 'anonymous');
      expect(allowedResult.allowed).toBe(true);
      expect(allowedResult.remaining).toBe(4);

      jest.useRealTimers();
    });

    it('should return correct resetTime', async () => {
      const beforeTime = Date.now();
      const result = await checkRateLimit('user-7', 'admin');
      const afterTime = Date.now();

      // Reset time should be approximately 60 seconds from now
      expect(result.resetTime).toBeGreaterThanOrEqual(beforeTime + 60000);
      expect(result.resetTime).toBeLessThanOrEqual(afterTime + 60000 + 10);
    });

    it('should fall back to anonymous limits for unknown roles', async () => {
      // @ts-expect-error - Testing unknown role
      const result = await checkRateLimit('user-8', 'unknown-role');
      expect(result.remaining).toBe(4); // Anonymous limit - 1
    });
  });

  describe('resetRateLimit', () => {
    it('should reset rate limit for a user', async () => {
      const userId = 'user-reset-1';

      // Use up some requests
      for (let i = 0; i < 3; i++) {
        await checkRateLimit(userId, 'anonymous');
      }

      // Reset
      resetRateLimit(userId);

      // Should have full limit again
      const result = await checkRateLimit(userId, 'anonymous');
      expect(result.remaining).toBe(4); // Fresh count - 1
    });

    it('should reset rate limit for specific agent', async () => {
      const userId = 'user-reset-2';

      // Use up requests for agent-1
      for (let i = 0; i < 3; i++) {
        await checkRateLimit(userId, 'anonymous', 'agent-1');
      }

      // Also use some for agent-2
      await checkRateLimit(userId, 'anonymous', 'agent-2');

      // Reset only agent-1
      resetRateLimit(userId, 'agent-1');

      // Agent-1 should have full limit
      const result1 = await checkRateLimit(userId, 'anonymous', 'agent-1');
      expect(result1.remaining).toBe(4);

      // Agent-2 should still have reduced count
      const result2 = await checkRateLimit(userId, 'anonymous', 'agent-2');
      expect(result2.remaining).toBe(3); // 5 - 1 - 1
    });

    it('should be safe to call on non-existent entries', () => {
      // Should not throw
      expect(() => resetRateLimit('non-existent-user')).not.toThrow();
      expect(() => resetRateLimit('non-existent-user', 'agent-x')).not.toThrow();
    });
  });

  describe('clearAllRateLimits', () => {
    it('should clear all rate limits', async () => {
      // Create multiple entries
      await checkRateLimit('user-clear-1', 'admin');
      await checkRateLimit('user-clear-2', 'student');
      await checkRateLimit('user-clear-3', 'anonymous', 'agent-1');

      // Clear all
      clearAllRateLimits();

      // All should have fresh limits
      const result1 = await checkRateLimit('user-clear-1', 'admin');
      expect(result1.remaining).toBe(99);

      const result2 = await checkRateLimit('user-clear-2', 'student');
      expect(result2.remaining).toBe(19);

      const result3 = await checkRateLimit('user-clear-3', 'anonymous', 'agent-1');
      expect(result3.remaining).toBe(4);
    });

    it('should be safe to call when empty', () => {
      expect(() => clearAllRateLimits()).not.toThrow();
    });
  });

  describe('cleanupExpiredEntries', () => {
    it('should remove expired entries', async () => {
      jest.useFakeTimers();

      // Create entries
      await checkRateLimit('user-cleanup-1', 'anonymous');
      await checkRateLimit('user-cleanup-2', 'anonymous');

      // Advance time past window
      jest.advanceTimersByTime(61000);

      // Create a fresh entry (should not be cleaned up)
      await checkRateLimit('user-cleanup-3', 'anonymous');

      // Run cleanup
      cleanupExpiredEntries();

      // Old entries should be cleared (fresh start)
      const result1 = await checkRateLimit('user-cleanup-1', 'anonymous');
      expect(result1.remaining).toBe(4); // Fresh

      // New entry should still have count
      const result3 = await checkRateLimit('user-cleanup-3', 'anonymous');
      expect(result3.remaining).toBe(3); // Already had 1, now 2

      jest.useRealTimers();
    });

    it('should be safe to call when empty', () => {
      clearAllRateLimits();
      expect(() => cleanupExpiredEntries()).not.toThrow();
    });
  });

  describe('Rate Limit Edge Cases', () => {
    it('should handle concurrent requests correctly', async () => {
      const userId = 'concurrent-user';

      // Make multiple concurrent requests
      const promises = Array(5)
        .fill(null)
        .map(() => checkRateLimit(userId, 'anonymous'));

      const results = await Promise.all(promises);

      // All should be allowed but with decreasing remaining counts
      expect(results.every((r) => r.allowed)).toBe(true);
      expect(results[results.length - 1].remaining).toBe(0);

      // Next request should be blocked
      const blockedResult = await checkRateLimit(userId, 'anonymous');
      expect(blockedResult.allowed).toBe(false);
    });

    it('should handle empty userId', async () => {
      const result = await checkRateLimit('', 'anonymous');
      expect(result.allowed).toBe(true);
    });

    it('should handle special characters in userId', async () => {
      const specialUserId = 'user:with:colons@email.com';
      const result = await checkRateLimit(specialUserId, 'admin');
      expect(result.allowed).toBe(true);
    });

    it('should handle very long userIds', async () => {
      const longUserId = 'a'.repeat(1000);
      const result = await checkRateLimit(longUserId, 'admin');
      expect(result.allowed).toBe(true);
    });
  });

  describe('Role-based Limit Testing', () => {
    it('should allow admin to make 100 requests', async () => {
      const userId = 'admin-full-test';

      for (let i = 0; i < 100; i++) {
        const result = await checkRateLimit(userId, 'admin');
        expect(result.allowed).toBe(true);
      }

      // 101st should be blocked
      const blocked = await checkRateLimit(userId, 'admin');
      expect(blocked.allowed).toBe(false);
    });

    it('should allow teacher to make 50 requests', async () => {
      const userId = 'teacher-full-test';

      for (let i = 0; i < 50; i++) {
        const result = await checkRateLimit(userId, 'teacher');
        expect(result.allowed).toBe(true);
      }

      // 51st should be blocked
      const blocked = await checkRateLimit(userId, 'teacher');
      expect(blocked.allowed).toBe(false);
    });

    it('should allow student to make 20 requests', async () => {
      const userId = 'student-full-test';

      for (let i = 0; i < 20; i++) {
        const result = await checkRateLimit(userId, 'student');
        expect(result.allowed).toBe(true);
      }

      // 21st should be blocked
      const blocked = await checkRateLimit(userId, 'student');
      expect(blocked.allowed).toBe(false);
    });
  });
});
