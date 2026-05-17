# Pre-Commit Hook Guide

## Overview

The pre-commit hook has been enhanced to **mirror the GitHub Actions CI/CD pipeline** exactly. This ensures that code passing pre-commit checks will also pass the CI/CD pipeline, catching issues early in the development process.

## What It Checks

The pre-commit hook runs the same 5 jobs as the CI/CD pipeline:

### Job 1: Lint & Type Check ✅

- **ESLint**: Code quality and style rules
- **TypeScript**: Type checking across entire codebase

### Job 2: Unit & Integration Tests ✅

- **Test Execution**: All tests with coverage in CI mode
- **Coverage Thresholds**: Ensures 70% minimum coverage for:
  - Statements
  - Branches
  - Functions
  - Lines

### Job 3: Build Application ✅

- **Next.js Build**: Full production build
- **Build Verification**: Confirms `.next` directory exists

### Job 4: Database Quality Check ✅

- **Supabase Status**: Verifies database is running
- **Data Integrity**: Checks for:
  - Real emails in test database
  - Orphaned records
  - Minimum test data requirements
  - Profile completeness

### Job 5: Security Audit ✅

- **Hardcoded Secrets**: Scans for exposed credentials
- **Forbidden Patterns**: Checks for:
  - `console.log` statements
  - `debugger` statements
  - `.only()` test focus
  - `.skip()` test skips
- **NPM Audit**: Dependency vulnerability scan (non-blocking)

### Additional Checks

- **TODO/FIXME Comments**: Advisory warnings
- **Commit Message Format**: Conventional commits validation

## Installation

### Automatic (Git Hooks)

```bash
# Create Git hook
echo '#!/bin/sh\n./scripts/ci/pre-commit.sh' > .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### Manual Execution

```bash
# Run pre-commit checks manually
./scripts/ci/pre-commit.sh

# Or use npm script
npm run pre-commit
```

## Usage

### Normal Workflow

```bash
# 1. Make your changes
git add .

# 2. Attempt to commit (pre-commit runs automatically)
git commit -m "feat: add new feature"

# If checks pass: ✅ Commit succeeds
# If checks fail: ❌ Fix issues and try again
```

### Bypassing Pre-Commit (Not Recommended)

```bash
# Skip pre-commit checks (CI/CD will still fail)
git commit --no-verify -m "feat: add new feature"
```

**⚠️ Warning**: Bypassing pre-commit checks only delays failures until CI/CD runs.

## Output Format

The enhanced pre-commit hook provides structured output matching CI/CD:

```
🔍 PRE-COMMIT CHECKS (CI/CD Pipeline Mirror)
==============================================

📁 Checking staged files:
  • app/api/songs/route.ts
  • components/songs/SongList.tsx

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 JOB 1: LINT & TYPE CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧹 Running ESLint...
✅ ESLint passed

🔧 Running TypeScript type check...
✅ TypeScript types are valid

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 JOB 2: UNIT & INTEGRATION TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[... and so on ...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 QUALITY GATE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Duration: 45s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 ALL PRE-COMMIT CHECKS PASSED!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your code is ready to be committed and will pass CI/CD pipeline.
```

## Performance

Pre-commit checks typically take:

- **Quick changes** (1-2 files): ~30-45 seconds
- **Large changes** (10+ files): ~60-90 seconds
- **Full build required**: ~90-120 seconds

## CI/CD Parity

The pre-commit hook ensures **100% parity** with CI/CD by:

1. ✅ Running identical commands (`npm run test:ci`, not `npm test`)
2. ✅ Using same coverage thresholds (70%)
3. ✅ Checking same forbidden patterns
4. ✅ Running full builds (not incremental)
5. ✅ Validating database quality
6. ✅ Scanning for security issues

**Result**: If pre-commit passes, CI/CD will pass (assuming no environment-specific issues).

## Troubleshooting

### Database Checks Failing

```bash
# Start Supabase
npm run setup:db

# Verify it's running
supabase status
```

### Coverage Below Threshold

```bash
# Run tests with coverage locally
npm run test:coverage

# Identify untested code
open coverage/lcov-report/index.html
```

### Build Failures

```bash
# Clean build
rm -rf .next node_modules/.cache

# Rebuild
npm run build
```

### Forbidden Patterns Found

```bash
# Find all console.log statements
grep -r "console\.log" app/ components/ lib/

# Remove them or replace with proper logging
# Use lib/logging.ts for structured logging
```

## Best Practices

1. **Run Pre-Commit Regularly**: Don't wait until commit time

   ```bash
   # Test as you develop
   ./scripts/ci/pre-commit.sh
   ```

2. **Fix Issues Incrementally**: Don't accumulate violations

   ```bash
   # Check after each feature
   npm run quality
   ```

3. **Keep Database Running**: Maintain Supabase for database checks

   ```bash
   # Start at beginning of work session
   npm run setup:db
   ```

4. **Monitor Coverage**: Don't let it drop below 70%

   ```bash
   # Check coverage frequently
   npm run test:coverage
   ```

5. **Follow Commit Conventions**: Use conventional commits format
   ```bash
   # Good commit messages
   feat: add user authentication
   fix(api): resolve timeout issue
   docs: update API documentation
   ```

## Integration with Development Workflow

### Recommended Workflow

```bash
# 1. Start work session
npm run setup:db          # Start Supabase
npm run dev               # Start Next.js

# 2. Develop with TDD
npm run tdd               # Test-driven development

# 3. Pre-commit check (optional but recommended)
npm run quality           # Or ./scripts/ci/pre-commit.sh

# 4. Commit
git add .
git commit -m "feat: add new feature"  # Pre-commit runs automatically

# 5. Push
git push                  # CI/CD pipeline runs (should pass!)
```

## Comparison with GitHub Actions

| Check            | Pre-Commit | CI/CD | Notes                     |
| ---------------- | ---------- | ----- | ------------------------- |
| ESLint           | ✅         | ✅    | Identical                 |
| TypeScript       | ✅         | ✅    | Identical                 |
| Unit Tests       | ✅         | ✅    | Same command (`test:ci`)  |
| Coverage Check   | ✅         | ✅    | Same thresholds (70%)     |
| Build            | ✅         | ✅    | Full production build     |
| Database Quality | ✅         | ✅    | Requires Supabase running |
| Security Audit   | ✅         | ✅    | NPM audit + secret scan   |
| E2E Tests        | ❌         | ✅    | Too slow for pre-commit   |
| Deploy           | ❌         | ✅    | Post-merge only           |

**Note**: E2E tests are skipped in pre-commit due to their duration (~5-10 minutes). They still run in CI/CD.

## Maintenance

### Updating Pre-Commit Script

When updating the CI/CD pipeline, also update pre-commit:

1. **Add new checks** to `scripts/ci/pre-commit.sh`
2. **Mirror job structure** from `.github/workflows/ci-cd.yml`
3. **Update this documentation**
4. **Test thoroughly**:

   ```bash
   # Test with failing cases
   echo "console.log('test')" >> test.ts
   git add test.ts
   git commit -m "test"  # Should fail

   # Test with passing cases
   git reset HEAD test.ts
   git commit -m "test"  # Should pass
   ```

### Version Compatibility

- **Node.js**: 18+ (matches CI/CD)
- **npm**: Latest (matches CI/CD)
- **Supabase CLI**: Latest (matches CI/CD)

## Support

If pre-commit checks fail unexpectedly:

1. Check CI/CD logs for differences
2. Verify environment setup matches CI/CD
3. Review this documentation
4. Check project's `.github/workflows/ci-cd.yml`

## Related Documentation

- **CI/CD Pipeline**: `.github/workflows/2026-03-16-2025-11-02-README.md`
- **Quality Checks**: `scripts/ci/quality-check.sh`
- **Database Checks**: `scripts/database/check-db-quality.sh`
- **Testing Guide**: `docs/TDD_GUIDE.md`
- **Development Standards**: `.github/DEVELOPMENT-STANDARDS.md`
