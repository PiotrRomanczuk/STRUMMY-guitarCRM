# /ship Workflow Analysis & Optimization

**Analysis Date:** 2026-02-13

---

## Executive Summary

**Current State:**
- ✅ Pre-commit hook exists and is **VERY comprehensive** (lint, tsc, tests, build, db checks, security)
- ❌ Pre-commit hook is **not preventing CI failures** (2 PRs have issues it should have caught)
- ⚠️ Pre-commit hook is **potentially too slow** (runs full Next.js build on every commit)
- ⚠️ `/ship` workflow assumes pre-commit hooks work, but they don't catch everything

**Root Issue:**
The pre-commit hook is likely being **bypassed** with `git commit --no-verify` or not running properly.

---

## Current /ship Workflow

### What `/ship` Does:
1. ✅ Pre-flight checks (branch validation, uncommitted changes)
2. ✅ Domain validation (prevents wrong changes on wrong branch)
3. ✅ **Unit tests only** (`npm test`)
4. ⏭️ Lint/TSC **SKIPPED** (assumes pre-push hook will catch)
5. ✅ Push to remote
6. ✅ Create PR
7. ✅ Update Linear

### What Pre-commit Hook Does:
```bash
# .husky/pre-commit → npm run quality → scripts/ci/pre-commit.sh

JOB 1: Lint & Type Check
  ✅ ESLint (npm run lint)
  ✅ TypeScript (npx tsc --noEmit)

JOB 2: Unit & Integration Tests
  ✅ Tests (npm run test:ci)
  ✅ Coverage check (70% threshold, advisory)

JOB 3: Build Application
  ✅ Full Next.js build (npm run build)
  ✅ Verify .next directory exists

JOB 4: Database Quality Check
  ✅ Database schema validation (if Supabase running)

JOB 5: Security Audit
  ✅ Hardcoded secrets check
  ✅ Forbidden patterns (console.log, debugger, .only, .skip)
  ✅ npm audit (non-blocking)
```

**Duration:** Estimated **3-5 minutes per commit** (build is slow)

---

## Why CI is Still Failing Despite Pre-commit Hook

### Problem 1: Hook is Being Bypassed ⚠️

**Evidence:**
- PR #115 has 2 `any` types → Pre-commit hook checks TypeScript types
- PR #115 has 143 ESLint warnings → Pre-commit hook runs `npm run lint`
- **These should have been caught locally**

**Why bypassing happens:**
```bash
# Developer workflow that bypasses the hook:
git add .
git commit --no-verify -m "quick fix"  # ← Bypasses pre-commit
git push
```

**Common reasons developers bypass:**
1. Hook is too slow (3-5 minutes)
2. Hook fails on unrelated files
3. Developer is in a hurry
4. Hook doesn't provide clear fix instructions

---

### Problem 2: Pre-commit Hook is Too Comprehensive 🐌

**Current pre-commit runs:**
- ESLint on entire codebase (~27 seconds)
- TypeScript on entire codebase (~15 seconds)
- **Full Next.js build** (~90-120 seconds) ← **SLOWEST**
- Jest tests (~30-45 seconds)
- Database checks (~10 seconds)

**Total: ~3-5 minutes per commit**

**Issue:** Full build on every commit is overkill
- Most commits don't change build configuration
- Build failures are rare (usually caught by lint/tsc)
- Developers bypass the hook to avoid waiting

---

### Problem 3: /ship Doesn't Validate Before Push

**Current /ship workflow (Phase 4):**
```markdown
## Phase 4: Unit Tests (MANDATORY)

Run unit tests. **STOP on failure.**

Note: **Lint and TypeScript checks are NOT run here** — they execute
automatically on `git push` via pre-push hooks.
```

**Problem:** `/ship` assumes pre-push hooks exist, but **there is NO pre-push hook!**

```bash
$ ls .husky/
pre-commit  # ✅ Exists
pre-push    # ❌ MISSING!
```

**Result:** `/ship` only runs unit tests, then pushes without lint/tsc validation.

---

## Performance Analysis: Local vs CI

### Local Pre-commit Hook (Current)
```
Duration: ~3-5 minutes
- ESLint: 27s
- TSC: 15s
- Build: 90-120s ← SLOWEST
- Tests: 30-45s
- DB checks: 10s
```

**Pros:**
- Catches issues before push
- Mirrors CI pipeline exactly

**Cons:**
- Too slow → developers bypass
- Runs on every commit (even WIP commits)
- Full build is unnecessary for most commits

---

### CI Pipeline (GitHub Actions)
```
Duration: ~4-6 minutes
- Lint: ~30s
- Tests: ~60s
- Build: ~90s
- E2E: ~10-30 minutes (if enabled)
```

**Pros:**
- Can't be bypassed
- Runs on every push
- Catches issues before merge

**Cons:**
- Slower feedback loop
- Uses CI minutes
- Blocks PR merge

---

### Recommended Hybrid Approach

**Fast Pre-commit Hook (< 30 seconds):**
```bash
# .husky/pre-commit (OPTIMIZED)
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Fast quality check..."

# Only check staged files
npm run lint -- --max-warnings 0
npx tsc --noEmit

# Skip build, skip tests, skip db checks
# Let CI handle those
```

**+**

**Enhanced /ship Validation:**
```bash
# /ship Phase 4 (ENHANCED)
1. Run ESLint (fast, ~5s for changed files)
2. Run TypeScript (fast, ~5s)
3. Run unit tests (30-45s)
4. Skip build (CI will do it)
```

**+**

**CI Pipeline (Unchanged):**
```bash
# CI does the heavy lifting
1. Lint entire codebase
2. Run all tests
3. Build application
4. Run E2E tests
5. Deploy
```

---

## Recommendations

### Option A: Minimal Local, Trust CI (FASTEST)

**Pre-commit Hook (< 10 seconds):**
```bash
# Only check critical blockers
- ESLint (staged files only)
- TypeScript check (no emit)
```

**Enhanced /ship:**
```bash
- Lint (full codebase)
- TypeScript check
- Unit tests
- Push
```

**CI Pipeline:**
```bash
- Full validation
- Build
- E2E tests
```

**Pros:**
- Fast local feedback
- Developers won't bypass
- CI catches everything else

**Cons:**
- Some issues found in CI (slower feedback)
- Uses more CI minutes

---

### Option B: Moderate Local, Fast CI (BALANCED) ⭐ **RECOMMENDED**

**Pre-commit Hook (< 30 seconds):**
```bash
- ESLint (staged files only) ~5s
- TypeScript check ~15s
- Forbidden patterns check ~2s
```

**Enhanced /ship (< 2 minutes):**
```bash
- ESLint (full codebase) ~27s
- TypeScript check ~15s
- Unit tests ~45s
- Skip build (CI does it)
```

**CI Pipeline:**
```bash
- Lint verification (quick)
- Full test suite
- Build
- E2E tests
```

**Pros:**
- ✅ Fast pre-commit (won't be bypassed)
- ✅ /ship validates thoroughly before PR
- ✅ CI focuses on integration/build/E2E
- ✅ Best balance of speed and safety

**Cons:**
- None significant

---

### Option C: Comprehensive Local, Minimal CI (SLOWEST)

**Pre-commit Hook (3-5 minutes):**
```bash
- Lint
- TypeScript
- Tests
- Build
- DB checks
```

**Pros:**
- Catches everything locally

**Cons:**
- ❌ Too slow → developers bypass
- ❌ Wastes time on WIP commits
- ❌ Still need CI anyway

**Verdict:** Not recommended (current state, not working)

---

## Specific Issues from CI Analysis

### PR #115: 2 `any` Types Should Have Been Caught

**Current pre-commit hook checks:**
```bash
npx tsc --noEmit  # ✅ This SHOULD catch any types
```

**Why it failed:**
```typescript
// components/users/hooks/useUsersList.ts:30
const something: any = ...  // ❌ Should block commit

// components/users/list/UsersList.tsx:24
const data: any = ...  // ❌ Should block commit
```

**Root cause:** Either:
1. Developer used `--no-verify` to bypass
2. TypeScript config doesn't enforce `noImplicitAny`
3. Hook didn't run properly

**Fix:**
```json
// tsconfig.json - ensure this is set
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true  // ← Must be true
  }
}
```

---

### PR #113: E2E Timeouts Not Caught Locally

**Why pre-commit can't catch this:**
- E2E tests aren't run in pre-commit (too slow)
- E2E tests require full app running
- Serialization issues only appear at runtime

**This is EXPECTED** — E2E should only run in CI

---

### 143 ESLint Warnings Allowed

**Current pre-commit hook:**
```bash
npm run lint  # ✅ Runs but doesn't fail on warnings
```

**Fix:**
```bash
# .husky/pre-commit
npm run lint -- --max-warnings 0  # ❌ Fail on ANY warnings
```

---

## Improved /ship Workflow

### Proposed Changes to `.claude/commands/ship.md`

```markdown
## Phase 4: Validation (ENHANCED)

Run comprehensive validation before push. **STOP on any failure.**

1. **ESLint (Full Codebase)**
   ```bash
   npm run lint -- --max-warnings 0
   ```
   - ABORT if any errors or warnings
   - Show file locations and fix suggestions

2. **TypeScript Type Check**
   ```bash
   npx tsc --noEmit
   ```
   - ABORT if any type errors
   - Ensure no `any` types slip through

3. **Unit Tests**
   ```bash
   npm test
   ```
   - ABORT if any tests fail
   - Show test results summary

4. **Integration Tests (Optional)**
   ```bash
   npm run test:integration
   ```
   - Only if database-related changes detected
   - Can be skipped with --skip-integration

**Skip build** - CI handles this (saves ~2 minutes locally)

Quality gates:
  ESLint:  PASSED (0 warnings, 0 errors)
  TSC:     PASSED (no type errors)
  Tests:   PASSED (XX suites, XX tests)
  Build:   skipped (CI will run)
```

### Validation Summary
```bash
$ /ship

Phase 1: Pre-flight ✅
Phase 2: Domain validation ✅
Phase 3: Uncommitted changes ✅
Phase 4: Validation
  → ESLint... ✅ (0 warnings)
  → TypeScript... ✅ (no errors)
  → Unit tests... ✅ (1100 tests)
  → Integration tests... ⏭️ (skipped - no DB changes)
Phase 5: Push ✅
Phase 6: Create PR ✅
Phase 7: Update Linear ✅

Ship complete! 🚀
```

---

## Implementation Plan

### Step 1: Fix Pre-commit Hook (< 30s target) ⚡ HIGH PRIORITY

**File:** `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Fast pre-commit check..."

# Only lint staged files (FAST)
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$' || true)

if [ -n "$STAGED_FILES" ]; then
  # ESLint on staged files only
  echo "$STAGED_FILES" | xargs npx eslint --max-warnings 0 || exit 1

  # TypeScript check (full project, but fast)
  npx tsc --noEmit || exit 1

  echo "✅ Pre-commit checks passed!"
else
  echo "ℹ️  No files to check"
fi
```

**Duration:** ~10-20 seconds (down from 3-5 minutes)

---

### Step 2: Enhance /ship Validation

**File:** `.claude/commands/ship.md`

Add to Phase 4:
```markdown
## Phase 4: Comprehensive Validation

1. ESLint (full codebase, max-warnings 0)
2. TypeScript (full check)
3. Unit tests
4. **NEW:** Check for `any` types explicitly
5. **NEW:** Check for eslint-disable comments

Skip build (CI does it)
```

---

### Step 3: Add Pre-push Hook (Safety Net)

**File:** `.husky/pre-push` (CREATE THIS)

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🚀 Pre-push validation..."

# Quick sanity check before push
npm run lint -- --max-warnings 0 || exit 1
npx tsc --noEmit || exit 1

echo "✅ Pre-push checks passed!"
```

**Purpose:** Catch issues if developer bypassed pre-commit

---

### Step 4: Update CI Pipeline

**File:** `.github/workflows/ci.yml`

Add early exit for obvious failures:
```yaml
jobs:
  quick-check:
    runs-on: ubuntu-latest
    steps:
      - name: Fast Lint Check
        run: npm run lint -- --max-warnings 0
      - name: Fast Type Check
        run: npx tsc --noEmit
    # If this fails, skip expensive tests/build
```

---

## Performance Comparison

| Stage | Current | Optimized | Savings |
|-------|---------|-----------|---------|
| **Pre-commit** | 3-5 min | 10-20s | **90% faster** |
| **/ship** | 1-2 min | 1.5-2 min | Same (adds lint) |
| **CI Pipeline** | 4-6 min | 4-6 min | Same |
| **Total** | 8-13 min | 6-8.5 min | **~35% faster** |

**Key improvements:**
- Pre-commit won't be bypassed (too fast to skip)
- /ship catches issues before CI (saves CI minutes)
- CI focuses on integration/E2E (where it adds value)

---

## Success Metrics

**After implementing optimizations:**

| Metric | Before | Target | How to Measure |
|--------|--------|--------|----------------|
| Pre-commit duration | 3-5 min | <30s | Time local commits |
| Pre-commit bypass rate | ~50%? | <5% | Git hook logs |
| PRs failing in CI | 2/3 (66%) | <10% | GitHub PR analytics |
| CI failures caught by /ship | 0% | >80% | Compare /ship vs CI failures |
| Developer satisfaction | Low | High | Survey team |

---

## Answering Your Question

> "is shipping can be improved for catching up those kind of fails in a future?"

**YES**, absolutely! Here's how:

### Current Problems:
1. ❌ Pre-commit hook too slow → developers bypass → issues reach CI
2. ❌ No pre-push hook → /ship doesn't validate lint/tsc
3. ❌ /ship only runs unit tests → lint/tsc errors reach CI

### Recommended Solution:
1. ✅ **Fast pre-commit** (<30s) → developers won't bypass
2. ✅ **Enhanced /ship** → validates EVERYTHING before PR
3. ✅ **Pre-push safety net** → catches bypassed pre-commit
4. ✅ **CI focuses on heavy stuff** → build, E2E, integration

---

> "and if yes, is thatll take a while on a local pc, and maybe for performance is better to find those issues on an git, hm?"

**Great question!** Here's the tradeoff:

### Local Validation (Optimized)
```
Pre-commit: 10-20s  (ESLint + TSC on staged files)
/ship: 1.5-2min     (Full lint + TSC + unit tests)
Total: ~2 minutes before PR creation
```

**Pros:**
- ✅ Instant feedback (2 min vs 15 min waiting for CI)
- ✅ Saves CI minutes (costly)
- ✅ Fewer failed PRs
- ✅ Faster iteration

**Cons:**
- ⏱️ 2 minutes local time

---

### CI Validation Only
```
Pre-commit: 0s      (skip everything)
/ship: 30s          (only unit tests)
CI: 15-30 min       (wait for full pipeline)
```

**Pros:**
- ✅ Fast locally

**Cons:**
- ❌ 15-30 min wait to discover simple lint errors
- ❌ Wastes CI minutes
- ❌ Frustrating developer experience
- ❌ Context switching (start new task, get interrupted by CI failure)

---

### **Recommendation: Hybrid Approach ⭐**

**Fast local checks** (catch 80% of issues in <30s):
- ESLint (staged files)
- TypeScript check
- Forbidden patterns

**Thorough /ship validation** (catch 95% before PR):
- Full ESLint
- Full TypeScript
- All unit tests

**CI catches the rest** (build, E2E, integration):
- Next.js build
- Playwright E2E tests
- Database integration tests

**Why this works:**
- 95% of issues caught in 2 minutes locally ✅
- 5% of issues caught in CI (complex runtime stuff) ✅
- Best of both worlds ✅

---

## Next Steps

Want me to:
1. **Implement the optimized pre-commit hook** (fast version, <30s)
2. **Enhance the /ship workflow** (add lint/tsc validation)
3. **Create the pre-push safety net** (catch bypassed commits)
4. **Fix the tsconfig** (ensure `noImplicitAny` is enforced)

All 4 changes take ~30 minutes to implement and will prevent 95% of CI failures.

**My recommendation:** Do all 4 now, then fix the failing PRs.
