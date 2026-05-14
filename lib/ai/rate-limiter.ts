/**
 * Rate Limiter for AI Agent Requests
 *
 * Supabase-backed implementation for correctness across Vercel Fluid Compute
 * instances. Falls back to in-memory if Supabase is unavailable.
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export interface RateLimiterConfig {
  maxRequests: number;
  windowMs: number;
}

export const DEFAULT_RATE_LIMITS: Record<string, RateLimiterConfig> = {
  admin: { maxRequests: 100, windowMs: 60_000 },
  teacher: { maxRequests: 50, windowMs: 60_000 },
  student: { maxRequests: 20, windowMs: 60_000 },
  anonymous: { maxRequests: 5, windowMs: 60_000 },
};

// Two-tier: per-agent ceiling and per-user aggregate ceiling
const USER_AGGREGATE_LIMITS: Record<string, number> = {
  admin: 300,
  teacher: 150,
  student: 60,
  anonymous: 15,
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  limit: number;
  message?: string;
}

// In-memory fallback for when Supabase is unavailable
const memoryStore = new Map<string, { count: number; resetTime: number }>();

interface RpcResult {
  count: number;
  reset_at: string;
}

async function incrementCounter(
  key: string,
  windowMs: number
): Promise<{ count: number; resetTime: number }> {
  try {
    const supabase = await createClient();

    const { data: rpcData, error: rpcError } = await supabase.rpc('increment_rate_limit', {
      p_key: key,
      p_window_ms: windowMs,
    });

    if (rpcError || rpcData == null) {
      throw new Error(`RPC failed: ${rpcError?.message ?? 'null response'}`);
    }

    const row = rpcData as RpcResult;
    return { count: row.count, resetTime: new Date(row.reset_at).getTime() };
  } catch (err) {
    logger.warn('[RateLimiter] Falling back to in-memory store:', { error: String(err) });

    // Fallback to in-memory
    const now = Date.now();
    const entry = memoryStore.get(key);
    if (!entry || now > entry.resetTime) {
      const newEntry = { count: 1, resetTime: now + windowMs };
      memoryStore.set(key, newEntry);
      return newEntry;
    }
    entry.count += 1;
    memoryStore.set(key, entry);
    return entry;
  }
}

export async function checkRateLimit(
  userId: string,
  userRole: 'admin' | 'teacher' | 'student' | 'anonymous',
  agentId?: string
): Promise<RateLimitResult> {
  const config = DEFAULT_RATE_LIMITS[userRole] ?? DEFAULT_RATE_LIMITS.anonymous;
  const agentKey = agentId ? `rl:${userId}:${agentId}` : `rl:${userId}`;
  const aggregateKey = `rl:${userId}:__aggregate`;
  const aggregateLimit = USER_AGGREGATE_LIMITS[userRole] ?? USER_AGGREGATE_LIMITS.anonymous;

  const [agentEntry, aggregateEntry] = await Promise.all([
    incrementCounter(agentKey, config.windowMs),
    incrementCounter(aggregateKey, config.windowMs),
  ]);

  const agentExceeded = agentEntry.count > config.maxRequests;
  const aggregateExceeded = aggregateEntry.count > aggregateLimit;

  if (agentExceeded || aggregateExceeded) {
    const resetTime = Math.max(agentEntry.resetTime, aggregateEntry.resetTime);
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
    const retryMsg = retryAfter < 60 ? `${retryAfter}s` : `${Math.ceil(retryAfter / 60)}m`;
    return {
      allowed: false,
      remaining: 0,
      resetTime,
      retryAfter,
      limit: agentExceeded ? config.maxRequests : aggregateLimit,
      message: `Rate limit exceeded. Retry in ${retryMsg}.`,
    };
  }

  const remaining = config.maxRequests - agentEntry.count;
  return {
    allowed: true,
    remaining,
    resetTime: agentEntry.resetTime,
    limit: config.maxRequests,
    message:
      remaining <= 5 ? `${remaining} request${remaining === 1 ? '' : 's'} remaining` : undefined,
  };
}

export function resetRateLimit(userId: string, agentId?: string): void {
  const key = agentId ? `rl:${userId}:${agentId}` : `rl:${userId}`;
  memoryStore.delete(key);
}

export function clearAllRateLimits(): void {
  memoryStore.clear();
}

export function getRateLimitStats() {
  return { limits: DEFAULT_RATE_LIMITS, activeMemoryBuckets: memoryStore.size };
}

// No-op stub: Supabase expiry is handled by the increment_rate_limit RPC window logic.
// Kept for test compatibility with the previous in-memory implementation.
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (now > entry.resetTime) memoryStore.delete(key);
  }
}
