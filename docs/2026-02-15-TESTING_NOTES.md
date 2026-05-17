# Testing Notes

## API Route Testing Limitations

### Known Issue: Next.js `cookies()` Context

API route tests that call Next.js `cookies()` fail with:
```
`cookies` was called outside a request scope
```

This affects:
- `app/api/spotify/track-from-url/route.ts`
- Other API routes using `createClient()` from `@/lib/supabase/server`

### Current Testing Strategy

**✅ What's Tested:**
- Business logic unit tests (lib/api-keys.ts, lib/auth/api-auth.ts helpers)
- Component unit tests
- Integration tests with mocked Supabase
- E2E tests with Playwright

**❌ What's Not Tested:**
- API route handlers that use Next.js server context (cookies, headers)

### Future Work

To test API routes properly, we need:
1. Next.js test environment with request context
2. Mock the entire `next/headers` module
3. Or use E2E tests with real HTTP requests (Playwright)

See: https://nextjs.org/docs/messages/next-dynamic-api-wrong-context

## Test Coverage

Target: 70% coverage on new code
Current: Focus on business logic in /lib directory

## Running Tests

```bash
# Unit tests only
npm test

# Integration tests
npm run test:integration

# E2E tests
npx playwright test

# All tests
npm run test:all
```
