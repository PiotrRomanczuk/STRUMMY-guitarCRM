---
allowed-tools: Read, Edit, Write, Bash, Glob, Grep, Task
argument-hint: [--dry-run] [--fix-only] [--merge-only] [--pr <number,...>]
description: Check all open PRs, analyze CI/CD status, fix failing ones, and merge them all into main
---

# Merge Fleet — Bulk PR Fixer & Merger

Execute the full fleet merge workflow: **$ARGUMENTS**

## Overview

This command checks every open PR targeting `main`, diagnoses CI/CD failures, fixes lint/type issues on each branch, pushes fixes, and squash-merges all PRs into `main` — one by one in dependency-safe order.

**IMPORTANT**: Execute each phase sequentially. **Stop immediately** if any phase encounters an unrecoverable error (merge conflicts, test failures). Report clearly and let the user decide.

---

## Phase 1: Discovery & Triage

### 1.1 List all open PRs

```bash
gh pr list --state open --base main --json number,title,headRefName,statusCheckRollup,mergeable,createdAt,labels --limit 50
```

### 1.2 For each PR, extract:

- **PR number and title**
- **Branch name** (used to identify the PR's scope)
- **CI status**: map `statusCheckRollup` entries to determine which checks are failing
- **Mergeability**: `MERGEABLE`, `CONFLICTING`, or `UNKNOWN`

### 1.3 Categorize each PR:

| Category    | Criteria                                 | Action                           |
| ----------- | ---------------------------------------- | -------------------------------- |
| Ready       | All checks pass, mergeable               | Merge directly                   |
| Fixable     | Only lint/type checks failing, mergeable | Fix then merge                   |
| Conflicting | Has merge conflicts                      | Report, skip (user must resolve) |
| Blocked     | Test failures or non-lint CI issues      | Report, skip                     |

### 1.4 Print discovery report:

```
PR Fleet Status:
  #94  Fix songs search           -> Fixable (lint failing)
  #95  Add calendar month view     -> Fixable (lint failing)
  #96  Adopt shadcn/ui             -> Conflicting (skip)
  #97  AI conversation persistence -> Fixable (lint failing)

Plan: Fix 3, Merge 3, Skip 1
```

### 1.5 Filter by `--pr` argument (optional)

If `--pr 94,95` was passed, only process those PR numbers. Otherwise process all.

---

## Phase 2: Determine Merge Order

**Sort PRs for safe sequential merging:**

1. Sort by **creation date** (oldest first) — oldest PRs are least likely to conflict
2. Detect **file overlap** between PRs:
   ```bash
   # For each pair of PRs, check overlapping changed files
   gh pr diff {number} --name-only
   ```
3. If two PRs modify the same files, merge the **older one first** and rebase the newer one after
4. Print the merge order plan

```
Merge order:
  1. #94 (oldest, songs domain)
  2. #95 (calendar domain — no overlap with #94)
  3. #97 (ai domain — no overlap)
  4. #96 (shadcn/ui — broad, merge last)
```

**If `--dry-run`**: Print the plan and STOP here. Do not fix or merge anything.

---

## Phase 3: Fix Failing PRs

For each fixable PR, in merge order:

### 3.1 Stash any local changes

```bash
git stash push -m "merge-fleet: stash before fixing PRs"
```

### 3.2 Checkout the branch

```bash
git fetch origin
git checkout {branch-name}
git pull origin {branch-name}
```

### 3.3 Rebase on latest main

```bash
git fetch origin main
git rebase origin/main
```

- If rebase conflicts occur: **ABORT rebase**, mark PR as Conflicting, skip to next PR
- `git rebase --abort` to clean up

### 3.4 Identify lint errors

```bash
npm run lint 2>&1
```

- Parse the ESLint output to identify files and error types
- Common fixes: unused imports, missing types, formatting issues

### 3.5 Fix lint errors

- Use the Edit tool to fix each identified issue
- Common patterns:
  - Remove unused imports/variables
  - Add missing type annotations (no `any` — use proper types)
  - Fix formatting issues
  - Add missing dependencies to useEffect/useMemo/useCallback

### 3.6 Identify type errors

```bash
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v ".next/types" | grep -v "notification-service.ts"
```

- Parse TypeScript compiler output for errors
- Filter out known pre-existing errors (same as CI does)
- Fix type mismatches, missing properties, incorrect generics

### 3.7 Fix type errors

- Use Read + Edit tools to fix each type error
- Never use `any` or `@ts-ignore` — find the correct type
- If a fix requires understanding the broader context, read related files first

### 3.8 Verify fixes locally

```bash
npm run lint && npx tsc --noEmit 2>&1 | grep "error TS" | grep -v ".next/types" | grep -v "notification-service.ts"
```

- If still failing: iterate on fixes (max 3 attempts per PR)
- If still failing after 3 attempts: mark as Blocked, report to user, skip

### 3.9 Run unit tests

```bash
npm test
```

- If tests fail: determine if the fix caused the failure
  - If yes: undo the fix and try a different approach
  - If pre-existing test failure: note it but continue

### 3.10 Commit and push fixes

```bash
git add {only the files you modified}
git commit -m "fix(ci): resolve lint and type errors

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
git push origin {branch-name}
```

### 3.11 Return to main before processing next PR

```bash
git checkout main
```

**If `--fix-only`**: After fixing all PRs, print summary and STOP. Do not merge.

---

## Phase 4: Merge PRs into Main

For each PR in merge order:

### 4.1 Verify CI is green

```bash
gh pr checks {number}
```

- Check that "Lint & Type Check" and "Quality Gate Summary" show `pass`
- If CI is still running, wait (check every 30s, max 5 minutes)
- If CI fails after fix: mark as Blocked, skip

### 4.2 Squash and merge

```bash
gh pr merge {number} --squash --delete-branch
```

- The `--delete-branch` flag cleans up the remote branch after merge
- Squash merge is the project convention (CLAUDE.md)

### 4.3 Update local main

```bash
git checkout main
git pull origin main
```

### 4.4 Check if next PR needs rebase

- After merging a PR, subsequent PRs may now have conflicts (especially package.json/lock)
- Before merging the next PR, check its mergeability:
  ```bash
  gh pr view {next-number} --json mergeable
  ```
- If CONFLICTING or merge fails: checkout the branch, rebase on main, resolve conflicts:
  - For package.json/lock conflicts: `git checkout --theirs package.json package-lock.json && npm install --package-lock-only`
  - For source code conflicts: use the Task tool with feature-developer agent to resolve
  - Push with `--force-with-lease` and wait for CI again

### 4.5 Update Obsidian vault

- Read `projects/Strummy/Strummy.md` to find the WIP task matching this PR
- Mark it `[x]` Done via `obsidian_patch_content`
- Add note: "Merged via /merge-fleet — PR #{number}"

**If `--merge-only`**: Skip Phase 3 entirely, only merge PRs that already have passing CI.

---

## Phase 5: Post-Merge Summary

Print a comprehensive report:

```
Fleet Merge Complete!

Merged (3):
  #94  Fix songs search              -> Merged (fixed lint)
  #95  Add calendar month view        -> Merged (fixed lint)
  #97  AI conversation persistence    -> Merged (fixed lint + types)

Skipped (1):
  #96  Adopt shadcn/ui                -> Conflicting (manual resolution needed)

Obsidian: 3 tasks marked Done
Branches: 3 deleted

Main branch status:
  Version: 0.67.0
  Commits ahead of production: {count}
```

Restore stashed work:

```bash
git stash pop
```

---

## Argument Reference

| Argument       | Effect                                    |
| -------------- | ----------------------------------------- |
| `--dry-run`    | Discovery + plan only, no changes         |
| `--fix-only`   | Fix CI issues but don't merge             |
| `--merge-only` | Only merge PRs with passing CI, don't fix |
| `--pr 94,95`   | Only process specific PR numbers          |

---

## Safety Guardrails

1. **Never force-push** — use `--force-with-lease` only after rebase
2. **Never merge to production** — only merge to main (production merge is a separate step)
3. **Never skip tests** — if tests fail, stop and report
4. **Always use squash merge** — project convention
5. **Always delete branch after merge** — keep repo clean
6. **Max 3 fix attempts per PR** — don't loop forever
7. **Preserve uncommitted work** — stash before switching branches, pop after
8. **Rebase, don't merge main into branch** — keeps history clean
9. **Ask user before proceeding** if more than 5 PRs would be merged at once
10. **Never use `git clean -fd`** while stash exists — it destroys untracked files

---

## Error Recovery

If any phase fails:

- Print exactly which phase failed, which PR, and why
- Print what was already completed (merged PRs can't be un-merged)
- List remaining PRs that weren't processed
- The user can re-run `/merge-fleet` to continue where it left off (already-merged PRs won't appear)
- Suggest specific fix for the blocking issue
