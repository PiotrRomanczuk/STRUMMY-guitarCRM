---
allowed-tools: Read, Edit, Write, Bash, Glob, Grep, Agent
argument-hint: [PR_NUMBER] [--scope quick|security|full] [--fix]
description: Review current branch or a PR for code quality, security, and project conventions
---

# Code Review

Review code changes and report findings: **$ARGUMENTS**

## Argument Parsing

Parse `$ARGUMENTS`:
- **No args**: Review current branch diff vs `origin/main`
- **PR number** (integer): Review that PR via `gh pr diff {number}`
- `--scope quick` — Code quality + security only (Passes 3+4)
- `--scope security` — Security only (Pass 4)
- `--scope full` — All 10 review passes **(default for standalone use)**
- `--fix` — Auto-fix issues after review (does NOT commit)

---

## Step 1: Gather Context

### Branch mode (no PR number)

```bash
git diff origin/main..HEAD --name-only    # changed files
git diff origin/main..HEAD               # full diff
git diff origin/main..HEAD --stat        # summary
```

### PR mode (PR number provided)

```bash
gh pr diff {number}                       # full diff
gh pr view {number} --json title,body,headRefName,files
```

Store the file list and diff for review.

---

## Step 2: Run Review Passes

### Quick scope (Passes 3+4)

**Pass 3 — Code Quality:**
- No `any` types — must use specific types or `unknown`
- Files under 200 LOC (warn at 150+, flag at 200+)
- No dead code, unused imports, or commented-out blocks
- Early returns and guard clauses (no deep nesting)
- Server Components by default; `'use client'` only where needed
- Minimal `useEffect` — prefer RSC patterns
- Descriptive names with auxiliary verbs: `isLoading`, `hasError`
- Validation at boundaries using Zod schemas
- No prop drilling through 3+ layers

**Pass 4 — Security:**
- No hardcoded secrets, tokens, or credentials
- No `NEXT_PUBLIC_` prefix on server-side secrets
- Tokens masked in log output: `token.slice(0, 6) + '...'`
- Protected routes use `getServerSession()`
- Admin endpoints verify JWT role
- Webhook endpoints validate `Authorization` header
- All POST/PUT endpoints validate body with Zod
- No token logging via `console.log`
- RLS policies on any new tables
- Error responses don't leak stack traces

### Security scope (Pass 4 only)

Run only the security checks from Pass 4 above.

### Full scope (all 10 passes)

Run all passes from the pr-reviewer agent:

1. **Linear & Branch Hygiene** — branch naming, PR title has ticket, body references ticket
2. **Quality Gates** — lint, tsc, tests, CI status
3. **Code Quality** — TypeScript, React/Next.js patterns, error handling
4. **Security** — secrets, auth, input validation, database
5. **Testing** — coverage, E2E policy (no mocks), test quality
6. **Instagram API** (if applicable) — API version, error codes, token handling
7. **Database** (if applicable) — migrations, RLS, query patterns
8. **Performance** — N+1 queries, unbounded queries, memo usage, bundle size
9. **API Response Naming** — no `data` as field name
10. **Documentation & Versioning** — version bump, inline comments

Skip passes 6–7 if no relevant files were changed.

---

## Step 3: Generate Report

```markdown
## Code Review: {branch name or PR #number}

### Scope: {quick|security|full}
### Files reviewed: {count}

### Blockers (must fix)
- [ ] file:line — description

### Suggestions (recommended)
- file:line — description

### Observations (minor)
- description

### Verdict: CLEAN | HAS_SUGGESTIONS | HAS_BLOCKERS
```

**Verdict rules:**
- `CLEAN` — zero blockers, zero suggestions
- `HAS_SUGGESTIONS` — zero blockers, one or more suggestions
- `HAS_BLOCKERS` — one or more blockers (must fix before shipping)

---

## Step 4: Auto-fix (if `--fix`)

If `--fix` was passed and there are fixable issues:

1. Apply fixes using the Edit tool for each auto-fixable issue:
   - Remove unused imports
   - Replace `any` with proper types
   - Add missing `'use client'` directives
   - Fix obvious security issues (e.g., remove token logging)
2. Show what was changed
3. Do **NOT** commit — leave changes for user review
4. Re-run the relevant checks to confirm fixes worked
5. Print updated verdict

If `--fix` was NOT passed, skip this step.

---

## Step 5: Return Verdict

Print the final verdict clearly:

- **`CLEAN`** — no issues found
- **`HAS_SUGGESTIONS`** — no blockers, safe to ship
- **`HAS_BLOCKERS`** — must fix before shipping

When called from `/ship`, this verdict determines whether shipping continues or stops.
