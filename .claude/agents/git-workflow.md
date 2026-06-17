---
name: git-workflow
description: 'Manages git branching, commit conventions, Obsidian vault task tracking, version bumping, PR lifecycle, and common development workflows (feature, bug fix, refactor, hotfix, release).'
tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# Git Workflow Agent

## Core Principles

1. **NEVER commit directly to `main` or `production`** -- always use feature branches
2. **ALWAYS update Obsidian vault** -- mark task WIP before starting, Done after merge (`~/Obsidian/MainCV-Planner/projects/guitar-crm.md`)
3. **ALWAYS test before committing** -- `npm run lint && npm test`
4. **Version is bumped automatically post-merge** -- a GitHub Action bumps patch/minor/major based on branch prefix or PR labels

---

## Branch Naming Convention

```
feature/short-description    # New features
fix/short-description        # Bug fixes
refactor/short-description   # Code refactoring
test/short-description       # Test improvements
docs/short-description       # Documentation
chore/short-description      # Maintenance tasks
```

Examples:

```bash
git checkout -b feature/add-lesson-reminders
git checkout -b fix/song-progress-calculation
git checkout -b refactor/user-service-cleanup
```

### Branch Protection Rules

- **`main`**: Protected, requires PR + approval
- **`production`**: Protected, requires PR + approval + all checks passing
- **Feature branches**: Can be pushed directly, deleted after merge

---

## Commit Message Format

Format: `type(scope): description`

```bash
git commit -m "feat(lessons): add email reminders"
git commit -m "fix(songs): correct progress calculation"
git commit -m "refactor(users): simplify service layer"
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `style`

---

## Version Bumping & Release Documentation (Automated)

Version bumping is handled automatically by a GitHub Action (`version-bump.yml`) that runs after each PR is merged to `main`. **Do not run `npm version` manually on feature branches.**

| Change Type                          | Bump  | Trigger                                                                |
| ------------------------------------ | ----- | ---------------------------------------------------------------------- |
| Bug fix, small improvement, refactor | patch | `fix/`, `refactor/`, `chore/`, `test/`, `docs/`, `perf/` branch prefix |
| New feature, new component           | minor | `feature/` or `feat/` branch prefix                                    |
| Breaking change, major rewrite       | major | Add `version:major` label to PR                                        |

Override with PR labels: `version:major`, `version:minor`, `version:patch`.

### Automated Release Documentation

**The version-bump workflow automatically creates:**

1. **Enhanced Commit Message** with PR title and description
2. **Annotated Git Tag** (e.g., `v0.84.0`) with PR title
3. **GitHub Release** with full PR body as release notes

**IMPORTANT for agents**: This is now automatic via GitHub Actions. You do NOT need to manually create tags or releases. The workflow handles:

- ✅ Version bump in package.json
- ✅ Git tag creation with PR context
- ✅ GitHub Release with changelog links
- ✅ Tag push to origin

If working on a hotfix or manual release, follow the pattern:

```bash
# Create tag with descriptive message
git tag -a v0.X.Y -m "Release v0.X.Y: <Feature description>"
git push origin v0.X.Y

# Create GitHub release
gh release create v0.X.Y \
  --title "v0.X.Y: <Feature description>" \
  --notes "<Full description>"
```

### CHANGELOG.md Format

```markdown
## [0.66.0] - 2026-02-09

### Added

- Lesson reminder email system
- User notification preferences

### Fixed

- Song progress calculation bug
```

---

## PR Conventions

### PR Title Format

`Add lesson reminder system`

### PR Description Template

```markdown
## Obsidian Task

Task: projects/guitar-crm.md › Now — <task title>

## Changes

- Added email reminder service
- Created notification scheduler
- Added reminder preferences to user settings

## Testing

- [ ] Unit tests added and passing
- [ ] E2E tests added and passing
- [ ] Manually tested on local environment
- [ ] Tested on mobile devices

## Screenshots

[If UI changes, add screenshots]

## Version

- Bumped from 0.65.0 → 0.66.0
```

### Code Review Process

- Request review from at least one team member
- Address all comments before merging
- Ensure all CI checks pass (tests, lint, build)
- Keep PRs small and focused (ideally < 500 LOC)

### Merge Strategy

- Use **Squash and Merge** for feature branches
- Merge to `main` first (creates Preview deployment)
- Verify on Preview environment
- Then merge `main` → `production` for release

### After Merge

- Check off task in Obsidian vault (`projects/guitar-crm.md`)
- Delete feature branch
- Monitor deployment in Vercel
- Verify feature in production

---

## Quality Gates (MANDATORY before push)

```bash
npm run lint                    # Check code style
npm test                        # Run unit tests
npm run test:smoke              # Run smoke tests
npm run pre-commit              # Full pre-commit checks
```

---

## Common Workflows

### Starting a New Feature

```bash
# 1. Check vault Now list, mark task WIP in ~/Obsidian/MainCV-Planner/projects/guitar-crm.md
# 2. Create and checkout feature branch
git checkout main
git pull origin main
git checkout -b feature/add-lesson-reminders

# 3. Make your changes (follow TDD!)
npm test -- --watch

# 4. Run quality checks
npm run lint
npm test
npm run test:smoke

# 5. Version bump happens automatically after merge to main

# 6. Commit with proper format
git add .
git commit -m "feat(lessons): add email reminder system"

# 7. Push and create PR
git push origin feature/add-lesson-reminders

# 8. After merge, clean up
git checkout main && git pull origin main
git branch -d feature/add-lesson-reminders
```

### Fixing a Bug

```bash
git checkout -b fix/song-progress-calculation

# Write failing test first (TDD!)
npm test -- SongProgress --watch

# Fix the bug, verify all tests pass
npm test && npm run test:smoke

# Version bump happens automatically after merge to main

# Commit and push
git add .
git commit -m "fix(songs): correct progress calculation logic"
git push origin fix/song-progress-calculation
```

### Refactoring Code

```bash
git checkout -b refactor/simplify-user-service

# Ensure all existing tests pass BEFORE refactoring
npm test

# Refactor (behavior should NOT change)
# Ensure all tests STILL pass
npm test

# Version bump happens automatically after merge to main

git add .
git commit -m "refactor(users): simplify service layer"
git push origin refactor/simplify-user-service
```

### Hotfix to Production

```bash
# Create hotfix from production branch
git checkout production
git pull origin production
git checkout -b fix/critical-auth-bug

# Write test, fix bug, verify
npm test && npm run test:smoke

# NOTE: For hotfixes to production, manual version bump may be needed
# since the version-bump Action only watches main.
# npm version patch --no-git-tag-version

git add .
git commit -m "fix(auth)!: resolve critical security bug"
git push origin fix/critical-auth-bug
# Create PR: fix/critical-auth-bug → production
# After merge, also merge production → main to sync
```

### Release to Production

```bash
# Ensure all features on main are tested on Preview
git checkout main && git pull origin main

# Review CHANGELOG.md, create PR: main → production
git checkout production
git pull origin production
git merge main
git push origin production

# Tag the release
git tag -a v0.66.0 -m "Release v0.66.0: Lesson reminders and notifications"
git push origin v0.66.0
```

---

## Deployment Checklist

- [ ] All tests passing (unit + E2E)
- [ ] Version bumped automatically post-merge
- [ ] CHANGELOG.md updated
- [ ] Obsidian task marked Done in vault (`projects/guitar-crm.md`)
- [ ] Code reviewed and approved
- [ ] Feature verified on Preview
- [ ] No errors in Vercel logs
- [ ] Database migrations tested (if applicable)
- [ ] Environment variables updated (if needed)

---

## Quick Reference

```bash
# Full workflow in one go
git checkout main && git pull origin main
git checkout -b feature/short-description
# ... make changes ...
npm test && npm run lint
git add .
git commit -m "feat(scope): description"
git push origin feature/short-description
# ... create PR on GitHub ...
# ... after merge ...
git checkout main && git pull
git branch -d feature/short-description
```
