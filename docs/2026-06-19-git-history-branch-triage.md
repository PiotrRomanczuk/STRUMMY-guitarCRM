# Git History Analysis & Branch Triage

**Date**: 2026-06-19
**Author**: Claude
**Scope**: Full commit-history analysis (1,434 commits, 2025-10-26 → 2026-06-18) + triage of 11 live remote branches, prompted by a tangled working tree on `fix/calendar-sync-hardening`.

---

## TL;DR

- The working tree on `fix/calendar-sync-hardening` had **two unrelated features tangled together** — the calendar-sync hardening (its actual purpose) plus a song-notes-agent AI refactor that bled in from `feature/song-notes-agent-specs` during an uncommitted branch switch.
- Across the full history, **~⅓ of all commits are automation/release noise** (275 version bumps, 80 dependabot, 273 github-actions bot).
- Work happens in **fast bursts followed by stalls** (April 2026 ≈ 0 commits), and context is repeatedly parked in stashes/branches rather than closed out — the macro pattern behind today's tangle.
- After pruning stale refs, there are **11 live remote branches** (not 43 as first counted). 2 are safe deletes (squash-merged); the real risk is `STRUM-content-production` (147 commits ahead, 5 weeks stale, 3 stashes).

---

## 1. The immediate "stuck" diagnosis

The reflog showed:

```
HEAD@{2}: checkout: moving from main to feature/song-notes-agent-specs
HEAD@{1}: checkout: moving from feature/song-notes-agent-specs to fix/calendar-sync-hardening
```

A `git checkout` was performed **without committing or stashing** the in-progress work on `feature/song-notes-agent-specs`. Git carries uncommitted changes across a branch switch when nothing conflicts, so the entire song-notes-agent AI refactor followed onto the calendar branch's working tree. `feature/song-notes-agent-specs` still sits at `main` with zero commits — all of its work is the uncommitted changes now floating in the working tree.

### Two coherent features, physically tangled

**A — Calendar / dev-env hardening** → belongs on `fix/calendar-sync-hardening` (PR #491):
`app/dashboard/calendar-actions.ts` · `app/dashboard/settings/page.tsx` · `components/settings/IntegrationsSection.tsx` · `components/dashboard/Topbar/Topbar.tsx` · `components/debug/DatabaseStatus.tsx` · `next.config.ts` · `package.json` · `supabase/config.toml` · `docs/GOOGLE_AUTH_DEV.md` (new) · `scripts/development/calendar-sync.ts` (new)

**B — Song-notes-agent / AI refactor** → belongs on `feature/song-notes-agent-specs`:
`app/actions/ai/songs.ts` · all `*AI.tsx` components · `components/dashboard/admin/AdminDashboardInsights*` · `EmailDraftGenerator.tsx` · `StudentProgressInsights.tsx` · `components/v2/ai/useAIChat.ts` · `lib/ai/agents/*`

### Recovery plan (no data loss)

1. On `fix/calendar-sync-hardening`: stage only the 10 group-A files and commit → PR #491 becomes clean and self-contained.
2. With group-B still unstaged, `git switch feature/song-notes-agent-specs` — the changes carry over cleanly (shared base for those files).
3. Commit group-B there → the AI work finally has a committed home.

---

## 2. Full commit-history analysis (1,434 commits)

### Velocity — three build sprints, two stalls

| Month   | Commits | Signal             |
| ------- | ------- | ------------------ |
| 2025-10 | 62      | kickoff            |
| 2025-11 | **403** | 🔥 explosive build |
| 2025-12 | **332** | 🔥 build continues |
| 2026-01 | 103     | cooldown           |
| 2026-02 | **299** | 🔥 second big push |
| 2026-03 | 71      | slowing            |
| 2026-04 | **2**   | ⚠️ full stall      |
| 2026-05 | 73      | restart            |
| 2026-06 | 89      | active             |

### Composition

**Real work:** feat 359 · fix 293 · refactor 42 · test 55 · docs 80 · ci 35
**Noise:** chore 274 — of which **275 commits are `bump version`** (~19% of all history), plus 80 dependabot bumps and 273 `github-actions[bot]` commits.
➡️ Roughly a third of the history is automation/release churn. The auto-version-bump-on-merge workflow generates a bump commit per PR, ~doubling apparent commit count.

### Stability signal — fix:feat ratio

- **Nov**: 121 feat / 73 fix → building fast
- **Dec**: 78 feat / **101 fix** → inverted; December spent paying down November's build binge
- **Feb**: 45 / 49 → balanced
- **Jun**: 32 feat / **3 fix** → healthiest month in the dataset, building cleanly

### Hot spots (most-churned files)

```
111  .github/workflows/ci-cd.yml   ← CI thrash (41× in Dec 2025 alone)
 81  .gitignore                    ← stash/execution-log churn
 53  app/api/lessons/handlers.ts   ← most unstable core endpoint
 48  components/songs/SongList/Table.tsx
 48  components/navigation/Header.tsx
 47  .github/copilot-instructions.md
 46  app/page.tsx
 44  app/layout.tsx
```

- `ci-cd.yml` (111 touches) is the single biggest source of rework; the 41 December edits correlate with the recorded **$200+ GitHub Actions bill** from broad triggers.
- `all_executions.md` (48) + `.gitignore` (81) churn are byproducts of the rebase "execution log" + stash workflow — self-inflicted.
- `lessons/handlers.ts` (53) is the most unstable piece of product code.

### Top directories by commit touch

`components/` 4975 · `app/` 2811 · `scripts/` 1488 · `docs/` 1270 · `cypress/` 987 · `supabase/` 946 · `lib/` 906

### Git identity fragmentation

Three author identities in use: `PiotrRomanczuk`, `Piotr Romanczuk`, `romanczukpiotr` — fragmenting attribution. Recommend unifying `git config user.name` / `user.email`.

---

## 3. Branch triage (11 live remote branches)

> After `git fetch --prune`, stale local tracking refs dropped the count from an apparent 43 to **11 live remote branches** (excluding `main`/`production`).

| Branch                                           | Last commit | Ahead   | PR              | Verdict                                                       |
| ------------------------------------------------ | ----------- | ------- | --------------- | ------------------------------------------------------------- |
| `fix/calendar-sync-hardening`                    | 06-18       | 1       | **#491 open**   | ✅ KEEP — active work                                         |
| `feature/STRUM-landing-cinematic`                | 06-10       | 3       | **#457 MERGED** | 🗑️ DELETE — squash-merged                                     |
| `feature/STRUM-p2-auth-notifications-repertoire` | 06-16       | 1       | **#474 MERGED** | 🗑️ DELETE — squash-merged                                     |
| `feature/STRUM-p0-quarantine-triage`             | 06-17       | 1       | none            | 🔵 RECENT — finish & PR, or drop                              |
| `feature/STRUM-p0-bearer-auth`                   | 06-16       | 2       | none            | ⚠️ VERIFY — likely superseded by merged #478 (withApiAuth)    |
| `claude/exciting-wozniak-xahv3z`                 | 06-10       | 4       | none            | 🟡 SALVAGE — orphan; 2 ci/test fixes + 2 audit docs, unmerged |
| `feature/STRUM-verify-backend-cli`               | 06-08       | 8       | none            | 🟡 DECIDE — ~10 days, no PR                                   |
| `feature/STRUM-logger-phase2-pino`               | 05-18       | 1       | none            | 🟠 STALE (5wk) — 1 commit (Pino); rebase+ship or drop         |
| `feature/STRUM-lessons-coverage`                 | 05-17       | 358\*   | none            | 🟠 STALE (5wk) — WIP "coverage tweaks"                        |
| `feature/STRUM-backend-audit`                    | 05-13       | 9       | none            | 🟠 STALE (5wk) — no PR                                        |
| `feature/STRUM-content-production`               | 05-14       | **147** | none            | 🔴 BIG DECISION — large unmerged feature + 3 stashes          |

\* 358 ahead is mostly merge-commit noise from pulling `main` in, not 358 unique changes.

### Verification notes

- `landing-cinematic` (#457) and `p2-auth-notifications-repertoire` (#474): confirmed squash-merged — commits ahead are just pre-squash originals + merge-main noise. **Safe to delete.**
- `claude/exciting-wozniak-xahv3z`: `git cherry` shows all 4 commits unmerged (`+`). Content: `fix(test)` cookie-scoped mock, `fix(ci)` Jest quarantine, plus two audit docs (road-to-100 TODO, CRUD checklist 2026-06-10).
- `STRUM-content-production`: 147 commits ahead + 3 stashes (`stash@{8/9/10}`). Cannot be auto-triaged; needs a resurrect-vs-abandon decision.

### Outstanding stashes (12 total)

Most are labeled `wip` / `execution log` and are scattered across 11 branches — evidence of the branch-hop-without-committing pattern. Notable: 3 reference `STRUM-content-production`.

---

## 4. Recommended actions

**Immediate, zero-risk:**

1. Delete the 2 squash-merged branches: `feature/STRUM-landing-cinematic`, `feature/STRUM-p2-auth-notifications-repertoire`.
2. Verify `STRUM-p0-bearer-auth` against merged #478; delete if covered.

**This week (the 5-week-old branches violate the 7-day hygiene rule):** 3. Decide `STRUM-content-production` — rebase onto main + open PR, or formally abandon (and clear its 3 stashes). 4. PR-or-drop the other `05-1x` branches: `logger-phase2-pino`, `lessons-coverage`, `backend-audit`.

**Hygiene / root-cause:** 5. Unify git author identity (one `user.name` + `user.email`). 6. Get under the self-imposed **max-5-open-branches** limit (`~/.claude/rules/branch-hygiene.md`). 7. Stop parking work in stashes across branch switches — commit before switching.

---

## 5. Through-line

Building happens in fast bursts, then contexts are switched before they close. The evidence: an 8-month history with two stall months, a December fix-storm after a November feature-storm, 12 WIP stashes, and a working tree where two features merged by accident. The version-bump and CI noise then obscure what is actually done vs in-flight. The fixes are mechanical (split the branch, delete merged branches, unify identity) but the durable win is closing work out before switching away from it.
