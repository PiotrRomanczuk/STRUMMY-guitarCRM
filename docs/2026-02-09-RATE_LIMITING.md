# Rate Limiting

This document describes the rate limiting implementation for authentication endpoints in the Strummy application.

## Overview

Rate limiting is implemented to prevent abuse and brute force attacks on security-sensitive endpoints, particularly password reset functionality. The system uses an in-memory rate limiter that tracks requests per identifier (email + IP address combination).

## Implementation

### Architecture

- **Location**: `/lib/auth/rate-limiter.ts`
- **Storage**: In-memory Map (consider Redis for production with multiple servers)
- **Identifier**: Combination of email address and IP address
- **Cleanup**: Automatic cleanup of expired entries every 10 minutes

### Rate Limits

| Operation | Max Attempts | Time Window |
|-----------|--------------|-------------|
| Password Reset | 5 | 1 hour |
| Login | 10 | 15 minutes |
| Signup | 3 | 1 hour |

### Configuration

Rate limits are defined in `AUTH_RATE_LIMITS`:

```typescript
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
};
```

## Usage

### In Server Actions

```typescript
import { checkAuthRateLimit } from '@/lib/auth/rate-limiter';

export async function resetPassword(email: string) {
  // Get client identifier (email + IP)
  const identifier = await getClientIdentifier(email);

  // Check rate limit
  const rateLimit = await checkAuthRateLimit(identifier, 'passwordReset');

  if (!rateLimit.allowed) {
    const minutes = Math.ceil(rateLimit.retryAfter! / 60);
    return {
      error: `Too many password reset attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`,
      rateLimited: true,
      retryAfter: rateLimit.retryAfter
    };
  }

  // Proceed with password reset...
}
```

### API Functions

#### `checkAuthRateLimit(identifier, operation)`

Checks if a request should be rate limited.

**Parameters:**
- `identifier` (string): Unique identifier (typically email:IP combination)
- `operation` (string): Type of operation ('passwordReset', 'login', 'signup')

**Returns:**
```typescript
{
  allowed: boolean;      // Whether the request is allowed
  remaining: number;     // Remaining attempts
  resetTime: number;     // Timestamp when limit resets
  retryAfter?: number;   // Seconds until next attempt (if blocked)
}
```

#### `resetAuthRateLimit(identifier, operation)`

Manually resets the rate limit for an identifier. Useful after successful verification or for admin operations.

#### `getAuthRateLimitStatus(identifier, operation)`

Gets current rate limit status without incrementing the counter.

#### `clearAllAuthRateLimits()`

Clears all rate limit entries. Useful for testing.

## Security Features

### 1. IP + Email Tracking

Rate limits are tracked per combination of email address and IP address. This prevents:
- Single attacker from targeting multiple accounts from one IP
- Distributed attacks targeting a single account
- VPN/proxy-based attacks

### 2. Information Disclosure Prevention

The system **does not** reveal whether an email exists in the database. Rate limiting applies equally to:
- Valid email addresses
- Non-existent email addresses
- Malformed inputs (after validation)

This prevents attackers from using the password reset endpoint to enumerate valid email addresses.

### 3. Time-based Windows

Rate limits reset automatically after the time window expires, providing:
- Fair use for legitimate users
- Sustained protection against attacks
- No manual intervention required

## Error Messages

### User-Facing Messages

When rate limited, users see:
```
Too many password reset attempts. Please try again in X minute(s).
```

The message is intentionally generic and doesn't reveal:
- Whether the email exists
- How many attempts were made
- Technical details about rate limiting

### Server Logs

Server logs include detailed information for monitoring:
```
[Auth] Rate limit exceeded for password reset: user@example.com, retry after 3600s
```

## Testing

### Unit Tests

Located in `/lib/auth/rate-limiter.test.ts`:
- Rate limit enforcement (30 tests)
- Different operations tracking
- Cleanup and reset functionality
- Edge cases and security scenarios

### Integration Tests

Located in `/app/auth/__tests__/actions.test.ts`:
- Server Action integration (18 tests)
- IP address extraction
- Error handling
- Time window expiration

### E2E Tests

Located in `/tests/e2e/security/password-reset-rate-limit.spec.ts`:
- User experience testing
- Mobile responsiveness
- Multiple account testing
- Security verification

## Production Considerations

### Scaling

The current implementation uses in-memory storage, which works well for:
- Single-server deployments
- Development environments
- Small to medium traffic

For production with multiple servers, consider:

1. **Redis Implementation**
   ```typescript
   // Example Redis adapter
   import { Redis } from '@upstash/redis';

   const redis = new Redis({
     url: process.env.UPSTASH_REDIS_URL,
     token: process.env.UPSTASH_REDIS_TOKEN,
   });
   ```

2. **Database Implementation**
   - Store rate limit data in Supabase
   - Use PostgreSQL row-level security
   - Leverage database indexes for performance

3. **Edge Computing**
   - Implement rate limiting at CDN level (Cloudflare, Vercel Edge)
   - Reduce server load
   - Faster response times

### Monitoring

Monitor rate limiting metrics:

```typescript
// Example monitoring integration
import { track } from '@/lib/analytics';

if (!rateLimit.allowed) {
  track('rate_limit_exceeded', {
    operation: 'passwordReset',
    identifier: hashedIdentifier,
    timestamp: Date.now(),
  });
}
```

Key metrics to track:
- Number of rate limit violations
- Most targeted identifiers
- Peak times for rate limit hits
- Geographic distribution of violations

### IP Address Extraction

The system extracts IP addresses from headers in this order:
1. `x-forwarded-for` (first IP in comma-separated list)
2. `x-real-ip`
3. Falls back to `'unknown'`

Ensure your reverse proxy/load balancer properly sets these headers.

## Troubleshooting

### Rate Limit Not Working

1. Check headers are being passed correctly:
   ```typescript
   const headersList = await headers();
   console.log('x-forwarded-for:', headersList.get('x-forwarded-for'));
   ```

2. Verify rate limiter is being called:
   ```typescript
   console.log('Rate limit check:', rateLimit);
   ```

3. Check if cleanup is running:
   ```typescript
   cleanupExpiredAuthEntries();
   ```

### False Positives

If legitimate users are being rate limited:

1. Review rate limit thresholds
2. Check for misconfigured reverse proxies
3. Verify IP extraction logic
4. Consider implementing CAPTCHA for borderline cases

### Performance Issues

If rate limiting causes performance problems:

1. Profile the `checkAuthRateLimit` function
2. Consider caching rate limit checks
3. Implement batch cleanup
4. Move to Redis or distributed cache

## Future Enhancements

Potential improvements:

1. **Adaptive Rate Limiting**
   - Adjust limits based on user behavior
   - Stricter limits for suspicious patterns
   - More lenient for trusted users

2. **CAPTCHA Integration**
   - Show CAPTCHA after 3 failed attempts
   - Bypass rate limiting for verified CAPTCHA
   - Balance security and UX

3. **Account Lockout**
   - Temporary account lockout after many failures
   - Email notification to account owner
   - Admin unlock capability

4. **Geolocation-based Rules**
   - Different limits by region
   - Block/allow specific countries
   - Suspicious location detection

5. **Machine Learning**
   - Detect bot patterns
   - Anomaly detection
   - Automatic threat classification

## References

- [OWASP Rate Limiting Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)
- [Linear Issue BMS-29](https://linear.app/issue/BMS-29)
- Implementation PR: #[PR_NUMBER]

## Changelog

### 2026-02-09
- Initial implementation of password reset rate limiting
- 5 attempts per hour per email+IP combination
- Comprehensive test coverage (48 tests)
- E2E security tests
- Documentation
