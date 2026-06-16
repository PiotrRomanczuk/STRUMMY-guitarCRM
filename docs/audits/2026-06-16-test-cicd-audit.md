# Test Suite & CI/CD Audit

**Date**: 2026-06-16
**Author**: Claude
**Scope**: The actual measured state of the test suites and the CI/CD pipeline, with every issue found. Companion remediation spec: [`specs/11-testing-cicd.md`](../specs/11-testing-cicd.md). Reference: [`TESTING.md`](../TESTING.md).
**Method**: Live runs (`test:ci`, `test:integration`, `test:rls`) on branch `chore/STRUM-test-cicd-audit` + static analysis of `.github/workflows/`, `jest.config*.ts`, `playwright.config.ts`, `.husky/`, `eslint.config.mjs`, `next.config.ts`, `tsconfig*.json`.

---

## Executive summary

The headline is **green by exclusion**. The unit suite reports all-passing — but only because ~51 test files are quarantined out of the run, integration has real failures, the RLS suite is 100% skipped, and CI actively filters TypeScript errors. The gates that exist are mostly non-blocking.

- ✅ **Unit suite is green** — 2,681/2,682 pass — **but** 51 files are excluded via `testPathIgnorePatterns`.
- ❌ **Integration is red** — 16 failing tests (Supabase client undefined).
- ❌ **RLS is not running** — the only RLS suite is `describe.skip` (4 tests skipped). ADR-0001 mandates RLS testing; today there is none.
- ⚠️ **Coverage 53%** (lines/stmts) vs a **70% goal** vs a **non-blocking** CI check vs **30–40%** jest thresholds vs a README claiming **70%** — four different numbers, none enforced.
- ❌ **CI masks failures**: `tsc` errors filtered with `grep -v`; integration runs with `--passWithNoTests`; coverage non-blocking; `npm audit` warn-only; one deploy step `continue-on-error`.
- ❌ **E2E never gates main or PRs** — Playwright runs only on `production` pushes (single Desktop Chrome project).
- ❌ **Bruno API suite runs in no CI** — 168 `.bru` requests (the real-HTTP API/bearer-contract layer, and Phase 0.3's acceptance) exist but are never executed by any workflow.
- ⚠️ **Pre-commit runs the full `npm run quality`** (typecheck + lint + jest + coverage + DB + Lighthouse) on every commit → multi-minute commits.

---

## Measured test state (2026-06-16)

| Suite           | Command                            | Result                                                                    | Notes                                                                                                                                                              |
| --------------- | ---------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Unit**        | `test:ci` (`jest --ci --coverage`) | **182 suites, 2,682 tests → 2,681 pass, 1 skip, 0 fail** (131 s)          | Green **only** with 51 files quarantined out                                                                                                                       |
| **Integration** | `test:integration`                 | **17 suites → 2 fail / 15 pass; 239 tests → 16 fail / 223 pass** (exit 1) | Failures: `__tests__/api/song/export.integration.test.ts` + 1 more — `TypeError: Cannot read properties of undefined (reading 'from')` (Supabase client undefined) |
| **RLS**         | `test:rls`                         | **1 suite skipped, 4 tests skipped** (exit 0)                             | Entire RLS suite is `describe.skip`; needs real Supabase. Exit 0 because skipped ≠ failed                                                                          |
| **E2E**         | Playwright                         | not run here                                                              | CI runs it **only** on `production` pushes, Desktop Chrome only                                                                                                    |
| **Bruno (API)** | `test:bruno` (`run-bruno.sh`)      | not run here (needs live server + seeded creds)                           | **168 `.bru` requests across ~20 domains** + 4 envs + `@usebruno/cli` dep — but wired into **zero CI workflows**                                                   |

**Coverage** (`coverage/coverage-summary.json`): **lines 53.13% · statements 53.13% · functions 55.17% · branches 78.26%.**

---

## Findings

Severity: **S1** breaks/masks correctness signal · **S2** lets bad code merge or blocks devs · **S3** real debt · **S4** hygiene.

### A. Test suite health

| #   | Sev    | Finding                                                                                                                                                                     | Location                                                                    | Fix                                                                                                         |
| --- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| A1  | **S1** | **RLS suite is 100% skipped.** Only one `*.rls.test.ts` exists and it is `describe.skip` (4 tests). ADR-0001 makes RLS _the_ security boundary, yet nothing verifies it.    | `jest.config.rls.ts`, the single `*.rls.test.ts`                            | Un-skip + provision a real Supabase target (branch DB); add the per-table RLS tests MASTER_SPEC §3.1 lists. |
| A2  | **S1** | **Green-by-exclusion.** 51 individual test files are quarantined via `testPathIgnorePatterns`; the "all green" unit result hides them.                                      | `jest.config.ts` (~lines 105–163)                                           | Track each in a burn-down (issue per category); fix or delete; ratchet the list to zero.                    |
| A3  | **S2** | **Integration suite is red** — 16 failures from an undefined Supabase client (`reading 'from'`), i.e. missing test env/mock wiring.                                         | `__tests__/api/song/export.integration.test.ts` (+1)                        | Fix the integration Supabase harness (env or mock); make `test:integration` green and gate it.              |
| A4  | **S2** | **Coverage is unenforced and inconsistent.** Measured 53% lines; jest thresholds 30/35/40/40; CI check non-blocking; README claims 70%.                                     | `jest.config.ts` thresholds; `ci-cd.yml:119`; `.github/workflows/README.md` | Pick one source of truth; make the CI check blocking at today's real number (≈50%) and ratchet toward 70%.  |
| A5  | **S3** | **Duplicate test files** — `google.test.ts` in 4 locations, `rate-limiter.test.ts` in 5, plus ~8 other pairs (colocated vs `__tests__/`). Same test runs twice or diverges. | `lib/`, `__tests__/`, colocated                                             | Keep one authoritative copy (colocated with source); delete the rest; add a convention in CONTRIBUTING.     |
| A6  | **S3** | **No coverage thresholds on integration/RLS configs**, and no per-path thresholds for high-risk dirs (`lib/auth`, `app/api`).                                               | `jest.config.integration.ts`, `jest.config.rls.ts`                          | Add per-path thresholds for auth/api; add a (relaxed) global to integration.                                |
| A7  | **S3** | **Bare worktree-ignore pattern** in integration/RLS configs (`/.claude/worktrees/`) blocks worktree runs; only `jest.config.ts` uses the smart pattern.                     | `jest.config.integration.ts`, `jest.config.rls.ts`                          | Reuse the dynamic worktree pattern from `jest.config.ts`.                                                   |
| A8  | **S4** | **`jest.config.simple.ts` is unused** and conflicts (ts-jest vs babel, 70% thresholds, broad `testMatch`).                                                                  | `jest.config.simple.ts`                                                     | Delete or document as a reference.                                                                          |

### B. CI/CD workflows (`.github/workflows/ci-cd.yml`)

| #   | Sev    | Finding                                                                                                                                                                                     | Location                 | Fix                                                                               |
| --- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| B1  | **S1** | **TypeScript errors are filtered out.** `tsc --noEmit` output is piped through `grep -v` to drop `notification-service.ts`, `TS2307`, `TS2875`, `TS7026`, `migrate-remote.ts`, wrapped in ` |                          | true`. Real type errors pass the gate.                                            | `ci-cd.yml:73–80`         | Fix the underlying errors (regenerate Supabase types, etc.); remove the filter; let `tsc` exit-code gate. |
| B2  | **S1** | **E2E never gates main or PRs.** The `e2e-tests` job is `if: github.ref == 'refs/heads/production'`, Desktop Chrome only. Code reaches `main` (and deploys to preview) with zero E2E.       | `ci-cd.yml:263, 273`     | Add a `@smoke` E2E job to the PR/main path (Desktop Chrome) per MASTER_SPEC §3.3. |
| B2b | **S2** | **Integration tests run with `--passWithNoTests`** — if the files vanish, the job passes silently.                                                                                          | `ci-cd.yml:117`          | Remove the flag; require ≥1 integration test.                                     |
| B3  | **S2** | **Coverage check is non-blocking** (explicitly labelled "non-blocking").                                                                                                                    | `ci-cd.yml:119`          | Make blocking at the real number; ratchet.                                        |
| B4  | **S2** | **`continue-on-error: true` on a deploy-database step** — a failed migration push doesn't fail the pipeline; app can deploy against a drifted schema.                                       | `ci-cd.yml:449`          | Remove `continue-on-error`; migrations must hard-fail.                            |
| B5  | **S2** | **Manual deploy bypasses all gates.** `deploy.yml` (`workflow_dispatch`) has no lint/test/typecheck.                                                                                        | `deploy.yml`             | Require the quality-gate to have passed, or re-run checks in the deploy job.      |
| B6  | **S2** | **version-bump runs no tests** before bumping + tagging.                                                                                                                                    | `version-bump.yml`       | Gate the bump on a successful CI run of `main`.                                   |
| B7  | **S3** | **Node version mismatch** — `e2e-tests` uses Node 22, every other job Node 20.                                                                                                              | `ci-cd.yml:268` vs `:15` | Standardize on one (20 LTS or 24).                                                |
| B8  | **S3** | **`npm audit` is warn-only** (`                                                                                                                                                             |                          | echo "::warning::"`) despite 32 advisories (12 high).                             | `ci-cd.yml` security step | Fail on `--audit-level=high` with a maintained allowlist.                                                 |
| B9  | **S3** | **Mock Supabase secrets as defaults** (`https://example.supabase.co` / `mock-key`) let the build "succeed" against a fake backend when secrets are absent.                                  | `ci-cd.yml` env block    | Fail fast if required secrets are missing.                                        |
| B10 | **S4** | **README drift** — `.github/workflows/README.md` says "Cypress" and "70% coverage"; reality is Playwright and a non-blocking check.                                                         | workflows `README.md`    | Update to match.                                                                  |

### C. Git hooks

| #   | Sev    | Finding                                                                                                                                                                            | Location                                 | Fix                                                                                               |
| --- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------- |
| C1  | **S2** | **Pre-commit runs the entire `npm run quality`** (typecheck + lint + full jest + coverage + DB check + Lighthouse) on every commit → multi-minute commits (observed this session). | `.husky/pre-commit`                      | Replace with `lint-staged` (lint/format changed files only); move the heavy suite to pre-push/CI. |
| C2  | **S3** | **No `lint-staged`** configured — hooks process the whole codebase, not staged files.                                                                                              | `package.json` / missing `.lintstagedrc` | Add `lint-staged` globs.                                                                          |
| C3  | **S3** | **Pre-push runs full-codebase ESLint + `tsc`** (~30–60 s/push).                                                                                                                    | `.husky/pre-push`                        | Keep typecheck; scope lint via lint-staged or cache.                                              |

### D. Type safety & lint

| #   | Sev    | Finding                                                                                                                                                                                           | Location            | Fix                                                                  |
| --- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------- |
| D1  | **S2** | **`@typescript-eslint/no-explicit-any` is `warn`, not `error`** — `any` never blocks a merge.                                                                                                     | `eslint.config.mjs` | Set to `error`; fix the existing offenders.                          |
| D2  | **S2** | **~37 production `any`s** (worst: `lib/testing/test-utils.ts` ×4, `components/debug/DatabaseStatus.tsx` ×4, `components/ui/drawer.tsx` ×4, `app/api/lessons/handlers/*`). Road-to-100 target ≤15. | various             | Replace with real types / generics; `app/api` first.                 |
| D3  | **S3** | **`no-console` allows `warn`/`error`** in prod, bypassing the ADR-0003 Pino logger.                                                                                                               | `eslint.config.mjs` | Tighten to `error` outside test/debug; route through `@/lib/logger`. |
| D4  | **S3** | **No `typecheck` npm script** — `tsc --noEmit` is invoked ad hoc; CI and hooks don't share one command.                                                                                           | `package.json`      | Add `"typecheck": "tsc --noEmit"`; use it in CI + pre-push.          |
| D5  | **S3** | **~61 `eslint-disable` directives**, several file-wide (e.g. AI registry).                                                                                                                        | various             | Convert to line-scoped, justified disables.                          |
| D6  | **S4** | Good baseline to preserve: `next.config.ts` does **not** set `ignoreBuildErrors`/`ignoreDuringBuilds`; `tsconfig` is `strict`; no `@ts-ignore`/`@ts-nocheck` in prod.                             | —                   | Keep; add a lint rule banning `@ts-ignore`.                          |

### E. E2E / Playwright

| #   | Sev    | Finding                                                                                                                                                | Location                        | Fix                                                       |
| --- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- | --------------------------------------------------------- |
| E1  | **S2** | **Leftover `cypress/` directory** (config + specs) despite the Playwright migration. Dead code / confusion.                                            | `cypress/`, `cypress.config.ts` | Port the last spec, delete `cypress/` (MASTER_SPEC §3.5). |
| E2  | **S3** | **Device-matrix explosion** — 7 projects × ~25 specs = ~175 runs if the full matrix runs. CI only runs Desktop Chrome; the matrix is a local foot-gun. | `playwright.config.ts`          | Reserve multi-device for `@smoke`; document the strategy. |
| E3  | **S3** | **Only 2 specs tagged `@smoke`** — no fast PR subset defined for a CI gate.                                                                            | `tests/e2e/**`                  | Curate a `@smoke` critical-path set for the PR gate (B2). |
| E4  | **S4** | **2 CI retries** with no flake reporting — masks flakiness silently.                                                                                   | `playwright.config.ts`          | Keep retries but log/aggregate flakes.                    |

### F. Dependencies

| #   | Sev    | Finding                                                                             | Location  | Fix                                                    |
| --- | ------ | ----------------------------------------------------------------------------------- | --------- | ------------------------------------------------------ |
| F1  | **S3** | **32 advisories (12 high)** on the default branch; **no `.github/dependabot.yml`**. | repo root | Add dependabot; triage highs; the CI audit gate is B8. |

### G. Bruno API contract tests

A full real-HTTP API suite exists and is entirely outside the test/CI story.

| #   | Sev    | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Location                                    | Fix                                                                                                                                                   |
| --- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1  | **S2** | **168 Bruno requests, run by no CI workflow.** `bruno/strummy/` covers ~20 domains (auth, api-keys, lessons, assignments, song, exports, widget, oauth2, spotify, admin, cron/health…); `@usebruno/cli` is a dep; `scripts/ci/run-bruno.sh` + `test:bruno` exist; 4 envs (local/preview/production/production-readonly). But `rg bruno .github/workflows` is empty — it never runs. This is also the **stated acceptance for Phase 0.3** (bearer auth → `withApiAuth`). | `bruno/strummy/`, `scripts/ci/run-bruno.sh` | Add a CI job: `run-bruno.sh preview --get-only` (read-only smoke) on the PR/main path; full suite on a scheduled/manual job against a seeded preview. |
| G2  | **S3** | **No CI seam for the auth-gated subset.** The suite needs `ADMIN/TEACHER/STUDENT` creds + `API_KEY` + `CRON_SECRET` to exercise mutations; only the `--get-only` / `production-readonly` path is safe without seeded state.                                                                                                                                                                                                                                             | `run-bruno.sh` env block                    | Seed a preview test account + `gcrm_` key in CI secrets so the auth-gated subset runs; keep mutations off `production`.                               |
| G3  | **S4** | **Bruno absent from the test pyramid docs** — `TESTING.md` and the MASTER_SPEC pyramid don't mention the API-contract layer at all, so its value/maintenance is invisible.                                                                                                                                                                                                                                                                                              | `TESTING.md`                                | Add Bruno as the API-contract tier (above integration, below E2E) in TESTING.md.                                                                      |

---

## Severity rollup

| Sev    | Count | Items                                                                                   |
| ------ | ----- | --------------------------------------------------------------------------------------- |
| **S1** | 4     | A1 (RLS skipped), A2 (green-by-exclusion), B1 (tsc filtered), B2 (E2E never gates main) |
| **S2** | 12    | A3, A4, B2b, B3, B4, B5, B6, C1, D1, D2, E1, **G1**                                     |
| **S3** | 14    | A5, A6, A7, B7, B8, B9, C2, C3, D3, D4, D5, E2, E3, F1, **G2**                          |
| **S4** | 6     | A8, B10, D6, E4, **G3**, (misc)                                                         |

**The four S1s are the spine of the problem:** the suite _looks_ green and _looks_ type-clean, but RLS isn't tested, 51 files are excluded, type errors are filtered, and E2E never runs before code hits `main`. Fixing these restores an honest signal; everything else hardens it.

---

## Cross-references

- Remediation plan with acceptance criteria: [`specs/11-testing-cicd.md`](../specs/11-testing-cicd.md)
- Strategy + commands: [`TESTING.md`](../TESTING.md) (Known Issues section)
- Phase-0 CI items: [`specs/00-phase-0-restore-truth.md`](../specs/00-phase-0-restore-truth.md) §0.6
- Master plan: [`MASTER_SPEC.md`](../MASTER_SPEC.md) §3.3
