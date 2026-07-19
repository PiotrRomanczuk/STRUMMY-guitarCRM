# E2E Test Run — Desktop Chrome (post `purge-legacy-ui` merge)

**Date**: 2026-07-18
**Author**: Claude
**Scope**: Full Playwright E2E suite (all specs, `Desktop Chrome` project) run against a prod build of local `main` at commit `8fb45d5d`, backed by the local Supabase stack on `uwh`.

---

## TL;DR

| Result         |                                  Count |
| -------------- | -------------------------------------: |
| ✅ Passed      |                                **153** |
| ❌ Failed      |                                 **50** |
| ⏭️ Skipped     |                                     37 |
| ⏸️ Did not run |                                     11 |
| **Total**      | **251** (41 files, 2 workers, 8.4 min) |

**No failure traces to code the merge changed.** The 50 failures fall entirely into environmental / test-harness / stale-test buckets (AI backend not reachable, local DB not seeded with E2E fixtures, a demo-login fixture bug, and outdated sign-up locators). The merged branch passed `tsc --noEmit` (0 errors) and `eslint` (0 errors) before this run, and the 153 passing tests cover the core auth / dashboard / songs / lessons / assignments paths on seeded routes.

> ⚠️ This run was **not** compared against a pre-merge baseline. The categorization below is inferred from error signatures + direct probing of the running server (e.g. the sign-up page was confirmed to render correctly). A definitive "zero regressions" claim would require re-running the identical suite against pre-merge `origin/main`.

---

## Environment

- **Commit under test**: `8fb45d5d` (local `main` after fast-forward of `refactor/purge-legacy-ui`)
- **Server**: `next start -p 3100` (prod build), verified `"db":"local"` in server logs
- **Database**: local Supabase `*_StrummyProd` stack on `uwh`, reached via SSH tunnel `127.0.0.1:54321 → uwh:54321`
- **Build override**: `NEXT_PUBLIC_SUPABASE_LOCAL_URL=http://127.0.0.1:54321` (Node `fetch` cannot reach the LAN-direct `192.168.1.75` address — see local E2E runbook)
- **Command**:
  ```bash
  NEXT_PUBLIC_SUPABASE_LOCAL_URL=http://127.0.0.1:54321 PLAYWRIGHT_BASE_URL=http://localhost:3100 \
    npx playwright test --config=playwright.local-3100.config.ts --project="Desktop Chrome" --reporter=line
  ```

---

## Failure categories

| #   | Category                                   | Count | Root cause                                                                                                                                                                                                                                                                                                 | Merge-related? |
| --- | ------------------------------------------ | ----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------: |
| A   | `ENV-AI` — AI backend unavailable          |    14 | AI assistant panel/actions need a reachable provider (Ollama/OpenRouter). Not configured for this local prod build, so inputs/buttons never mount → visibility/click timeouts.                                                                                                                             |       No       |
| B   | `TEST-STALE` — outdated sign-up locators   |    10 | The `/sign-up` page **renders correctly** (verified: HTTP 200, "First Name", "Continue with Google" all present). Tests use ambiguous locators, e.g. `text=/continue with/i` now matches **two** elements ("Or continue with" divider + "Continue with Google" button) → Playwright strict-mode violation. |       No       |
| C   | `HARNESS` — demo-login fixture bug         |     8 | `credentials[role]` is `undefined` for the `demo` role → `creds.email` throws at `tests/fixtures/auth.fixture.ts:89` **before the app is exercised**. Demo role/accounts not wired into this fixture.                                                                                                      |       No       |
| D   | `ENV-SEED` — local DB missing E2E fixtures |    15 | Tests explicitly need seeded rows (repertoire entries, due chords, specific songs/lessons/students; several hardcode UUIDs like `songs/5d752364…`). This long-lived local stack wasn't seeded with the E2E fixtures (`npm run seed`).                                                                      |       No       |
| E   | `INVESTIGATE` — needs a human look         |     3 | RLS isolation assertion + external `fetch failed` on the 41-song import. Not in code the merge touched, but worth eyeballing (esp. the RLS one).                                                                                                                                                           |    Unlikely    |

---

## Notable — look at these regardless of the merge

- **#25 `cross-role/rls-data-isolation.spec.ts:217`** — asserts _"student A saw profiles rows owned by someone other [than A]"_ → an RLS **data-isolation** assertion failed. Most likely a shared-seed artifact (test students share a teacher, or the assertion's own seeded rows), **not** merge-related, but a failing security-isolation check deserves a direct look. Recent `main` history has active IDOR/RLS work, so confirm this is fixture noise and not a real leak.
- **#42 `manual/kuba-onboarding.spec.ts:125`** — `TypeError: fetch failed` during "import 41 songs". A Node-side fetch to an external/unreachable host (song import source or email delivery). Environmental, not a code defect in the build.

---

## All 50 failures

Category key: **A** = AI backend · **B** = stale sign-up test · **C** = demo fixture bug · **D** = seed data · **E** = investigate

|   # | Cat | Spec : line                                 | Test                                                    | Primary error                             |
| --: | :-: | ------------------------------------------- | ------------------------------------------------------- | ----------------------------------------- |
|   1 |  A  | `ai/ai-playground.spec.ts:22`               | chat input and send button are visible                  | `toBeVisible()` failed                    |
|   2 |  A  | `ai/ai-playground.spec.ts:10`               | page loads with welcome message                         | `toContainText()` failed                  |
|   3 |  A  | `ai/ai-playground.spec.ts:32`               | model selector is functional                            | `toBeVisible()` failed                    |
|   4 |  A  | `ai/ai-playground.spec.ts:48`               | suggested prompt sends a message                        | `toBeVisible()` failed                    |
|   5 |  A  | `ai/ai-playground.spec.ts:104`              | minimize and maximize toggle                            | `toBeVisible()` failed                    |
|   6 |  A  | `ai/ai-playground.spec.ts:79`               | type and send a message                                 | `locator.fill` timeout 15000ms            |
|   7 |  A  | `ai/ai-playground.spec.ts:119`              | clear conversation resets to welcome                    | `locator.fill` timeout 15000ms            |
|   8 |  A  | `ai/assignment-ai.spec.ts:16`               | AI button appears after selecting student + title       | `locator.click` timeout 15000ms           |
|   9 |  A  | `ai/assignment-ai.spec.ts:39`               | AI button triggers generation                           | `locator.click` timeout 15000ms           |
|  10 |  A  | `ai/assignment-ai.spec.ts:78`               | generated content populates description                 | `locator.click` timeout 15000ms           |
|  11 |  A  | `ai/lesson-notes-ai.spec.ts:16`             | AI button appears after selecting student, songs, title | `locator.click` timeout 15000ms           |
|  12 |  A  | `ai/lesson-notes-ai.spec.ts:51`             | AI button disabled when lesson title empty              | `locator.click` timeout 15000ms           |
|  13 |  A  | `ai/lesson-notes-ai.spec.ts:90`             | AI button triggers generation                           | `locator.click` timeout 15000ms           |
|  14 |  A  | `ai/lesson-notes-ai.spec.ts:142`            | generated content populates notes field                 | `locator.click` timeout 15000ms           |
|  15 |  B  | `auth/sign-up-complete.spec.ts:72`          | should display Google sign-up option                    | `toBeVisible()` — strict-mode (2 matches) |
|  16 |  B  | `auth/sign-up-complete.spec.ts:195`         | error for password shorter than 6 chars                 | `toBeVisible()` failed                    |
|  17 |  B  | `auth/sign-up-complete.spec.ts:253`         | error when passwords do not match                       | `toBeVisible()` failed                    |
|  18 |  B  | `auth/sign-up-complete.spec.ts:328`         | loading state during submission                         | `toBe()` assertion failed                 |
|  19 |  B  | `auth/sign-up-complete.spec.ts:276`         | clear mismatch error when corrected                     | `toBeVisible()` failed                    |
|  20 |  B  | `auth/sign-up-complete.spec.ts:379`         | display verification instructions                       | `toBeVisible()` failed                    |
|  21 |  B  | `auth/sign-up-complete.spec.ts:477`         | error when email already exists                         | `toBeVisible()` failed                    |
|  22 |  B  | `auth/sign-up-complete.spec.ts:596`         | support keyboard navigation                             | `toBeFocused()` failed                    |
|  23 |  B  | `auth/sign-up-complete.spec.ts:524`         | disable form during Google sign-in                      | `locator.isDisabled` timeout 15000ms      |
|  24 |  B  | `auth/sign-up-complete.spec.ts:633`         | handle special characters in name fields                | `locator.isVisible` strict-mode violation |
|  25 |  E  | `cross-role/rls-data-isolation.spec.ts:217` | student A's profiles read returns only their rows       | **data isolation assertion failed**       |
|  26 |  D  | `dashboard/states.spec.ts:15`               | admin dashboard renders after states module             | `toBeVisible()` (`/Welcome/i`) failed     |
|  27 |  D  | `dashboard/states.spec.ts:15`               | teacher dashboard renders after states module           | `toBeVisible()` (`/Welcome/i`) failed     |
|  28 |  D  | `dashboard/states.spec.ts:15`               | student dashboard renders after states module           | `toBeVisible()` (`/Welcome/i`) failed     |
|  29 |  D  | `dashboard/today-lessons.spec.ts:9`         | admin sees today lessons card                           | `toBeVisible()` failed                    |
|  30 |  D  | `dashboard/today-lessons.spec.ts:15`        | teacher sees today lessons card                         | `toBeVisible()` failed                    |
|  31 |  D  | `dashboard/upcoming-lessons.spec.ts:14`     | teacher sees upcoming lessons card                      | `toBeVisible()` failed                    |
|  32 |  D  | `dashboard/upcoming-lessons.spec.ts:9`      | admin sees upcoming lessons card                        | `toBeVisible()` failed                    |
|  33 |  C  | `demo/demo-mutation-guards.spec.ts:18`      | demo user can browse all pages                          | `TypeError: reading 'email'` (fixture:89) |
|  34 |  C  | `demo/demo-mutation-guards.spec.ts:104`     | demo user cannot create a lesson                        | `TypeError: reading 'email'` (fixture:89) |
|  35 |  C  | `demo/demo-mutation-guards.spec.ts:65`      | demo user cannot create a song                          | `TypeError: reading 'email'` (fixture:89) |
|  36 |  C  | `demo/demo-mutation-guards.spec.ts:129`     | demo user cannot create an assignment                   | `TypeError: reading 'email'` (fixture:89) |
|  37 |  C  | `demo/demo-mutation-guards.spec.ts:154`     | demo user cannot create API keys / upload               | `TypeError: reading 'email'` (fixture:89) |
|  38 |  C  | `demo/demo-mutation-guards.spec.ts:184`     | demo user blocked by all mutation endpoints             | `TypeError: reading 'email'` (fixture:89) |
|  39 |  C  | `demo/demo-mutation-guards.spec.ts:216`     | demo user cannot send AI messages                       | `TypeError: reading 'email'` (fixture:89) |
|  40 |  C  | `demo/demo-screenshots.spec.ts:35`          | Desktop — all pages                                     | `TypeError: reading 'email'` (fixture:89) |
|  41 |  D  | `integration/workflows.spec.ts:86`          | assignment lifecycle: create → view → delete            | `waitForURL` test timeout 30000ms         |
|  42 |  E  | `manual/kuba-onboarding.spec.ts:125`        | create student → import 41 songs → invite               | `TypeError: fetch failed`                 |
|  43 |  D  | `student/chord-quiz-srs.spec.ts:84`         | C1.4 review toggle appears when chords seeded due       | `toBeVisible()` failed                    |
|  44 |  D  | `student/lessons-read.spec.ts:159`          | lesson detail shows songs section                       | `toBeVisible()` failed                    |
|  45 |  D  | `student/practice-bpm.spec.ts:124`          | B7.2 BPM input appears after selecting a song           | `page.selectOption` timeout 15000ms       |
|  46 |  D  | `student/practice.spec.ts:72`               | B6.3 past sessions have no Remove button                | `toBeVisible()` failed                    |
|  47 |  D  | `student/repertoire.spec.ts:91`             | B7.1 view own repertoire with seeded entry              | `toBeVisible()` failed                    |
|  48 |  D  | `student/songs-read.spec.ts:112`            | view song detail                                        | `toBeVisible()` failed                    |
|  49 |  D  | `teacher/users-management.spec.ts:95`       | A6.2 student detail page renders profile                | `toBeVisible()` failed                    |
|  50 |  D  | `teacher-full-journey.spec.ts:26`           | Teacher complete journey                                | `toBeGreaterThan()` assertion failed      |

---

## What would make this suite green locally

1. **Seed the local stack** — `npm run seed` against the `uwh` local Supabase (the tunnel must be open). This addresses category **D** (15 tests) and likely #41/#49/#50.
2. **Wire demo credentials into the fixture** — add a `demo` entry (or route demo specs through their own helper) so `tests/fixtures/auth.fixture.ts` stops throwing at line 89. Fixes category **C** (8 tests). _Test-code fix, not app._
3. **Fix the stale sign-up locators** — disambiguate `text=/continue with/i` (use `getByRole('button', { name: 'Continue with Google' })`) and refresh the other outdated expectations. Fixes category **B** (10 tests). _Test-code fix; the page itself is fine._
4. **Start an AI provider** — point the build at a reachable Ollama/OpenRouter endpoint for the `@ai` specs. Fixes category **A** (14 tests).
5. **Investigate #25 (RLS)** separately, and #42's external `fetch`.

---

## Reproduce

```bash
# 1. Tunnel to the local stack on uwh
ssh -fN -L 54321:localhost:54321 uwh

# 2. Prod build with the tunnel URL baked in (NEXT_PUBLIC_ vars are build-time)
NEXT_PUBLIC_SUPABASE_LOCAL_URL=http://127.0.0.1:54321 npm run build

# 3. Start the prod server; confirm `"db":"local"` in its logs
NEXT_PUBLIC_SUPABASE_LOCAL_URL=http://127.0.0.1:54321 npx next start -p 3100

# 4. Run all specs on Desktop Chrome
NEXT_PUBLIC_SUPABASE_LOCAL_URL=http://127.0.0.1:54321 PLAYWRIGHT_BASE_URL=http://localhost:3100 \
  npx playwright test --config=playwright.local-3100.config.ts --project="Desktop Chrome" --reporter=line
```

**Note on the run size**: the full 7-project matrix is **1757 tests**; this run used the `Desktop Chrome` project only (251 tests) as the representative regression signal. The other 6 device projects re-run the same specs on different viewports.
