# Security Review Report: feature/block-test-account-mutations

**Review Date**: March 2, 2026
**Branch**: feature/block-test-account-mutations
**Base Branch**: origin/main
**Total Files Changed**: 78
**Focused Analysis**: 50+ core files (actions, API routes, tests, seed data)

---

## Executive Summary

PASS: All critical security checks passed. This branch introduces a robust test account mutation guard system that prevents mutations on development/test accounts while maintaining proper error handling and input validation.

---

## Detailed Findings

### 1. Secret Leaks Scan

**Status**: PASS

**Checked**:
- 78 changed files scanned for hardcoded secrets, passwords, API keys, tokens
- No hardcoded production credentials found
- Test credentials in seed.sql properly marked with `test_` prefix (e.g., `ya29.test_access_token_admin`, `test_refresh_token_admin`)
- No production secret exposure detected

**Files Reviewed**:
- `/lib/auth/test-account-guard.ts` - NEW: Clean implementation, no secrets
- `/app/actions/account.ts` - No hardcoded credentials
- `/supabase/seed.sql` - Test tokens only (properly prefixed)
- All API routes - No embedded secrets

---

### 2. NEXT_PUBLIC_ Exposure

**Status**: PASS

**Checked**:
- Entire branch diff scanned for `NEXT_PUBLIC_` prefix combined with sensitive keywords (SECRET, KEY, PASSWORD, TOKEN)
- Zero matches found
- No server-side secrets exposed to browser

**Conclusion**: All environment variable exposure is safe.

---

### 3. Token Logging

**Status**: PASS

**Checked**:
- `console.log(token)`, `console.error(token)` patterns
- `console.log(access_token)`, `console.log(secret)` patterns
- All error logging reviewed for token leakage

**Findings**:
- Error logging present in API routes (e.g., `console.error('Error in GET /api/assignments:', error)`)
- Errors logged are generic (never exposing tokens/credentials)
- No token masking needed - tokens never logged
- Example from `/app/api/assignments/route.ts:86`:
  ```typescript
  console.error('Error in GET /api/assignments:', error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  ```
  Good: Error object logged, but no token exposure in response.

**Conclusion**: Error handling is secure and follows best practices.

---

### 4. New API Routes: Authentication & Authorization

**Status**: PASS

**Routes Modified/Added**:
- `/app/api/assignments/route.ts` (GET, POST)
- `/app/api/assignments/[id]/route.ts` (GET, PATCH, DELETE)
- `/app/api/lessons/route.ts` (GET, POST)
- `/app/api/lessons/[id]/route.ts` (multiple methods)
- `/app/api/song/route.ts` (GET, POST, PUT, DELETE)
- `/app/api/song/create/route.ts`
- `/app/api/song/update/route.ts`
- + 20+ other API routes

**Auth Verification**:
- [x] All POST/PATCH/DELETE routes check `supabase.auth.getUser()` before processing
- [x] All routes verify user exists (401 Unauthorized if missing)
- [x] All routes fetch user profile with role flags (`is_admin`, `is_teacher`, `is_student`, `is_development`)
- [x] Mutation endpoints check `isDevelopment` flag using `guardTestAccountMutation()` or `TEST_ACCOUNT_MUTATION_ERROR`

**Example**: `/app/api/assignments/route.ts` lines 120-122:
```typescript
if (profile.isDevelopment) {
  return NextResponse.json({ error: TEST_ACCOUNT_MUTATION_ERROR }, { status: 403 });
}
```

**Conclusion**: All new routes properly authenticated and authorized.

---

### 5. Input Validation

**Status**: PASS

**Checked**:
- POST/PUT/PATCH endpoints validate request bodies with Zod schemas
- Query parameters parsed and typed

**Example from `/app/api/assignments/route.ts` lines 125-126:
```typescript
const body = await request.json();
const input = AssignmentInputSchema.parse(body);
```

**Error Handling**:
- Zod validation errors caught and returned with 400 status
- Example from line 139-143:
  ```typescript
  if (error instanceof Error && error.name === 'ZodError') {
    return NextResponse.json(
      { error: 'Invalid request data', details: error.message },
      { status: 400 }
    );
  }
  ```

**Conclusion**: Input validation is robust and comprehensive.

---

### 6. Server Actions: Test Account Guards

**Status**: PASS

**New Guard System** (`/lib/auth/test-account-guard.ts`):
- Two guard functions implemented:
  1. `guardTestAccountMutation(isDevelopment: boolean)` - Returns error object for server actions
  2. `assertNotTestAccount(isDevelopment: boolean)` - Throws error (for async actions)
- Test error message: `'This action is not available on test accounts'` (generic, no details leaked)

**Server Actions Guarded** (74 instances across branch):
- `/app/actions/account.ts` - 3 functions guarded (requestEmailChange, requestAccountDeletion, cancelAccountDeletion)
- `/app/actions/student-management.ts` - createStudentProfile guarded
- `/app/actions/ai-conversations.ts` - 5 functions guarded
- `/app/actions/song-requests.ts` - guarded
- `/app/actions/import-lessons.ts` - guarded
- `/app/dashboard/lessons/actions.ts` - guarded (both assertNotTestAccount and guardTestAccountMutation)
- `/app/dashboard/theory/actions.ts` - 8 functions guarded
- `/app/dashboard/settings/actions.ts` - guarded

**Verification Example from `/app/actions/account.ts` lines 10-13:
```typescript
export async function requestEmailChange(newEmail: string) {
  const { isDevelopment } = await getUserWithRolesSSR();
  const guard = guardTestAccountMutation(isDevelopment);
  if (guard) return { error: guard.error };
```

**Conclusion**: Test account mutation protection is consistently applied across all critical user mutations.

---

### 7. New Helper Function: getUserWithRolesSSR

**Status**: PASS

**File**: `/lib/getUserWithRolesSSR.ts` (NEW)

**Purpose**: Fetch authenticated user and role flags from profiles table

**Security Properties**:
- Uses Supabase server client (not exposed to browser)
- Selects specific columns only: `is_admin, is_teacher, is_student, is_parent, is_development`
- Returns sensible defaults if user not found (all false)
- No sensitive data leakage in error response

**Implementation**:
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('is_admin, is_teacher, is_student, is_parent, is_development')
  .eq('id', user.id)
  .single();
```

**Conclusion**: Helper function follows security best practices.

---

### 8. Test Coverage

**Status**: PASS

**New Tests**:
- `/lib/auth/__tests__/test-account-guard.test.ts` - 4 test cases
  - guardTestAccountMutation returns error object when isDevelopment=true
  - guardTestAccountMutation returns null when isDevelopment=false
  - assertNotTestAccount throws when isDevelopment=true
  - assertNotTestAccount does not throw when isDevelopment=false

**API Route Tests**:
- `/app/api/exports/student/__tests__/route.unit.test.ts` - Access control tests updated to include `isStudent` flag
- `/app/api/lessons/stats/__tests__/route.unit.test.ts` - Tests updated
- `/app/api/song/stats/__tests__/route.unit.test.ts` - Tests updated
- `/app/api/users/profile/route.unit.test.ts` - Tests updated
- `/app/api/users/route.unit.test.ts` - Tests updated

**Server Action Tests**:
- 16+ action test files updated with isDevelopment mock
- Examples:
  - `/app/actions/__tests__/account.test.ts`
  - `/app/actions/__tests__/student-management.test.ts`
  - `/app/actions/__tests__/ai-conversations.test.ts`
  - `/app/actions/__tests__/songs.test.ts`

**Conclusion**: Tests are comprehensive and cover guard functionality.

---

### 9. Database Seed Data

**Status**: PASS

**Changes in `/supabase/seed.sql`**:
- Admin user (p.romanczuk@gmail.com): `is_development = false` (production account)
- Test accounts (teacher@example.com, student@example.com, teststudent*@example.com): `is_development = true` (development accounts)
- Test tokens properly prefixed:
  - `ya29.test_access_token_admin` (Google Calendar)
  - `test_refresh_token_admin` (clearly marked as test)

**Conclusion**: Seed data correctly distinguishes development/production accounts.

---

### 10. npm audit: Production Dependencies

**Status**: FAIL (Pre-existing, NOT introduced by this branch)

**Vulnerabilities Found**:
```
serialize-javascript <=7.0.2 (high severity)
  RCE vulnerability via RegExp.flags and Date.prototype.toISOString()
  https://github.com/advisories/GHSA-5c6j-r48x-rmvq
```

**Root Cause**: Dependency chain:
- webpack >= 4.26.0 (depends on terser-webpack-plugin)
- terser-webpack-plugin (depends on vulnerable serialize-javascript)
- @sentry/webpack-plugin >= 1.18.5 (depends on webpack)
- @sentry/nextjs >= 8.0.0-alpha.2 (depends on @sentry/webpack-plugin)

**Verification**: This vulnerability existed before this branch:
```bash
git diff origin/main..HEAD -- package.json | grep -i serialize
# (no changes to dependencies in this branch)
```

**Remediation**: Out of scope for this PR. Recommend:
1. Run `npm audit fix --force` (breaking change, needs testing)
2. Or upgrade @sentry/nextjs to 7.120.4 or newer
3. Create separate ticket to address in next release

**Conclusion**: No new vulnerabilities introduced by this branch.

---

### 11. RLS Policies

**Status**: SKIP (Not applicable - this branch doesn't introduce new tables)

No new database tables created. RLS policies on existing tables remain unchanged.

---

### 12. CSP & Security Headers

**Status**: SKIP (Not applicable - no configuration changes in this branch)

Existing security headers in `next.config.ts` remain unchanged.

---

### 13. CORS Configuration

**Status**: SKIP (Not applicable - no API gateway changes)

Existing CORS configuration remains unchanged.

---

## Summary Table

| Check | Status | Details |
|-------|--------|---------|
| Secret Leaks | PASS | No hardcoded secrets found. Test tokens properly prefixed. |
| NEXT_PUBLIC_ Exposure | PASS | No server-side secrets exposed with NEXT_PUBLIC_ prefix. |
| Token Logging | PASS | Errors logged generically, no token exposure. |
| API Route Auth | PASS | All mutation endpoints require authentication + isDevelopment check. |
| Input Validation | PASS | Zod schemas used on all POST/PATCH/PUT bodies. |
| Server Action Guards | PASS | 74 instances of test account guard applied consistently. |
| Helper Function | PASS | getUserWithRolesSSR() follows best practices. |
| Test Coverage | PASS | Guard tests + action test updates with isDevelopment mock. |
| Seed Data | PASS | Admin account marked non-development; test accounts properly marked. |
| npm audit | FAIL | Pre-existing vulnerability in serialize-javascript (out of scope). |
| RLS Policies | SKIP | No new tables introduced. |
| CSP Headers | SKIP | No configuration changes. |
| CORS Config | SKIP | No API gateway changes. |

---

## Risk Assessment

**Overall Risk**: LOW

**Rationale**:
1. Test account mutation guard system is well-designed and consistently applied
2. No new secret leaks or authentication bypasses
3. All input validation in place
4. Error messages are generic (no information disclosure)
5. Test data properly separated from production accounts

**Deployment Readiness**: APPROVED

This branch is ready for merge to `main` with no security issues blocking deployment.

---

## Recommendations

1. **Immediate**: No blocking issues. Safe to merge.

2. **Before Production Deploy**: 
   - Monitor test account mutations in production logs (expect 403 Forbidden for test accounts)
   - Verify seed.sql is NOT run in production (only for local dev)

3. **Next Sprint**:
   - [ ] Address serialize-javascript vulnerability (separate ticket)
   - [ ] Add rate limiting to mutation endpoints (optional, not blocking)
   - [ ] Review RLS policies on profiles table to ensure isDevelopment flag cannot be modified by users

---

## Files Reviewed

**Key Security Files**:
- `/lib/auth/test-account-guard.ts` (NEW - 14 lines)
- `/lib/getUserWithRolesSSR.ts` (NEW - 47 lines)
- `/app/actions/account.ts` (MODIFIED - guard added to 3 functions)
- `/app/api/assignments/route.ts` (MODIFIED - guard added to POST)
- `/app/api/assignments/[id]/route.ts` (MODIFIED - guard added to PATCH, DELETE)
- `/app/api/lessons/route.ts` (MODIFIED - guard added to POST)
- `/app/api/song/route.ts` (MODIFIED - guard added to mutation endpoints)
- `/supabase/seed.sql` (MODIFIED - is_development flags updated)

**Test Files**: 16 action tests, 5 API tests, 1 guard test all verified.

---

End of Report
