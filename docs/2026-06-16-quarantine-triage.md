# Quarantine Triage — Phase 0.6

**Date**: 2026-06-16
**Branch**: `feature/STRUM-p0-quarantine-triage`
**Scope**: Reduce the 51-entry Jest quarantine block in `jest.config.ts` to only genuinely broken tests. Part of Phase 0.6 "Restore CI Signal" (docs/specs/00-phase-0-restore-truth.md §0.6).

---

## Phase 0 Progress (this session)

| Sub-spec                          | Status          | Commit/PR                                        |
| --------------------------------- | --------------- | ------------------------------------------------ |
| 0.1 — Prod schema catch-up        | ✅ done         | prod_catchup_20260616.sql applied directly       |
| 0.2 — Migration history reconcile | ✅ done         | 154 local versions → remote; archive stray files |
| 0.3 — Bearer auth consolidation   | ✅ already done | PR #459                                          |
| 0.4 — Fix 500-ing crons           | ✅ done         | PR #476 merged                                   |
| 0.5 — security_invoker view       | ✅ done         | PR #476 merged                                   |
| 0.6 — no-explicit-any: error      | ✅ done         | PR #476 merged                                   |
| 0.6 — quarantine triage           | 🔄 in progress  | `feature/STRUM-p0-quarantine-triage`             |

---

## Triage Results

Ran all 51 quarantined files via `jest.triage.config.ts` (strips the quarantine list). Found:

- **35 unique failing** files
- **11 missing** from disk (dead quarantine entries)
- **4 already passing** (wrongly quarantined)
- **3 newly-discovered failures** not yet in quarantine list

---

## TODO — Immediate (quick wins)

### 1. Remove dead entries from quarantine (11 missing files)

These files no longer exist on disk — remove from `testPathIgnorePatterns`:

```
__tests__/components/auth/SignUpForm.test.tsx
__tests__/components/dashboard/calendar/CalendarEventsList.test.tsx
__tests__/components/dashboard/calendar/ConnectGoogleButton.test.tsx
__tests__/components/dashboard/SyncCalendarModal.test.tsx
__tests__/dashboard/songs/page.test.tsx
__tests__/dashboard/users/page.test.tsx
__tests__/database/shadow-user-linking.test.ts
__tests__/lib/auth/rate-limiter.test.ts        ← moved to lib/auth/rate-limiter.test.ts (PASSES)
__tests__/lib/google.test.ts                   ← moved to lib/google.test.ts (PASSES)
app/dashboard/users/page.test.tsx
components/lessons/list/LessonList.test.tsx
```

### 2. Remove already-passing entries from quarantine (4 files)

These pass cleanly — remove from `testPathIgnorePatterns` so they run in CI:

```
components/auth/ForgotPasswordForm.test.tsx
components/auth/ResetPasswordForm.test.tsx
components/auth/SignInForm.test.tsx
components/auth/SignUpForm.test.tsx
```

### 3. Add `lucide-react` to `transformIgnorePatterns` — jest.config.ts line 172

Change:

```ts
'node_modules/(?!(node-fetch|data-uri-to-buffer|fetch-blob|formdata-polyfill)/)',
```

To:

```ts
'node_modules/(?!(node-fetch|data-uri-to-buffer|fetch-blob|formdata-polyfill|lucide-react)/)',
```

This unblocks 4 component tests whose only failure is `SyntaxError: Unexpected token 'export'` from lucide-react's ESM build:

- `components/dashboard/Dashboard.test.tsx`
- `components/lessons/form/LessonForm.test.tsx`
- `components/assignments/form/AssignmentForm.test.tsx`
- `components/songs/form/SongForm.test.tsx`

After adding to transform, verify each passes, then remove from quarantine.

### 4. Fix `__tests__/lib/auth/cron-auth.test.ts` — Request.headers undefined

Root cause: `new Request(url, { headers })` in JSDOM doesn't expose `headers` properly.

Fix `makeRequest()` in the test:

```ts
function makeRequest(authHeader?: string): Request {
  return {
    headers: {
      get: (name: string) => (name === 'authorization' ? (authHeader ?? null) : null),
    },
  } as unknown as Request;
}
```

After fix, remove from quarantine.

### 5. Add 3 newly-discovered failures to quarantine

These files exist, are in `testMatch`, but are NOT in the quarantine list — they've been silently failing:

```
__tests__/components/profile/ProfileComponents.test.tsx   ← Cannot find module (component moved/deleted)
__tests__/components/profile/ProfileFormFields.test.tsx   ← Cannot find module (component moved/deleted)
lib/__tests__/spotify-error-handling.test.ts              ← Circuit breaker test exceeds 5000ms timeout
```

Add to the quarantine block with a comment explaining why.

---

## TODO — Medium (fix or delete)

### 6. `__tests__/lib/getUserWithRolesSSR.test.ts` and `__tests__/utils/getUserRolesSSR.test.ts`

Root cause: `getUserWithRolesSSR` return shape changed; tests assert old shape.

Options:

- Read the current `lib/getUserWithRolesSSR.ts` return type, update `toEqual({...})` assertions
- Or delete both files (functionality is tested in `lib/getUserWithRolesSSR.test.ts` which PASSES)

### 7. Sign-in / sign-up page tests

- `app/(auth)/sign-in/page.test.tsx`
- `app/(auth)/sign-up/page.test.tsx`

Root cause: `useSearchParams()` from `next/navigation` returns `undefined` (hook not mocked).

Fix: add to `jest.setup.js`:

```ts
jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/',
  redirect: jest.fn(),
}));
```

(Check if `next/navigation` mock is already partially set up — avoid duplicate mock.)

### 8. `__tests__/components/admin/index.test.tsx`

Unknown failure — investigate before fixing or deleting.

---

## TODO — Large / §3.3 Work (stay quarantined)

These 14 files all fail with the same root cause: **withApiAuth mock drift**. The `withApiAuth` wrapper was introduced after these tests were written. Tests mock `createClient()` but don't mock `authenticateRequest()` / the profiles fetch that `withApiAuth` does, so all handlers return 403 before the test logic runs.

Fix pattern (per file): add

```ts
jest.mock('@/lib/auth/withApiAuth', () => ({
  withApiAuth: jest.fn((request, handler) =>
    handler({
      user: { id: 'mock-user-id' },
      profile: { id: 'mock-user-id', is_admin: true, ... },
      roles: { isAdmin: true, isTeacher: false, isStudent: false },
    })
  ),
}));
```

**Files (14):**

```
__tests__/api/lessons/[id]/route.test.ts
__tests__/api/lessons/bulk/route.test.ts
__tests__/api/lessons/route.test.ts
__tests__/api/notifications/unsubscribe.test.ts
__tests__/api/song/handlers.test.ts
app/api/admin/lessons/route.test.ts
app/api/admin/users/route.test.ts
app/api/lessons/[id]/route.test.ts
app/api/lessons/bulk/route.test.ts
app/api/lessons/route.test.ts
app/api/lessons/search/route.test.ts
app/api/notifications/unsubscribe/__tests__/route.test.ts
app/api/song/handlers.test.ts
app/dashboard/assignments/page.test.tsx
```

Note: many of these have a DUPLICATE pattern — both `__tests__/api/...` and `app/api/...` paths exist for the same route. Once withApiAuth mock is fixed, consolidate to co-located only and delete the `__tests__/api/` copies.

**Spotify tests (5 — separate issue):**

```
app/api/spotify/features/route.test.ts
app/api/spotify/matches/approve/route.test.ts
app/api/spotify/matches/reject/route.test.ts
app/api/spotify/search/route.test.ts
app/api/spotify/sync/route.test.ts
```

Root cause: `cookies()` called outside Next.js request scope. Needs `next/headers` mock.

**Other component tests (4):**

```
app/dashboard/songs/page.test.tsx
components/assignments/shared/__tests__/AssignmentStatusActions.test.tsx
components/dashboard/admin/SongStatsTable.test.tsx
components/dashboard/calendar/CalendarEventsList.test.tsx
components/lessons/hooks/__tests__/useStudentSongProgress.test.ts
```

---

## Done-When

Phase 0.6 quarantine triage is complete when:

- [ ] Dead/passing entries removed from quarantine (items 1–2)
- [ ] `lucide-react` added to transform; 4 component tests pass and removed from quarantine (item 3)
- [ ] `cron-auth.test.ts` fixed and removed from quarantine (item 4)
- [ ] 3 new failures added to quarantine with root-cause comments (item 5)
- [ ] `jest.triage.config.ts` deleted (temp file, not needed after triage)
- [ ] PR open on `feature/STRUM-p0-quarantine-triage`

Remaining quarantine entries (§3.3) are tracked in `tasks/test-coverage-analysis.md`.
