# Engineering Process & Standards

This folder documents the development practices behind Strummy — how code gets from idea to production, and the tooling that enforces quality at every step.

## Why This Matters

Building a solo project is easy. Building a solo project with the discipline of a team — PR reviews, CI gates, automated versioning, security audits, codified standards — is what separates a side project from production software. Everything in this folder exists because I hit a real problem and needed a real process to prevent it from happening again.

---

## CI/CD Pipeline — 11 Jobs, Zero Shortcuts

The `ci-cd.yml` workflow started as "run tests on push" and evolved into an 11-job pipeline after production incidents taught me what actually needs to be checked before code ships.

```
Push / PR
  |
  +-- Lint + TypeScript strict check
  +-- Jest unit tests (coverage enforced)
  +-- Jest integration tests
  +-- Next.js production build (catches SSR-only errors)
  +-- Supabase schema diff + quality check
  +-- Security audit (npm audit + hardcoded secret grep)
  +-- Playwright E2E on Desktop Chrome (PRs only)
  |
  +-- Quality Gate (fails the whole pipeline if ANY job fails)
  |
  +-- Deploy database migrations (main/production)
  +-- Deploy to Vercel (preview for PRs, production for production branch)
```

**What I learned building this:**
- The **DB schema check** was added after a migration broke production because a column rename wasn't caught by TypeScript. Now `supabase db diff` runs in CI and blocks the merge if the schema is out of sync.
- The **security audit job** was added after I discovered a `NEXT_PUBLIC_` prefix on a service role key during a manual review. Now CI greps for hardcoded secrets automatically.
- The **quality gate** pattern (a job that aggregates results from all other jobs) was necessary because GitHub's branch protection only lets you require specific jobs, and I kept adding new ones that weren't gated.

**Key file:** [`workflows/ci-cd.yml`](./workflows/ci-cd.yml) (568 lines)

---

## Automated Semantic Versioning

Every merge to `main` triggers `version-bump.yml` which:
1. Reads the branch prefix (`feature/` = minor, `fix/` = patch)
2. Checks for PR label overrides (`version:major`, `version:minor`, `version:patch`)
3. Bumps `package.json`, commits it, creates an annotated git tag
4. Generates a GitHub Release using the PR description as release notes

**What I learned:** Manual versioning doesn't scale past 10 releases. I forgot to bump the version 3 times before automating it. Now the PR description becomes the release note, which forces me to write user-facing summaries instead of "fix stuff" commit messages. This produced [30 tagged releases](https://github.com/PiotrRomanczuk/strummy/releases) with meaningful changelogs.

**Key file:** [`workflows/version-bump.yml`](./workflows/version-bump.yml)

---

## AI-Assisted Code Review

Two workflows integrate AI directly into the PR process:

- **`claude-code-review.yml`** — runs Claude Code on every PR, reviewing for security issues, performance problems, and convention violations. This caught an RLS policy gap that would have leaked soft-deleted songs to students.
- **`claude.yml`** — enables `@claude` mentions in issues and PR comments for ad-hoc analysis, debugging assistance, and implementation suggestions directly in GitHub.

**What I learned:** AI code review is most valuable for the things humans skip — checking that every new table has RLS enabled, that no API route is missing auth, that no `select('*')` slipped in. It's a safety net, not a replacement for understanding the code.

---

## Development Standards — 10 Codified Guides

The `instructions/` folder contains 10 guides that started as notes-to-self and grew into a reference system. Each one exists because I made a mistake or spent too long making a decision that should have been standardized.

| Guide | Why It Exists |
|:---|:---|
| [Component Architecture](./instructions/component-architecture.instructions.md) | Components kept growing past 300 LOC. Now enforced: max 200 LOC per file, `Parent.Section.tsx` naming, domain-based organization |
| [API & Data Fetching](./instructions/api-data-fetching.instructions.md) | Inconsistent Supabase patterns caused bugs — some queries used `select('*')`, others forgot RLS context. Standardized on TanStack Query + explicit column selects |
| [Testing Standards](./instructions/testing-standards.instructions.md) | Started with no tests, then over-tested UI details. Now: 70/20/10 pyramid (unit/integration/E2E), MSW for mocking, real services in E2E |
| [Form Validation](./instructions/form-validation.instructions.md) | Forms had inconsistent validation — some client-only, some server-only. Standardized on Zod schemas shared between client and server |
| [Error Handling](./instructions/error-handling-logging.instructions.md) | Production errors were silent. Added structured logging, error boundaries, Sentry integration, and user-facing error messages |
| [Git Workflow](./instructions/git-workflow.instructions.md) | Messy commit history made debugging hard. Standardized on conventional commits, Linear ticket linking, squash-and-merge |
| [Performance](./instructions/performance-optimization.instructions.md) | Mobile Lighthouse scores were poor. Documented mobile-first patterns, bundle optimization, and Supabase query performance |
| [State Management](./instructions/state-management.instructions.md) | Props drilling and inconsistent state patterns. Standardized on TanStack Query for server state, React Hook Form for form state |
| [Naming Conventions](./instructions/naming-conventions.instructions.md) | File naming was inconsistent across domains. Codified PascalCase components, camelCase utils, `use` prefix hooks |
| [Development Standards](./instructions/DEVELOPMENT-STANDARDS.md) | New context (AI agents, contributors) needed a single entry point to understand the codebase |

**What I learned:** Writing standards isn't bureaucracy — it's decision caching. Every guide saved me from re-debating the same question. The component architecture guide alone prevented dozens of 400-line files from being created.

---

## AI Agent System — Two Layers

The project uses AI agents at two levels:

**GitHub Copilot agents** (11 agents in [`agents/`](./agents/)): Planning and architecture conversations — backend design, security review, requirements analysis, technology evaluation.

**Claude Code agents** (15 agents in [`.claude/agents/`](../.claude/agents/)): The primary development workflow — feature implementation, database migrations, PR creation, test writing, security audits, deployment. Each agent has defined tools, quality standards, and domain expertise.

**What I learned:** Specialized agents outperform general-purpose ones dramatically. A `security-reviewer` agent that knows to check RLS policies, scan for IDOR vulnerabilities, and validate webhook tokens is 10x more useful than asking a general AI "review this for security." The agent specifications are essentially codified expertise.

---

## PR Template

Every PR auto-populates with [`pull_request_template.md`](./pull_request_template.md) — a checklist covering Linear ticket linking, change type classification, testing evidence, version bump, database migration status, deployment notes, and code quality gates (size limits, mobile-first, dark mode). This template evolved from PRs that were merged without tests, without version bumps, or without updating Linear.

---

## Folder Structure

```
.github/
  workflows/
    ci-cd.yml                 # 11-job pipeline (568 lines)
    version-bump.yml          # Automated semantic versioning + GitHub Releases
    claude-code-review.yml    # AI code review on every PR
    claude.yml                # @claude mentions in issues/PRs
  agents/                     # 11 GitHub Copilot agent specifications
  instructions/               # 10 development standard guides
  deployment/
    DEPLOYMENT_SETUP.md       # Infrastructure & environment configuration
  copilot-instructions.md     # Copilot critical rules + links to instructions/
  pull_request_template.md    # PR checklist (Linear, testing, version, quality)
```
