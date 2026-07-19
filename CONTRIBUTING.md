# Contributing to Strummy

Thank you for contributing to Strummy! This document provides guidelines for contributing to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Pull Request Process](#pull-request-process)
- [Linear Integration](#linear-integration)
- [Versioning](#versioning)

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd strummy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   npm run setup:all
   npm run seed
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Development Workflow

### 1. Always Start with a Linear Ticket

- **NEVER** start coding without creating or being assigned a Linear ticket
- All work must be tracked and linked to a ticket
- Ticket format: `STRUM-XXX`

### 2. Create a Feature Branch

**Branch naming convention** (strict enforcement):

```bash
feature/STRUM-XXX-short-description    # New features
fix/STRUM-XXX-short-description        # Bug fixes
refactor/STRUM-XXX-short-description   # Code refactoring
test/STRUM-XXX-short-description       # Test improvements
docs/STRUM-XXX-short-description       # Documentation
chore/STRUM-XXX-short-description      # Maintenance
```

**Examples**:
```bash
git checkout -b feature/STRUM-123-add-lesson-reminders
git checkout -b fix/STRUM-124-song-progress-bug
git checkout -b refactor/STRUM-125-simplify-user-service
```

### 3. Make Your Changes

- Follow TDD: Write tests first, then implement
- Keep changes focused and atomic
- Update tests as needed
- Run tests frequently: `npm test -- --watch`

### 4. Commit Your Changes

**Commit message format** (strict):

```bash
type(scope): description [TICKET-ID]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring (no behavior change)
- `test`: Adding or updating tests
- `docs`: Documentation changes
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `style`: Code style changes (formatting, etc.)

**Examples**:
```bash
git commit -m "feat(lessons): add email reminder system [STRUM-123]"
git commit -m "fix(songs): correct progress calculation logic [STRUM-124]"
git commit -m "refactor(users): simplify service layer [STRUM-125]"
git commit -m "test(lessons): add reminder service tests [STRUM-123]"
```

### 5. Update Version

**Update version for EVERY meaningful change**:

```bash
# Bug fix or small improvement
npm version patch -m "fix: resolve song mastery bug [STRUM-124]"

# New feature
npm version minor -m "feat: add lesson reminder system [STRUM-123]"

# Breaking change
npm version major -m "feat!: redesign auth flow [STRUM-130]"
```

### 6. Update CHANGELOG.md

Add your changes under `[Unreleased]` section:

```markdown
## [Unreleased]

### Added
- Lesson reminder email system [STRUM-123]
- User notification preferences [STRUM-123]

### Fixed
- Song progress calculation bug [STRUM-124]
```

### 7. Push and Create PR

```bash
# Push your branch
git push origin feature/STRUM-123-add-lesson-reminders

# Create PR on GitHub with this template:
```

**PR Template**:
```markdown
## Linear Ticket
Closes STRUM-123

## Changes
- Added email reminder service
- Created notification scheduler
- Added reminder preferences to user settings

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that breaks existing functionality)
- [ ] Refactoring (no functional changes)
- [ ] Documentation update

## Testing
- [ ] Unit tests added and passing
- [ ] E2E tests added and passing
- [ ] Manually tested on local environment
- [ ] Tested on mobile devices
- [ ] All existing tests pass

## Screenshots
[Add screenshots if UI changes]

## Version
- Bumped from 0.65.0 → 0.66.0

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] CHANGELOG.md updated
```

## Code Standards

### Component Organization

```
components/<domain>/<Feature>/
├── index.ts              # Re-exports
├── Feature.tsx           # Main component (max 200 LOC)
├── Feature.Header.tsx    # Sub-components
├── useFeature.ts         # Custom hook (max 150 LOC)
└── feature.helpers.ts    # Utilities
```

### Size Limits (Enforced)

- Component file: **Max 200 lines**
- Hook file: **Max 150 lines**
- Function body: **Max 50 lines**

If you exceed these limits, refactor into smaller pieces.

### Naming Conventions

- **Components/Types**: PascalCase (`StudentLesson`, `UserProfile`)
- **Functions/Variables**: camelCase (`fetchLessons`, `userData`)
- **Booleans**: `is/has/can` prefix (`isLoading`, `hasPermission`)
- **Hooks**: `use` prefix (`useStudentLesson`, `useAuth`)
- **Sub-components**: `Parent.Child.tsx` (`StudentLesson.Song.tsx`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_RETRIES`)

### Testing Requirements

- **70% code coverage minimum**
- Follow TDD: Test first, implement second
- Test pyramid: 70% unit, 20% integration, 10% E2E
- Tests mirror source structure in `/__tests__`

**Before committing**:
```bash
npm run lint              # Check code style
npm test                  # Run unit tests
npm run test:smoke        # Run smoke tests
npm run pre-commit        # Full pre-commit checks
```

## Pull Request Process

### 1. Pre-PR Checklist

- [ ] All tests passing (`npm test`)
- [ ] Lint checks passing (`npm run lint`)
- [ ] Version bumped in `package.json`
- [ ] CHANGELOG.md updated
- [ ] Linear ticket linked
- [ ] Branch follows naming convention
- [ ] Commits follow message format

### 2. Create Pull Request

- Use PR template above
- Link Linear ticket: "Closes STRUM-XXX"
- Add clear description of changes
- Include screenshots for UI changes
- Keep PRs focused (ideally < 500 LOC)

### 3. Code Review

- Request review from at least one team member
- Address all review comments
- Re-request review after changes
- Be open to feedback and suggestions
- Explain your decisions clearly

### 4. After Approval

- Ensure all CI checks pass
- Use "Squash and Merge" for feature branches
- Delete branch after merge
- Update Linear ticket to "Done"
- Monitor deployment

## Linear Integration

### Ticket Workflow

1. **Backlog** → Ticket created, not yet prioritized
2. **Todo** → Ticket prioritized, ready to work on
3. **In Progress** → Actively working (move here when starting)
4. **In Review** → PR created and under review
5. **Done** → Merged and deployed

### Linking Commits to Linear

- Include ticket ID in every commit: `[STRUM-XXX]`
- Linear auto-links commits to tickets
- Use "Closes STRUM-XXX" in PR to auto-close ticket

### Best Practices

- Update ticket status as you progress
- Add branch name to ticket description
- Add PR link when created
- Comment on blockers or questions
- Keep ticket description up-to-date

## Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Breaking changes, incompatible API changes
- **MINOR** (0.X.0): New features, backwards-compatible
- **PATCH** (0.0.X): Bug fixes, backwards-compatible

### When to Bump Version

**Always bump version for meaningful changes**:

```bash
# After fixing a bug
npm version patch

# After adding a feature
npm version minor

# After a breaking change
npm version major
```

This creates better project documentation and changelog.

## Questions?

- Check [CLAUDE.md](./CLAUDE.md) for detailed technical guidance
- Review existing code for patterns and examples
- Ask in team Slack channel
- Create a discussion in GitHub

## License

By contributing, you agree that your contributions will be licensed under the project's license.
