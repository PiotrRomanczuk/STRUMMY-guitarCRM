---
created: 2026-06-16
updated: 2026-06-16
feature: Testing & CI/CD
phase: 0.6 / 4
status: superseded
---

> **Superseded (2026-07-18)** by docs/app-blueprint/91-testing-strategy.md.

# Spec 11 — Testing & CI/CD

> Part of the [MASTER_SPEC](../MASTER_SPEC.md) (§3.3). Findings: [audits/2026-06-16-test-cicd-audit.md](../audits/2026-06-16-test-cicd-audit.md). Reference: [TESTING.md](../TESTING.md). Overlaps [Phase 0](./00-phase-0-restore-truth.md) §0.6 (restore CI signal) and Phase 4 (testing to trustworthy).

## Goal

Restore an **honest** test/CI signal and then make it **blocking**. Today the suite looks green and type-clean while RLS is untested, 51 files are excluded, `tsc` errors are filtered, integration is red, and E2E never runs before `main`. The end state: every gate measures what it claims, nothing is masked, and the PR path blocks on lint + typecheck + unit + a smoke E2E + a real (ratcheting) coverage floor.

## Definition of Done

- `test:integration` and the unit suite are green with **zero** quarantined files (or each remaining exclusion is tracked with a removal date).
- `test:rls` actually runs against a real Supabase target and covers every core table (MASTER_SPEC §3.1).
- CI runs `tsc --noEmit` **unfiltered** and fails on any error; `@typescript-eslint/no-explicit-any` is `error`.
- The PR path gates on lint + typecheck + unit + `@smoke` E2E + a **read-only Bruno API smoke** + a **blocking** coverage floor (ratcheting from ~50%).
- No `continue-on-error`/`--passWithNoTests`/`grep -v`/`|| true` masking a quality gate.
- Pre-commit is fast (lint-staged); the heavy suite runs in pre-push/CI.
- `cypress/` deleted; `dependabot.yml` present.

---

## Phase 11A — Stop masking (restore honest signal) · maps to Phase 0.6

These make the existing signal truthful. Low risk, high value; do first.

| Item                                     | Fix                                                                                                                                                                  | Done when (acceptance)                                                              |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **11A.1** Unfilter typecheck (B1)        | Remove the `grep -v` / `                                                                                                                                             |                                                                                     | true`around`tsc --noEmit`in`ci-cd.yml:73–80`; add `"typecheck": "tsc --noEmit"`to`package.json`; fix the masked errors (regenerate Supabase types for `notification-service.ts`; resolve TS2307/2875/7026; type `migrate-remote.ts`). | `npm run typecheck` exits 0 locally **and** in CI with no filter; `rg "grep -v \"error TS" .github` returns nothing. |
| **11A.2** Fix integration red (A3)       | Repair the integration Supabase harness so the client isn't `undefined` (env or mock) in `__tests__/api/song/export.integration.test.ts` + the second failing suite. | `npm run test:integration` exits 0 (currently 16 fail).                             |
| **11A.3** Drop `--passWithNoTests` (B2b) | Remove the flag from the integration CI step (`ci-cd.yml:117`).                                                                                                      | Removing all integration tests makes CI **fail**, not pass.                         |
| **11A.4** Remove deploy masking (B4)     | Delete `continue-on-error: true` on the migration push step (`ci-cd.yml:449`).                                                                                       | A failing `supabase db push` fails the pipeline.                                    |
| **11A.5** Un-skip RLS (A1)               | Provision a real Supabase target (a branch DB via `mcp__supabase__create_branch`); remove `describe.skip` from the RLS suite; wire `test:rls` env.                   | `npm run test:rls` runs ≥1 real assertion (exit reflects pass/fail, not "skipped"). |

## Phase 11B — Quarantine burn-down + de-dup · maps to Phase 4

| Item                                              | Fix                                                                                                                                                                                       | Done when                                                                                                                 |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **11B.1** Burn down the 51 quarantined files (A2) | Triage `testPathIgnorePatterns` (`jest.config.ts` ~105–163) into: fix / delete-(component-gone) / dedupe. Start with the 8 auth-form tests. Track remaining as a list with removal dates. | Quarantine list shrinks to 0 (or each entry has a dated owner); `npm test` suite count rises by the un-quarantined count. |
| **11B.2** Resolve duplicate tests (A5)            | Keep one authoritative copy per test (colocated with source); delete the rest. Worst: `google.test.ts` ×4, `rate-limiter.test.ts` ×5. Add a CONTRIBUTING rule.                            | No test basename resolves to >1 file (outside intentional per-role pairs).                                                |
| **11B.3** RLS breadth (A1 → §3.1)                 | Add `assignments`, `profiles`, `practice_sessions`, `student_repertoire` RLS tests + the §0.5 `v_teacher_lesson_trends` view test.                                                        | Each core table has an RLS test asserting teacher-isolation + student-own-only.                                           |
| **11B.4** Worktree pattern (A7)                   | Reuse the dynamic worktree ignore from `jest.config.ts` in the integration + RLS configs.                                                                                                 | `npm test`/`test:integration` run identically from a worktree and the repo root.                                          |
| **11B.5** Delete `jest.config.simple.ts` (A8)     | Remove the unused conflicting config.                                                                                                                                                     | File gone; no script references it.                                                                                       |

## Phase 11C — Make gates blocking · maps to Phase 4 / §3.3

Only after 11A/11B, so blocking gates don't wedge the pipeline.

| Item                                       | Fix                                                                                                                                                                                                                                                                                             | Done when                                                                                                                        |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **11C.1** Coverage floor (A4/B3)           | Make the CI coverage check **blocking** at today's real number (~50% lines); set `jest.config.ts` thresholds to match; reconcile the README. Ratchet upward per PR.                                                                                                                             | A PR that drops coverage below the floor fails CI; one number across config + CI + README.                                       |
| **11C.2** Smoke E2E on PRs (B2)            | Add a `playwright test --grep @smoke` job (Desktop Chrome) to the PR/main path; curate the `@smoke` set; standardize Node version (B7).                                                                                                                                                         | A PR with a broken critical path fails CI; E2E no longer `production`-only.                                                      |
| **11C.3** `no-explicit-any: error` (D1/D2) | Flip the rule; fix the ~37 prod `any`s (`app/api/lessons/handlers/*` first).                                                                                                                                                                                                                    | `npm run lint` fails on a new `any`; prod `any` count ≤ target.                                                                  |
| **11C.4** `no-console` + logger (D3)       | Tighten `no-console` to `error` outside test/debug; route through `@/lib/logger` (ADR-0003).                                                                                                                                                                                                    | New `console.*` in app code fails lint.                                                                                          |
| **11C.5** Audit gate + dependabot (B8/F1)  | Make `npm audit` fail at `--audit-level=high` with an allowlist; add `.github/dependabot.yml`.                                                                                                                                                                                                  | Highs are tracked and either fixed or allowlisted; dependabot opens update PRs.                                                  |
| **11C.6** Wire Bruno into CI (G1/G2)       | Add a CI job running `scripts/ci/run-bruno.sh preview --get-only` (read-only API smoke) on the PR/main path; seed a preview test account + `gcrm_` key in CI secrets for the auth-gated subset; full suite on a scheduled/manual job. Doubles as Phase 0.3 acceptance (bearer → `withApiAuth`). | The 168-request collection runs in CI (read-only on PRs); a broken API contract fails the run; mutations never hit `production`. |

## Phase 11D — Developer ergonomics

| Item                                                 | Fix                                                                                                   | Done when                                                   |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **11D.1** Fast pre-commit (C1/C2)                    | Replace `npm run quality` in `.husky/pre-commit` with `lint-staged` (lint/format changed files only). | A one-file commit completes in seconds, not minutes.        |
| **11D.2** Pre-push scope (C3)                        | Keep `tsc --noEmit`; scope lint via lint-staged/cache.                                                | Push hook is typecheck-bound, not full-codebase-lint-bound. |
| **11D.3** Delete cypress (E1)                        | Port the last `cypress/` spec to Playwright; delete `cypress/` + `cypress.config.ts`.                 | `cypress/` gone; no cypress refs remain.                    |
| **11D.4** Manual-deploy + version-bump gates (B5/B6) | Require the quality-gate before `deploy.yml`; gate `version-bump.yml` on a green `main` CI.           | Neither can run on red `main`.                              |

---

## Current state (verified 2026-06-16)

| Suite            | Result                                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| Unit (`test:ci`) | 2,681/2,682 pass — **with 51 files quarantined out**                                                |
| Integration      | **16 fail** / 223 pass (Supabase client undefined)                                                  |
| RLS              | **0 run** — 4 skipped (`describe.skip`)                                                             |
| Coverage         | lines 53.1% · funcs 55.2% · branches 78.3% (goal 70%, CI check non-blocking)                        |
| E2E              | Playwright on `production` pushes only; `cypress/` still present                                    |
| Bruno (API)      | **168 requests, ~20 domains, 4 envs — run by no CI workflow**; `@usebruno/cli` + `test:bruno` exist |

## Dependencies & out of scope

- **Depends on** a real Supabase target for RLS (11A.5) — a Supabase branch DB is enough; do **not** point `test:rls` at production.
- **Sequencing:** 11A (stop masking) → 11B (burn-down) → 11C (make blocking). Flipping gates blocking before the suite is honest will wedge the pipeline.
- **Out of scope:** rewriting the app code the tests cover; the broader v1/v2/v3 editorial deletion (gate 5, per-feature specs); production promotion policy.
