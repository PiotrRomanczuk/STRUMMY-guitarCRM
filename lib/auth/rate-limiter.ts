/**
 * Rate Limiter for Authentication Operations — Supabase-backed
 *
 * Uses auth_rate_limits table via Supabase RPC to enforce rate limits.
 * Stateless per invocation — works correctly on Vercel serverless.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

/**
 * Rate limiter configuration
 */
export interface AuthRateLimiterConfig {
  maxAttempts: number;
  windowMs: number;
}

/**
 * Default rate limit configurations for auth operations
 */
export const AUTH_RATE_LIMITS = {
  passwordReset: {
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000, // 5 attempts per hour
  },
  login: {
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000, // 10 attempts per 15 minutes
  },
  signup: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 3 attempts per hour
  },
  resendEmail: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 3 attempts per hour
  },
} as const;

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Check if a request should be rate limited, then record the attempt.
 * Fails closed on DB errors (blocks request on error for security).
 */
export async function checkAuthRateLimit(
  identifier: string,
  operation: keyof typeof AUTH_RATE_LIMITS
): Promise<RateLimitResult> {
  const config = AUTH_RATE_LIMITS[operation];
  const now = Date.now();

  try {
    const supabase = createAdminClient();

    // Check current count
    const { data: count, error: countError } = await supabase.rpc(
      'check_auth_rate_limit' as never,
      { p_identifier: identifier, p_operation: operation, p_window_ms: config.windowMs } as never
    );

    if (countError) {
      // Fail closed — block on DB error for security
      logger.error('[RateLimit] DB error during rate limit check', countError);
      return { allowed: false, remaining: 0, resetTime: now + config.windowMs, retryAfter: 60 };
    }

    const currentCount = (count as number) ?? 0;

    // Record this attempt
    await supabase
      .from('auth_rate_limits' as never)
      .insert({ identifier, operation, attempted_at: new Date().toISOString() } as never);

    if (currentCount >= config.maxAttempts) {
      const retryAfter = Math.ceil(config.windowMs / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + config.windowMs,
        retryAfter,
      };
    }

    return {
      allowed: true,
      remaining: config.maxAttempts - currentCount - 1,
      resetTime: now + config.windowMs,
    };
  } catch (err) {
    // Fail closed — block on unexpected error for security
    logger.error('[RateLimit] Unexpected error during rate limit check:', err);
    return { allowed: false, remaining: 0, resetTime: now + config.windowMs, retryAfter: 60 };
  }
}

/**
 * Reset rate limit for a specific identifier and operation.
 * Useful for clearing limits after successful verification.
 */
export async function resetAuthRateLimit(
  identifier: string,
  operation: keyof typeof AUTH_RATE_LIMITS
): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase
      .from('auth_rate_limits' as never)
      .delete()
      .eq('identifier' as never, identifier as never)
      .eq('operation' as never, operation as never);
  } catch {
    // Best effort — don't block on cleanup failure
  }
}

/**
 * Clear all rate limit entries (useful for testing)
 */
export async function clearAllAuthRateLimits(): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase
      .from('auth_rate_limits' as never)
      .delete()
      .neq('id' as never, '00000000-0000-0000-0000-000000000000' as never);
  } catch {
    // Best effort
  }
}

/**
 * Clean up expired rate limit entries via DB function.
 * Called from the notification cron job.
 */
export async function cleanupExpiredAuthEntries(): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.rpc('cleanup_auth_rate_limits' as never);
  } catch {
    // Best effort — don't block cron on cleanup failure
  }
}
