---
description: Branch safety protocol — always check before starting work, never work on main directly
---

## Branch Safety Protocol (MANDATORY - DO THIS FIRST)

**BEFORE starting ANY task**, check the current git branch and working tree state:

```bash
git branch --show-current && git status --short
```

**Rules:**

1. **Never work on `main` directly.** If on `main`, create a feature branch FIRST.
2. **If a feature branch already exists for the task**, switch to it before doing anything.
3. **If there are uncommitted changes on the wrong branch**, stash or commit them before switching.
4. **Branch naming**: `feature/STRUM-XXX-description` (or `fix/`, `chore/`, `refactor/`).
5. **Create the branch BEFORE writing code**, not after.

```bash
# Quick reference
git branch --show-current && git status --short
git checkout -b feature/STRUM-XXX-description

# If you accidentally started on main with uncommitted changes
git stash && git checkout -b feature/STRUM-XXX-description && git stash pop
```

## Parallel Agent Safety Protocol (MANDATORY when spawning 2+ agents)

### Option A: Worktree Isolation (Recommended)

Use `isolation: "worktree"` when calling the Task tool:

```
# CORRECT: each agent gets an isolated repo copy
Task(subagent_type="feature-developer", isolation="worktree", prompt="...")
Task(subagent_type="test-engineer", isolation="worktree", prompt="...")

# WRONG: agents share working directory (race conditions)
Task(subagent_type="feature-developer", prompt="...")
Task(subagent_type="test-engineer", prompt="...")
```

### Option B: Pre-Assignment Protocol (When worktrees aren't available)

1. **Ensure clean state**: `git status --short` must be empty. If not: commit first, don't stash.
2. **Create ALL branches upfront** (sequential, in orchestrator):
   ```bash
   git checkout -b feature/STRUM-101-thing-a && git checkout main
   git checkout -b feature/STRUM-102-thing-b && git checkout main
   ```
3. **Spawn agents with explicit branch names** in the prompt:
   > "Your pre-created branch is `feature/STRUM-101-thing-a`. Run `git checkout feature/STRUM-101-thing-a` as your FIRST action. Do NOT create branches or run git stash."

**Parallel agents MUST NOT**:

- Run `git stash` or `git stash pop` (shared stash = race condition)
- Run `git checkout -b` (branch creation = possible conflict)
- Assume the working directory state (another agent may have modified it)
