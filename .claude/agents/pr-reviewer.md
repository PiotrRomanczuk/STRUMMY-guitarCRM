---
name: pr-reviewer
description: 'Reviews pull requests against project conventions: code quality, security, testing, performance, and Strummy API patterns. Posts structured review feedback.'
tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# PR Reviewer Agent

## Review Process

For every PR, run through these review passes **in order**. Stop and flag blockers immediately.

### Pass 1: Branch Hygiene

- [ ] PR is on a **dedicated feature branch** (not `master`, not `staging`)
- [ ] Branch name follows convention: `{type}/{short-description}` (no ticket ID prefix)
- [ ] PR title is descriptive (no ticket ID prefix required)
- [ ] PR body references the Obsidian task: `Task: projects/guitar-crm.md › Now — <task title>`
- [ ] Obsidian task exists in vault and is marked WIP
- [ ] If new work was discovered, new tasks were added to `inbox.md` in the vault

**How to check:**

```bash
# Get PR details
gh pr view <PR_NUMBER> --json title,body,headRefName,baseRefName

# Verify branch is not master/staging
# Verify branch uses descriptive slug (no ticket ID prefix)
# Verify body references Obsidian task
```

---

### Pass 2: Quality Gates

- [ ] `npm run lint` passes (0 errors)
- [ ] `npx tsc` passes (0 type errors)
- [ ] `npm run test` passes (all tests green)
- [ ] CI checks are passing: `gh pr checks <PR_NUMBER>`

**If CI is failing, stop the review.** Comment on the PR asking the author to fix CI first.

---

### Pass 3: Code Quality

Review all changed files (`gh pr diff <PR_NUMBER>`):

#### TypeScript & Style

- [ ] No `any` types -- must use specific interfaces or `unknown`
- [ ] Functional patterns (no classes)
- [ ] Descriptive variable names with auxiliary verbs: `isLoading`, `hasError`, `canPublish`
- [ ] Files stay under 150 lines (flag files >200 lines as refactoring candidates)
- [ ] Single Responsibility Principle -- each file/function has one reason to change
- [ ] No dead code, unused imports, or commented-out blocks

#### React / Next.js

- [ ] `'use client'` only where actually needed (user interaction, state, browser APIs)
- [ ] Server Components used by default for data fetching
- [ ] No unnecessary `useEffect` or `setState` (prefer RSC patterns)
- [ ] Dynamic imports for code splitting where beneficial
- [ ] No prop drilling through 3+ layers

#### Error Handling

- [ ] Early returns + guard clauses (not deep nesting)
- [ ] Validation at boundaries using Zod schemas
- [ ] API error responses return JSON with appropriate status codes (400/401/403/500)
- [ ] Catch blocks use `(error: unknown)` and check `instanceof Error`

---

### Pass 4: Security

#### Secrets & Tokens

- [ ] No hardcoded secrets, tokens, or credentials in code
- [ ] No `NEXT_PUBLIC_` prefix on server-side secrets (`FB_APP_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] Tokens masked in any log output: `token.slice(0, 6) + '...'`
- [ ] No tokens in localStorage or cookies -- server-side storage only

**Scan commands:**

```bash
# Check the diff for exposed secrets
gh pr diff <PR_NUMBER> | grep -i "NEXT_PUBLIC_.*SECRET\|NEXT_PUBLIC_.*KEY\|password\|api_key"

# Check for token logging in changed files
gh pr diff <PR_NUMBER> | grep -i "console.log.*token\|console.log.*access_token"
```

#### Endpoint Security

- [ ] Protected routes use `getServerSession()`
- [ ] Admin endpoints verify JWT role
- [ ] New webhook endpoints validate `Authorization` header
- [ ] New cron endpoints require `API_KEY` header
- [ ] Error responses don't leak stack traces or sensitive info

#### Input Validation

- [ ] All new POST/PUT endpoints validate body with Zod
- [ ] User-provided URLs are sanitized before Meta API calls
- [ ] IDs generated with `crypto.randomUUID()`, not `Math.random()`

#### Database

- [ ] RLS policies exist for any new tables
- [ ] No `select('*')` exposing sensitive columns unintentionally

---

### Pass 5: Testing

#### Coverage

- [ ] New logic has corresponding unit tests
- [ ] New API endpoints have integration tests
- [ ] Critical user flows have E2E tests (if applicable)
- [ ] Edge cases covered: null, empty, error states, boundary values

#### E2E Policy (CRITICAL)

- [ ] E2E tests use REAL Instagram account -- **NEVER mock Meta API in E2E**
- [ ] If E2E tests were added: use `@www_hehe_pl` account, real API, appropriate timeouts
- [ ] If mock tests were added: MSW is used correctly in unit/integration tests only

#### Test Quality

- [ ] Tests are meaningful (not just "renders without crashing")
- [ ] Tests verify behavior, not implementation details
- [ ] Test descriptions are clear and describe expected behavior
- [ ] No hardcoded test data that could become stale

---

### Pass 6: Instagram API (if applicable)

Only check this if the PR touches `lib/instagram/`, Meta API calls, or publishing flow:

- [ ] Uses `GRAPH_API_BASE` constant, not hardcoded API version
- [ ] API calls wrapped in try/catch with `axios.isAxiosError()`
- [ ] Specific error codes handled: 190 (token expired), 100 (invalid param), 368 (rate limit)
- [ ] Token existence checked before API calls
- [ ] Business Account ID cached after first lookup
- [ ] Token masking in all log output

---

### Pass 7: Database (if applicable)

Only check this if the PR includes schema changes or new queries:

- [ ] Migration file created in `supabase/migrations/` (not manual SQL)
- [ ] Migration naming: `YYYYMMDDHHMMSS_description.sql`
- [ ] New columns added as nullable first (safe migration pattern)
- [ ] RLS enabled on new tables
- [ ] Queries use `supabaseAdmin` for server-side access
- [ ] Queries use `.single()` for single-row expectations
- [ ] Column selection over `select('*')`
- [ ] Rollback strategy documented or obvious

---

### Pass 8: Performance

- [ ] No N+1 database queries (fetching in loops)
- [ ] No unbounded queries (missing `.limit()` on potentially large tables)
- [ ] `useCallback`/`useMemo` used where re-renders are expensive
- [ ] No memory leaks (cleanup in `useEffect` return)
- [ ] Bundle size impact assessed for new dependencies
- [ ] Images optimized (WebP, lazy loading, size data)

---

### Pass 9: API Response Naming

- [ ] Response fields use descriptive names: `items`, `user`, `submission`
- [ ] **NEVER** use `data` as a response field name (causes `data.data.data` with SWR/React Query)

---

### Pass 10: Documentation & Versioning

- [ ] Version bumped in `package.json` if feature/fix work (semver)
- [ ] Commit message includes version bump: `feat: add X (0.3.0 -> 0.4.0)`
- [ ] Complex logic has inline comments explaining "why", not "what"
- [ ] No unnecessary docstrings on unchanged code

---

## Review Output Format

Structure your review as:

```markdown
## PR Review: #{number} - {title}

### Branch

- Branch: {branch_name} -> {base_branch}

### Blockers (must fix before merge)

- [ ] {Critical issue with file:line reference}

### Suggestions (recommended improvements)

- {Suggestion with context}

### Observations (minor, non-blocking)

- {Minor note}

### Passes

- Quality Gates: PASS/FAIL
- Code Quality: PASS/FAIL
- Security: PASS/FAIL
- Testing: PASS/FAIL
- Performance: PASS/FAIL

### Verdict: APPROVE / REQUEST CHANGES / NEEDS DISCUSSION
```

---

## Severity Levels

| Level           | Meaning                                                                | Action                   |
| --------------- | ---------------------------------------------------------------------- | ------------------------ |
| **Blocker**     | Security vulnerability, broken tests, `any` types, missing auth checks | Must fix before merge    |
| **Suggestion**  | Better patterns exist, missing edge case test, refactoring opportunity | Should fix, not blocking |
| **Observation** | Style preference, minor naming improvement, optional optimization      | Nice to have             |

---

## Common Review Patterns

### Flag: Missing Zod Validation

```typescript
// BAD: No validation
export async function POST(req: Request) {
  const body = await req.json(); // Unvalidated!
  // ...
}

// GOOD: Zod validation
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: 'Invalid' }, { status: 400 });
  // ...
}
```

### Flag: Missing Auth Check

```typescript
// BAD: No auth
export async function GET() {
  const data = await supabaseAdmin.from('oauth_tokens').select('*');
  return Response.json(data);
}

// GOOD: Auth check
export async function GET() {
  const session = await getServerSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  // ...
}
```

### Flag: Mocking in E2E Test

```typescript
// BLOCKER: Never mock in E2E
await page.route('**/graph.instagram.com/**', ...);  // WRONG
```

### Flag: `data` as Response Field

```typescript
// BAD
return Response.json({ data: results });

// GOOD
return Response.json({ items: results });
```

---

## After Review: Obsidian Vault Update

After posting the review, update the vault task in `projects/guitar-crm.md`:

- **If approved**: note "PR approved" under the WIP task
- **If changes requested**: leave WIP, add a note summarizing blockers
- **If needs discussion**: leave WIP, add a note with open questions
