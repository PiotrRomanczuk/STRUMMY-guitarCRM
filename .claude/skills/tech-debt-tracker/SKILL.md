---
name: tech-debt-tracker
description: Scan the codebase for technical debt and generate a prioritized markdown report. Use when auditing code quality, preparing sprint cleanup, tracking TODO/FIXME density, or creating Linear tickets for debt reduction.
---

# Tech Debt Tracker

## Overview

Scans the Strummy codebase for technical debt indicators and produces a prioritized markdown report grouped by severity. Optionally creates Linear tickets for critical and high-severity items.

**What it detects:**
- TODO / FIXME / HACK / WORKAROUND comments (with file, line, context)
- Files exceeding size limits (200 LOC for components, 150 LOC for hooks)
- `: any` type usage in non-test files
- Stale documentation (files not updated in 90+ days)
- Disabled tests (`test.skip`, `it.skip`, `describe.skip`, `xit`, `xdescribe`)

## Usage

```
/tech-debt-tracker                    # Full scan, markdown report
/tech-debt-tracker --create-tickets   # Also create Linear tickets for critical/high
/tech-debt-tracker --category any     # Scan only `: any` types
/tech-debt-tracker --since 2025-01-01 # Compare against a baseline date
```

## Execution Steps

### Phase 1: Scan

Run all scans in parallel where possible. Use Grep and Glob tools (never raw shell grep).

#### 1a. TODO/FIXME/HACK/WORKAROUND Comments

Use Grep with pattern: `(TODO|FIXME|HACK|WORKAROUND)[:\s]`

For each match, capture:
- File path (absolute)
- Line number
- Full line content (trimmed)
- Category (TODO / FIXME / HACK / WORKAROUND)

Classify severity:
- **Critical**: Marker appears in `app/api/` routes or `lib/auth/` (security-adjacent)
- **Medium**: General TODO/FIXME in application code
- **Low**: Minor FIXME, cosmetic TODOs, documentation TODOs

#### 1b. Oversized Files

Scan components and hooks for size violations:

| Directory Pattern | Max LOC | Type |
|---|---|---|
| `components/**/*.tsx` | 200 | Component |
| `hooks/use*.ts` | 150 | Hook |
| `app/**/*.tsx` (page/layout files) | 200 | Page |

Use Glob to find files, then count lines:

```bash
wc -l <file>
```

Severity: **High** for files exceeding the limit.

Report: file path, actual LOC, limit, overage amount.

#### 1c. `: any` Type Usage

Search non-test files for `: any` type annotations.

Use Grep with pattern: `:\s*any\b` and glob `*.{ts,tsx}`.

Exclude patterns:
- `__tests__/**`
- `*.test.ts` / `*.test.tsx` / `*.spec.ts`
- `jest.config.*`
- `node_modules/**`

Classify severity:
- **Critical**: `: any` in `app/api/**` (API routes), `lib/auth/**`, `lib/services/**`
- **High**: `: any` in `components/**`, `hooks/**`, `app/**`
- **Medium**: `: any` in `schemas/**`, `types/**`, utility files

#### 1d. Stale Documentation

Find markdown files not updated in 90+ days:

```bash
find docs/ -name "*.md" -mtime +90
find . -maxdepth 1 -name "*.md" -mtime +90
```

Also check:
- `2025-11-27-MASTER_TODO.md` (if it exists)
- `docs/**/*.md`
- `supabase/migrations/*.md`

Severity: **High** for stale docs.

#### 1e. Disabled Tests

Search for skipped tests across all test files.

Use Grep with pattern: `(test\.skip|it\.skip|describe\.skip|xit\(|xdescribe\(|xtest\()`.

Search in: `__tests__/**`, `tests/**`

Severity: **Medium** (skipped tests reduce coverage confidence).

### Phase 2: Classify and Group

Group all findings by severity level:

| Severity | Criteria | Action |
|---|---|---|
| **Critical** | Security TODOs, `: any` in API routes/auth, HACKs in auth | Fix immediately |
| **High** | Oversized files, stale docs, `: any` in components | Fix this sprint |
| **Medium** | General TODOs, disabled tests | Backlog |
| **Low** | Minor FIXMEs, cosmetic debt | Nice-to-have |

### Phase 3: Generate Report

Output a markdown report with this structure:

```markdown
# Tech Debt Report

**Generated**: YYYY-MM-DD HH:MM
**Scanned**: N files across M directories

## Summary

| Category | Critical | High | Medium | Low | Total |
|---|---|---|---|---|---|
| TODO/FIXME/HACK | 2 | 5 | 45 | 12 | 64 |
| Oversized files | 0 | 8 | 0 | 0 | 8 |
| `: any` types | 3 | 12 | 5 | 0 | 20 |
| Stale docs | 0 | 4 | 0 | 0 | 4 |
| Disabled tests | 0 | 0 | 6 | 0 | 6 |
| **Total** | **5** | **29** | **56** | **12** | **102** |

## Critical Items (fix immediately)

### 1. `: any` in API route
- **File**: `app/api/cron/dispatcher/route.ts:56`
- **Line**: `type JobResult = { ... error?: any }`
- **Action**: Replace with `error?: string | undefined`

### 2. Security TODO in auth
- **File**: `lib/auth/cron-auth.ts:14`
- **Line**: `// TODO: add rate limiting to cron endpoint`
- **Action**: Implement rate limiting

## High Items (fix this sprint)

### Oversized Files

| File | LOC | Limit | Over by |
|---|---|---|---|
| `components/dashboard/admin/AdminDashboardClient.tsx` | 312 | 200 | 112 |
| `hooks/useCommandCenterData.ts` | 185 | 150 | 35 |

### `: any` Types in Components

| File | Line | Code |
|---|---|---|
| `components/songs/SongForm.tsx:42` | 42 | `onChange: (value: any) => void` |

### Stale Documentation

| File | Last Modified | Days Stale |
|---|---|---|
| `docs/deployment.md` | 2025-08-15 | 197 |

## Medium Items (backlog)

### TODO/FIXME Comments (top 20)

| # | File | Line | Comment |
|---|---|---|---|
| 1 | `app/api/cron/dispatcher/route.ts:14` | 14 | TODO: Extract inline logic... |
| 2 | `app/api/cron/dispatcher/route.ts:16` | 16 | TODO: Add per-job timeout... |

### Disabled Tests

| File | Line | Test Name |
|---|---|---|
| `__tests__/api/songs.test.ts:45` | 45 | `it.skip('handles concurrent...')` |

## Low Items

(listed but not expanded)
- 12 minor FIXMEs in utility files

## Trend (vs previous scan)

| Metric | Previous | Current | Delta |
|---|---|---|---|
| Total items | 98 | 102 | +4 |
| Critical | 3 | 5 | +2 |
| `: any` count | 50 | 54 | +4 |
```

### Phase 4: Create Linear Tickets (optional)

When `--create-tickets` is specified, create Linear issues for Critical and High items.

Use the Linear MCP tool:

```
mcp__linear-server__save_issue({
  teamId: "STRUM",
  title: "[Tech Debt] Fix `: any` type in cron dispatcher",
  description: "File: app/api/cron/dispatcher/route.ts:56\nReplace `any` with specific type.",
  priority: 1,  // 1=Urgent for Critical, 2=High for High
  labelIds: ["tech-debt"]
})
```

Ticket conventions:
- Title prefix: `[Tech Debt]`
- Include file path and line number in description
- Priority 1 (Urgent) for Critical, Priority 2 (High) for High
- Add `tech-debt` label

## Key Project Files

| File | Role |
|---|---|
| `CLAUDE.md` | Size limits and code conventions |
| `components/**/*.tsx` | Component files (200 LOC limit) |
| `hooks/use*.ts` | Hook files (150 LOC limit) |
| `app/api/**/*.ts` | API routes (critical zone for `: any`) |
| `lib/auth/**` | Auth code (critical zone for TODOs) |
| `__tests__/**` | Test files (check for skips) |
| `docs/**/*.md` | Documentation (check staleness) |

## Examples

### Quick audit of `: any` types only

```
/tech-debt-tracker --category any
```

Output:
```
# `: any` Type Audit

Found 54 occurrences in 23 files (excluding tests).

Critical (API/auth): 3
  - app/api/cron/dispatcher/route.ts:56
  - lib/auth/session.ts:23
  - app/api/songs/route.ts:89

High (components/hooks): 18
  - components/dashboard/admin/AdminDashboardClient.tsx:145
  ...
```

### Full scan with ticket creation

```
/tech-debt-tracker --create-tickets
```

Creates Linear tickets for all Critical and High items, then prints:
```
Created 5 Linear tickets:
  STRUM-301: [Tech Debt] Fix `: any` in cron dispatcher (Urgent)
  STRUM-302: [Tech Debt] Split AdminDashboardClient.tsx (312 LOC) (High)
  ...
```

## Error Handling

| Situation | Action |
|---|---|
| Linear MCP unavailable | Skip ticket creation, print warning, still generate report |
| File count exceeds 500 for a category | Truncate to top 50 by severity, note total in report |
| Git history unavailable (staleness check) | Fall back to filesystem mtime |
| Previous scan not found (trend comparison) | Skip trend section, note "first scan" |

## Storing Scan Results

Save the report for trend comparison:

```bash
# Save to a timestamped file (gitignored)
mkdir -p .tech-debt
# Write report to .tech-debt/report-YYYY-MM-DD.md
```

Add to `.gitignore` if not present:
```
.tech-debt/
```

Future scans read the most recent file in `.tech-debt/` for trend comparison.
