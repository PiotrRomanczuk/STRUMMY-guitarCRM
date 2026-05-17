# Authentication Rate Limiting

Quick reference for using the authentication rate limiter.

## Quick Start

```typescript
import { checkAuthRateLimit } from '@/lib/auth/rate-limiter';

// In a Server Action
export async function myAuthAction(email: string) {
  const identifier = `${email}:${getClientIP()}`;
  const rateLimit = await checkAuthRateLimit(identifier, 'passwordReset');

  if (!rateLimit.allowed) {
    return {
      error: `Too many attempts. Try again in ${Math.ceil(rateLimit.retryAfter! / 60)} minutes.`,
      rateLimited: true
    };
  }

  // Proceed with action...
}
```

## Rate Limits

| Operation | Limit | Window |
|-----------|-------|--------|
| Password Reset | 5 | 1 hour |
| Login | 10 | 15 minutes |
| Signup | 3 | 1 hour |

## API Reference

### `checkAuthRateLimit(identifier, operation)`

Checks and increments rate limit counter.

**Parameters:**
- `identifier` - Unique string (typically `email:IP`)
- `operation` - One of: `'passwordReset'`, `'login'`, `'signup'`

**Returns:**
```typescript
{
  allowed: boolean;      // false if limit exceeded
  remaining: number;     // attempts left
  resetTime: number;     // Unix timestamp
  retryAfter?: number;   // seconds (only if blocked)
}
```

### `getAuthRateLimitStatus(identifier, operation)`

Check rate limit without incrementing counter.

### `resetAuthRateLimit(identifier, operation)`

Clear rate limit for identifier (useful after successful verification).

## Best Practices

1. **Always combine email + IP** for identifier
2. **Check rate limit BEFORE expensive operations** (DB queries, API calls)
3. **Log rate limit violations** for security monitoring
4. **Use friendly error messages** - don't reveal system internals
5. **Don't leak information** - same behavior for valid/invalid data

## Example: Password Reset

```typescript
import { checkAuthRateLimit } from '@/lib/auth/rate-limiter';
import { headers } from 'next/headers';

async function getClientIdentifier(email: string): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0].trim() ||
             headersList.get('x-real-ip') ||
             'unknown';
  return `${email}:${ip}`;
}

export async function resetPassword(email: string) {
  // Rate limiting
  const identifier = await getClientIdentifier(email);
  const rateLimit = await checkAuthRateLimit(identifier, 'passwordReset');

  if (!rateLimit.allowed) {
    const minutes = Math.ceil(rateLimit.retryAfter! / 60);
    console.warn(`[Auth] Rate limit exceeded: ${email}`);
    return {
      error: `Too many password reset attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`,
      rateLimited: true
    };
  }

  console.log(`[Auth] Rate limit OK: ${rateLimit.remaining} remaining`);

  // Proceed with password reset
  // ...
}
```

## Testing

```typescript
import {
  checkAuthRateLimit,
  clearAllAuthRateLimits
} from '@/lib/auth/rate-limiter';

describe('My Auth Test', () => {
  beforeEach(() => {
    clearAllAuthRateLimits(); // Clean state
  });

  it('should enforce rate limit', async () => {
    const id = 'test@example.com:127.0.0.1';

    // Make 5 attempts
    for (let i = 0; i < 5; i++) {
      const result = await checkAuthRateLimit(id, 'passwordReset');
      expect(result.allowed).toBe(true);
    }

    // 6th should fail
    const blocked = await checkAuthRateLimit(id, 'passwordReset');
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });
});
```

## Troubleshooting

**Problem:** Rate limit not working

```typescript
// Debug IP extraction
const headersList = await headers();
console.log('Headers:', {
  forwarded: headersList.get('x-forwarded-for'),
  realIp: headersList.get('x-real-ip')
});
```

**Problem:** False positives

- Review identifier strategy
- Check reverse proxy configuration
- Consider CAPTCHA for edge cases

**Problem:** Performance issues

- Check cleanup is running
- Monitor memory usage
- Consider Redis for high traffic

## Production Notes

- Current implementation: In-memory (single server)
- For multi-server: Use Redis or database
- See `/docs/2026-02-09-RATE_LIMITING.md` for scaling guide

## Related Files

- Implementation: `/lib/auth/rate-limiter.ts`
- Tests: `/lib/auth/rate-limiter.test.ts`
- Integration: `/app/auth/actions.ts`
- Documentation: `/docs/2026-02-09-RATE_LIMITING.md`
- E2E Tests: `/tests/e2e/security/password-reset-rate-limit.spec.ts`

## Support

- Linear Issue: BMS-29
- Security Questions: Contact security team
- Implementation Questions: See full documentation in `/docs/2026-02-09-RATE_LIMITING.md`
