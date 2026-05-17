---
name: test-journey
description: Analyze an E2E test plan doc, determine implementation status, split tests into integration (Jest) vs E2E (Playwright), fix code flaws found during analysis, implement the tests, and ship via /ship. Use when converting E2E journey docs into tested code.
---

# Test Journey Skill

Convert E2E test plan documents (`docs/e2e/*.md`) into real, working tests — splitting work between Jest integration tests (preferred) and Playwright E2E tests (when browser is required).

## Invocation

```
/test-journey docs/e2e/2026-02-28-02-teacher-lessons.md
```

The argument is the path to a `docs/e2e/*.md` file. If omitted, list available docs and prompt the user to pick one:

```bash
ls docs/e2e/*.md
```

## Workflow

Execute these 7 phases sequentially. Print a header for each phase. If a phase fails, stop and report — do NOT skip ahead.

---

### Phase 1: Parse the Doc File

Read the specified `docs/e2e/*.md` file. Extract and print a summary table:

| # | Journey | Priority | Role | Pages | Steps | Edge Cases |
|---|---------|----------|------|-------|-------|------------|

Also extract:
- **Design Decisions** — known bugs, broken features, prerequisites
- **Preconditions** — what must exist in DB before tests run
- **Prerequisites** — missing `data-testid` attributes, bug tickets to file

---

### Phase 2: Discover Implementation

For each journey, find the relevant source files. Search these locations:

| Pattern | What to find |
|---------|-------------|
| `app/api/{resource}/handlers.ts` | Pure handler functions (best for integration tests) |
| `app/api/{resource}/route.ts` | Route handlers (GET/POST/PUT/DELETE) |
| `app/api/{resource}/export/route.ts` | Export endpoints |
| `app/actions/*.ts` | Server actions |
| `components/{domain}/**/*.tsx` | UI components |
| `schemas/*.ts` | Zod validation schemas |

Check what tests already exist:

| Pattern | Layer |
|---------|-------|
| `__tests__/api/{resource}/**/*.test.ts` | Unit tests |
| `__tests__/**/*.integration.test.ts` | Integration tests |
| `tests/e2e/**/*.spec.ts` | E2E tests |

Print implementation status:

```
Source files found:
  [x] app/api/song/handlers.ts (14 exported functions)
  [x] app/api/song/route.ts
  [ ] app/api/song/export/route.ts (MISSING)

Existing tests:
  [x] __tests__/api/song/handlers.test.ts (unit)
  [ ] __tests__/api/song/handlers.integration.test.ts (NONE)
  [x] tests/e2e/songs/song-crud.spec.ts (E2E)
```

---

### Phase 3: Triage — Integration vs E2E

Apply these rules to each step/scenario from the doc:

| Condition | Test Layer | Reasoning |
|-----------|-----------|-----------|
| Pure handler function exists (dependency-injected supabase, user, profile) | **Integration** (Jest) | Direct function call, no browser needed |
| Server action with DB logic | **Integration** (Jest) | Mock `createClient`, test logic |
| Route handler (GET/POST/PUT/DELETE) | **Integration** (Jest) | Mock deps, call handler directly |
| UI-only behavior (wizard steps, animations, responsive layout, navigation) | **E2E** (Playwright) | Requires browser rendering |
| Auth cookie/session flows | **E2E** (Playwright) | Requires real auth stack |
| Cross-page navigation with state | **E2E** (Playwright) | Requires browser routing |
| External service integration (Google, Spotify) | **Integration** (Jest) | Mock the external API |

Print the decision matrix:

```
Step 1 — Navigate to songs list .............. E2E (navigation)
Step 2 — Search songs ........................ Integration (handler: getSongs with ilike filter)
Step 3 — Create song (happy path) ........... Integration (handler: createSong)
Step 4 — Mobile wizard form .................. E2E (UI-specific rendering)
Step 5 — Duplicate detection on blur ......... Integration (handler: checkDuplicate)
...
```

Summarize the split:

```
Integration tests: 18 scenarios across 6 handlers
E2E tests: 4 scenarios (mobile wizard, navigation, drag-drop, auth)
Skipped: 2 scenarios (known bugs documented in Design Decisions)
```

---

### Phase 4: Fix Flaws

During Phase 2, note any issues found. Fix what's fixable:

**Fix immediately:**
- Missing `data-testid` attributes needed for E2E tests
- Handler bugs documented in the doc's "Design Decisions"
- Schema mismatches between doc expectations and actual Zod schemas
- Missing validation or error handling in handlers

**Document for separate ticket (do NOT fix):**
- Architectural issues requiring multi-file refactors
- Features that are intentionally incomplete
- Third-party service bugs

Print a summary:

```
Fixed:
  - Added data-testid="song-search" to SongFilter.tsx
  - Fixed tiktok_short_url mapping in helpers.ts

Needs separate ticket:
  - "Show Drafts" filter server-side query not implemented (STRUM-XXX)
```

If nothing needs fixing, print "No flaws found" and move on.

---

### Phase 5: Implement Integration Tests

For each journey assigned to integration testing, create test files following the established pattern.

#### File location

```
__tests__/api/{resource}/{name}.integration.test.ts
```

#### Pattern to follow

Use helpers from `lib/testing/integration-helpers.ts`:

```typescript
import {
  createMockQueryBuilder,
  createMockAuthContext,
  createMockSupabaseClient,
  createMockNextRequest,
  MOCK_DATA_IDS,
} from '@/lib/testing/integration-helpers';
```

#### Test structure

```typescript
describe('Resource Handler (Journey N)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handlerFunctionName', () => {
    // Auth tests (401/403)
    it('returns 401 when user is not authenticated', async () => { ... });
    it('returns 403 when user lacks required role', async () => { ... });

    // Validation tests (422)
    it('returns 422 when required fields are missing', async () => { ... });

    // Happy path
    it('returns songs filtered by search term', async () => { ... });

    // Edge cases
    it('handles empty result set', async () => { ... });

    // Error handling (500)
    it('returns 500 when database query fails', async () => { ... });
  });
});
```

#### Key conventions

1. **Import handler functions directly** — don't test through HTTP
2. **Build custom `buildQueryBuilder`** if the handler uses chained queries with specific methods
3. **Mock `next/server`** with local classes if the route uses `new NextResponse()` constructor
4. **Test categories**: auth (401/403), validation (422), happy path, edge cases, error handling (500)
5. **Delete fake/placeholder tests** that only assert hardcoded objects — they provide no value
6. **Use `MOCK_DATA_IDS`** for consistent test data UUIDs

#### Run tests after implementing

```bash
npm run test:integration -- --testPathPattern="{resource}"
```

If tests fail, fix them before proceeding. Max 3 fix attempts per test file. If still failing after 3 attempts, skip and document the failure.

---

### Phase 6: Implement E2E Tests (if any)

For journey steps assigned to E2E:

1. Check if a spec file exists in `tests/e2e/`
2. Add tests to existing spec or create new one
3. Follow Playwright conventions:
   - `test.describe` for grouping
   - `test.beforeEach` for auth setup
   - Use `data-testid` selectors (add them in Phase 4 if missing)
4. Add missing `data-testid` attributes to components
5. Run `npx playwright test {spec}` to verify

**HARD LIMIT: Max 10 E2E tests per feature** (from project CLAUDE.md). If the doc calls for more, move excess scenarios to integration tests.

If no E2E tests are needed (everything covered by integration tests), print "No E2E tests needed — all scenarios covered at integration layer" and move on.

---

### Phase 7: Ship

1. **Update the doc file** — append a "Testing Strategy" section at the bottom:

```markdown
---

## Testing Strategy

> Auto-generated by `/test-journey` on YYYY-MM-DD

### Integration Tests (Jest)
| Test File | Scenarios | Status |
|-----------|-----------|--------|
| `__tests__/api/song/handlers.integration.test.ts` | 18 | Passing |

### E2E Tests (Playwright)
| Test File | Scenarios | Status |
|-----------|-----------|--------|
| `tests/e2e/songs/song-crud.spec.ts` | 4 | Passing |

### Skipped
| Scenario | Reason |
|----------|--------|
| Show Drafts filter | Known bug (STRUM-XXX) |
```

2. **Run quality gates** before shipping:

```bash
npm run lint && npx tsc && npm run test:integration
```

If any check fails, fix and retry (max 3 attempts). Do NOT proceed to ship if checks fail.

3. **Invoke `/ship`** to validate, test, push, and create PR.

---

## Error Handling

| Situation | Action |
|-----------|--------|
| Doc file not found | Print available files: `ls docs/e2e/*.md`. Ask user to pick one. |
| No handler file for resource | Skip integration tests for that resource. Note in output. Suggest E2E only. |
| Tests fail after implementation | Report failures with stack traces. Do NOT proceed to `/ship`. Fix first. |
| Lint/tsc fails | Fix and retry (max 3 attempts). Report if still failing. |
| Doc has no steps/journeys | Print warning: "Doc file appears empty or malformed." Ask user to verify. |

---

## Key Project Files

| File | Role |
|------|------|
| `docs/e2e/*.md` | Input — journey definitions |
| `app/api/{resource}/handlers.ts` | Target — pure handler functions (song, lessons, assignments) |
| `app/api/{resource}/route.ts` | Target — route handlers |
| `app/api/{resource}/export/route.ts` | Target — export endpoints |
| `app/actions/*.ts` | Target — server actions |
| `lib/testing/integration-helpers.ts` | Reuse — mock factories (`createMockQueryBuilder`, `createMockAuthContext`, `createMockSupabaseClient`, `createMockNextRequest`, `MOCK_DATA_IDS`) |
| `schemas/*.ts` | Reuse — Zod schemas for validation testing |
| `jest.config.integration.ts` | Config — integration test runner (`*.integration.test.ts` pattern) |
| `__tests__/**/*.integration.test.ts` | Reference — existing integration test patterns |

---

## Available E2E Doc Files

```
docs/e2e/01-teacher-songs.md        # Journeys 1-2: Song CRUD + Export
docs/e2e/2026-02-28-02-teacher-lessons.md      # (if exists) Lessons
docs/e2e/2026-02-28-03-teacher-calendar.md     # Calendar integration
docs/e2e/2026-02-28-04-teacher-assignments.md  # Assignments
docs/e2e/2026-02-28-05-teacher-integrations.md # External integrations
docs/e2e/2026-02-28-06-teacher-user-management.md # User management
docs/e2e/2026-02-28-07-teacher-ai.md           # AI features
docs/e2e/2026-02-28-08-teacher-exports.md      # Export workflows
docs/e2e/2026-02-28-09-student-journeys.md     # Student-side flows
docs/e2e/2026-02-28-10-cross-role.md           # Cross-role interactions
```
