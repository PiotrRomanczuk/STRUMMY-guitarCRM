# Development Scripts Guide

This directory contains utility scripts to streamline the development workflow for the Guitar CRM project.

> **Last Updated**: November 2025 - Cleaned up and consolidated scripts. Reduced from ~47 to ~42 scripts by removing unused utilities.

## 📁 Directory Structure

```
scripts/
├── ci/                  # Code quality & deployment checks
│   ├── quality-check.sh       # TypeScript + ESLint + Tests
│   ├── deploy-check.sh        # Production readiness validation
│   ├── lighthouse-audit.sh    # Performance audits
│   └── lighthouse-ci.sh       # CI/CD performance checks
├── database/            # Database operations
│   ├── backup/          # Database backups
│   ├── maintenance/     # DB maintenance & health checks
│   ├── seeding/         # Data seeding (local/remote/test)
│   └── utils/           # Helper utilities for DB operations
├── setup/               # Initial project setup
│   ├── setup-env.sh     # Install deps, create .env
│   ├── setup-db.sh      # Start Supabase local environment
│   └── setup-test-env.sh # Configure test environment
├── testing/             # Testing utilities
│   ├── test-branch.sh   # Category-based test runner
│   ├── tdd-reminder.sh  # TDD workflow reminder
│   └── e2e.sh          # End-to-end test commands
└── development/         # Development utilities
    ├── dev-server.sh    # Multi-server management
    └── new-feature.sh   # Feature branch creation with TDD
```

## 🚀 Quick Start Scripts

### Initial Setup

```bash
npm run setup        # Set up development environment
npm run setup:db     # Set up Supabase database
npm run seed         # Populate database with sample data
```

### Daily Development

```bash
npm run new-feature  # Create new feature branch (with TDD reminder)
npm run tdd          # Start test-driven development mode (branch-specific)
npm run test:branch  # Run tests for current branch only
npm run test:branch:watch # Watch tests for current branch
npm run test:categories  # List all test categories and mappings
npm run dev:server   # Manage development servers
npm run quality      # Run code quality checks
npm run e2e          # Run Cypress E2E (headless)
npm run e2e:open     # Open Cypress runner (interactive)
```

## 📋 Script Reference

### `setup-env.sh`

**Purpose**: Initial project setup and environment configuration
**Usage**: `npm run setup` or `./scripts/setup-env.sh`

**What it does**:

- Checks Node.js version compatibility (18+)
- Installs all npm dependencies
- Creates `.env.local` template with Supabase configuration
- Creates necessary directories (`logs`, `temp`, `uploads`)
- Provides next steps guidance

**When to use**: First time setting up the project, or after cloning the repository

---

### `setup-db.sh`

**Purpose**: Set up and start Supabase local development environment
**Usage**: `npm run setup:db` or `./scripts/setup-db.sh`

**What it does**:

- Installs Supabase CLI if not present
- Checks Docker availability (required for Supabase)
- Starts Supabase local development stack
- Applies database migrations
- Displays connection details and API keys

**Prerequisites**: Docker Desktop must be running

---

### `new-feature.sh`

**Purpose**: Create feature branches with TDD workflow reminders
**Usage**: `npm run new-feature <feature-name>` or `./scripts/new-feature.sh user-authentication`

**What it does**:

- **Checks for unstaged/uncommitted changes** (exits if found)
- Switches to main branch and pulls latest changes
- Creates new feature branch (`feature/<name>`)
- Displays TDD workflow reminder
- Shows commands for testing and merging

**Prerequisites**: Working directory must be clean (no unstaged or uncommitted changes)
**TDD Integration**: Automatically reminds developers about Red-Green-Refactor cycle

---

### `test-branch.sh`

**Purpose**: Run tests based on current branch or specified category
**Usage**: `npm run test:branch` or `./scripts/test-branch.sh [category] [--watch] [--coverage]`

**What it does**:

- Automatically detects current branch and runs relevant tests only
- Supports dependency resolution (e.g., auth tests include core tests)
- Dramatically reduces test execution time for focused development
- Supports watch mode and coverage for branch-specific tests

**Examples**:

```bash
./scripts/test-branch.sh           # Auto-detect branch
./scripts/test-branch.sh auth      # Run auth category tests
./scripts/test-branch.sh --list    # Show all categories
./scripts/test-branch.sh core --watch  # Watch core tests only
```

**Configuration**: Uses `jest.config.branches.json` for category definitions and branch mappings

---

### `tdd-reminder.sh`

**Purpose**: Display TDD guidelines and best practices
**Usage**: `./scripts/tdd-reminder.sh` (automatically called by `npm run tdd`)

**What it displays**:

- TDD cycle explanation (Red-Green-Refactor)
- Testing commands and file locations
- Links to documentation

**Integration**: Now integrated with branch-based testing for focused TDD workflow

---

### `dev-server.sh`

**Purpose**: Manage development services (Next.js and Supabase)
**Usage**: `npm run dev:server <command> [service]` or `./scripts/dev-server.sh start all`

**Commands**:

- `start [all|next|db]` - Start services
- `stop [all|next|db]` - Stop services
- `restart [all|next|db]` - Restart services
- `status` - Show running services
- `logs [db]` - Show service logs

**Examples**:

```bash
./scripts/dev-server.sh start     # Start everything
./scripts/dev-server.sh start next   # Start only Next.js
./scripts/dev-server.sh stop db      # Stop only database
./scripts/dev-server.sh status       # Check what's running
```

---

### `quality-check.sh`

**Purpose**: Comprehensive code quality validation
**Usage**: `npm run quality` or `./scripts/quality-check.sh`

**Checks performed**:

1. TypeScript type checking
2. ESLint code style validation
3. Jest unit/integration tests with coverage
4. TODO/FIXME comment detection
5. Component file size analysis (advisory)
6. Bundle size analysis (if built)
7. Database quality validation
8. **Cypress E2E tests** (runs in headless mode)
9. Lighthouse performance scores

**E2E Testing**:

- Automatically starts dev server if not running
- Runs all Cypress tests in headless Chrome
- Provides helpful tips on failure
- Use `npm run e2e:open` to debug interactively

**Exit codes**: 0 = all checks pass, 1 = issues found

---

### `pre-commit.sh`

**Purpose**: Pre-commit hook for code quality assurance
**Usage**: `./scripts/pre-commit.sh` (automatically via Git hooks)

**Validations**:

- ESLint on staged files only
- TypeScript type checking
- Tests for changed files
- Forbidden patterns detection (console.log, debugger, etc.)
- Commit message format validation

**Setup as Git hook**:

```bash
echo '#!/bin/sh\n./scripts/pre-commit.sh' > .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

---

### `backup-db.sh`

**Purpose**: Create secure database backups without sensitive data
**Usage**: `npm run backup` or `./scripts/backup-db.sh`

**Creates**:

- Schema-only backup (`schema_backup.sql`)
- Anonymized data export script
- Backup documentation with usage instructions

**Security**: Removes all personal information (emails, names, etc.)

---

### `seed-db.sh`

**Purpose**: Populate database with sample development data
**Usage**: `npm run seed` or `./scripts/seed-db.sh`

**What it does**:

- Checks Supabase availability
- Runs database seed script
- Displays summary of seeded data
- Provides next steps guidance

---

### `deploy-check.sh`

**Purpose**: Production readiness validation
**Usage**: `npm run deploy:check` or `./scripts/deploy-check.sh`

**Comprehensive checks**:

- Environment variables validation
- Security vulnerability scan
- Production build test
- Full test suite execution
- Test coverage verification
- Bundle optimization analysis
- Database migration status
- Security pattern detection
- Performance analysis

**Output**: Detailed report with pass/fail status for each check

---

### `e2e.sh` and `cypress-open.sh`

**Purpose**: Run Cypress end-to-end tests against the local dev server

**Usage**:

```bash
# Headless run
npm run e2e
./scripts/e2e.sh

# Interactive runner
npm run e2e:open
./scripts/cypress-open.sh

# With a custom base URL
CYPRESS_BASE_URL=http://127.0.0.1:3000 npm run e2e
```

**Notes**:

- Uses `start-server-and-test` to boot Next.js and wait for `http://localhost:3000` before running tests
- For tests needing the database, use `npm run e2e:db` to start Supabase and the app together

## 🔄 Recommended Workflow

### Starting Development

```bash
# Initial setup (once)
npm run setup
npm run setup:db
npm run seed

# Daily workflow
npm run new-feature my-feature
npm run tdd  # Start TDD mode
```

### Small Components Policy (MANDATORY)

- Prefer many tiny, composable components over monoliths
- Extract presentational UI from containers and side-effects
- Co-locate hooks/helpers next to usage (useX.ts, X.helpers.ts)
- Keep files < 300 LOC and functions < 80 LOC in `app/`, `components/`, `lib/`
- Tests mirror structure under `__tests__/components/`

This is enforced by ESLint and surfaced by `npm run quality`.

### Before Committing

```bash
npm run quality  # Check code quality
# Git hooks will run pre-commit.sh automatically
```

### Before Deployment

```bash
npm run deploy:check  # Comprehensive production check
```

## 🛠️ Customization

### Adding New Scripts

1. Create script in `scripts/` directory
2. Make executable: `chmod +x scripts/new-script.sh`
3. Add npm shortcut in `package.json`
4. Document in this README

### Environment Variables

Scripts respect these environment variables:

- `NODE_ENV` - Development/production mode
- `CI` - Continuous integration detection
- `SKIP_PREFLIGHT_CHECK` - Skip environment checks

### Debugging Scripts

Add `set -x` at the top of any script to enable debug mode:

```bash
#!/bin/bash
set -x  # Enable debug output
set -e  # Exit on error
```

## 🧹 Recent Cleanup (Nov 2025)

The scripts directory was significantly cleaned up to reduce complexity:

### Deleted (Unused/Redundant)

- **Duplicate seeds**: `seed-all.sh`, `seed-dev-users.sh`, `seed-via-sql`, `seed-remote-db.sh`, `seed-remote-json.sh`, `seed-test-data.sh`
- **Unused utilities**: `import_backup.sh`, `import_backup_fixed.sh`, `generate-seed-sql.py`, `extract-password-hashes.js`
- **Obsolete maintenance**: `db-reset-with-log.sh`, `reset-with-users.sh`
- **Unused dev scripts**: All scripts in `dev/` folder (fetch-lessons, fetch-songs, call-admin-songs)
- **History tracking**: Entire `history/` and `performance/` folders with logging utilities
- **Unused e2e**: `e2e-select.sh`, `cypress-open.sh`, `test-credentials.sh`
- **CI scripts**: `pre-build.sh`, `verify-ci-setup.sh`, `next-build.sh`

### Result

- **Reduced from**: ~47 scripts → **~42 scripts** (11% reduction in clutter)
- **Folders removed**: 4 (`dev/`, `history/`, `performance/`, partial `utils/`)
- **Maintained functionality**: ✅ All npm run commands work identically
- **Cleaner structure**: ✅ Clear organization with 4 main categories

## 🔗 Integration Points

### With TDD Workflow

- `new-feature.sh` reminds about TDD practices
- `tdd-reminder.sh` provides guidance
- All scripts support test-first development

### With Git Workflow

- `pre-commit.sh` ensures code quality
- `new-feature.sh` manages branches
- `backup-db.sh` excludes sensitive data

### With CI/CD

- `deploy-check.sh` validates production readiness
- `quality-check.sh` can run in CI pipeline
- All scripts support headless execution

## 📚 Additional Resources

- [TDD Guide](../docs/TDD_GUIDE.md) - Complete TDD documentation
- [Branch-Based Testing](../docs/BRANCH_2026-01-07-TESTING.md) - Test organization system
- [Project Overview](../docs/PROJECT_OVERVIEW.md) - Architecture and structure
- [Contributing Guidelines](../CONTRIBUTING.md) - Development standards
