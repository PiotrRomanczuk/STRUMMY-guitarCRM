---
created: 2026-07-18
updated: 2026-07-22
---

# Implementation Roadmap

The ordered plan across every open gap in the blueprint. Each item is one line + a pointer to its
agent-executable brief in the owning domain doc. **No statuses here** — the vault
(`projects/Strummy/Strummy.md`) tracks what's in flight and done; when a gap ships, delete its
brief and its row here.

**Ordering principle** (grill-locked 2026-07-18): the self-host launch is the critical path — the
5 real students are the forcing function. v1 = trust pass: only correctness/honesty work ships
before launch; new student-facing features wait for real usage (v1.1). Debt interleaves only
where it de-risks launch.

## Dependency picture

```
T1 launch (92-runbook) ─── gates student #1 ─────────────────────────────┐
   (DB-side riders PRA-1/NOT-1/ASG-3 shipped 2026-07-19 — only the      │
   P3-P5 launch procedure remains)                                       ▼
T2 v1 trust fixes ──────── ALL SHIPPED 2026-07-19 (was: branch work)    5 students live
T3 v1.1 parking lot ────── BLOCKED on real usage data (deliberate)         │
T4 debt ────────────────── mostly shipped 2026-07-19; 2 items remain       ▼
T5 parked/backlog ──────── mostly shipped 2026-07-19; 2 items remain  v1.1 unblocks
```

## Tranche 1 — Self-host launch (critical path)

Procedure + hard gates: [92-launch-runbook.md](92-launch-runbook.md). Summary order:

1. P3 remaining: UPS + pull-the-plug test · external uptime monitor
2. P4 cutover: auth `config.toml` → OAuth to Production → Vercel env repoint → smoke →
   RLS cross-role suite vs StrummyProd
3. P5: dry-run throwaway student → invite the 5 real students

**DB-side fixes on the cutover window** (apply to StrummyProd while it has zero users — each
is a migration + test, small).

_Shipped 2026-07-19: PRA-1 (practice aggregate/undo triggers fixed + PRA-1 RLS-real test green
against live dev DB), NOT-1, ASG-3. Tranche 1's remaining scope is now purely the launch
procedure above (P3–P5), not code._

## Tranche 2 — v1 trust fixes (branch work, any time)

Correctness and honesty on surfaces students/teacher already use. No new features.

_Shipped 2026-07-19: IDA-3 (LockedAccountsCard mounted on the admin dashboard), ADM-1
(SystemLogsTable restored at `/dashboard/logs`), CAL-2 (calendar un-hidden from nav — not in
`CORE_LOOP_HIDDEN_ITEMS`), LES-1/LES-2/IDA-5/ASG-1 (stub routes deleted), NOT-2 (inbox/bell
paths unified onto `in-app-notification-service.ts`). Tranche 2 is now empty._

## Tranche 3 — v1.1 parking lot (deliberately blocked on real usage)

Do **not** build before the 5 students have produced usage data. Briefs exist so any item can
start the day it's unblocked.

**First slice (grill 2026-07-22).** When v1.1 unblocks, the _first_ thing to build is the
**chord-quiz surfacing bundle — CHT-1 + CHT-2 + ASG-4** (assignable chord drills): it's the only
nav-hidden learning tool both ship-ready and result-producing, so it's the tracer bullet for the
whole "surface what's hidden" effort. Theory (THY-1) trails it (blocked on content authoring); the
fretboard has no teacher-visible result to weave. This does **not** relax the gate above — the
bundle still waits for real usage data before it starts.

| ID            | What                                                                                             | Brief                         |
| ------------- | ------------------------------------------------------------------------------------------------ | ----------------------------- |
| PRA-2         | Tempo ladder (BPM logging already ships; the ladder view is the feature)                         | [04](04-practice-progress.md) |
| PRA-3         | Teacher practice view                                                                            | [04](04-practice-progress.md) |
| CHT-1 / CHT-2 | Chord-SRS review surface + skills hub — surfaced via assignable drills (**first slice**)         | [05](05-chords-theory.md)     |
| THY-1         | Theory LMS activation                                                                            | [05](05-chords-theory.md)     |
| ASG-4         | Assignable chord drills — the chord-quiz surfacing mechanism (**first slice**)                   | [06](06-assignments.md)       |
| SNG-1…4       | Song requests UI · SOTW resurface · Spotify match review · song-sections write path              | [03](03-songs-repertoire.md)  |
| —             | Achievements / streaks — design **after** usage; open questions in [04](04-practice-progress.md) | [04](04-practice-progress.md) |

_Shipped ahead of schedule 2026-07-19: IDA-4 (onboarding `user_preferences` now surfaced on the
student detail view) — landed alongside the Tranche 2 sweep rather than waiting for v1.1 usage
data._

## Tranche 4 — Debt

| ID / item | What                                                                          | Where                      |
| --------- | ----------------------------------------------------------------------------- | -------------------------- |
| Repo      | `strummy.app` domain                                                          | vault                      |
| Cloud     | Decide Cloud project's fate (reconcile or retire) after cutover proves stable | [92](92-launch-runbook.md) |

_Shipped 2026-07-19: AIA-1 (Ollama fallback model pinned, `ai-agents-e2e` repaired), SNG-5
(`student_song_progress` dropped), IDA-1 (`user_settings` retired), LES-3/CAL-3 (recurring
lesson creation wired + recurring-import dedupe tested against the real DB), Hooks
(`useAIStream`/lesson-form hooks both now under the 150-line rule), and the Lighthouse
audit/Bruno drift audit/Jest quarantine drain parts of "Repo" (quarantine mechanism removed
from `jest.config.ts` entirely)._

## Tranche 5 — Parked / backlog

Marketing tooling and admin niceties; revisit when the need is active, not before.

| ID            | What                                   | Brief                           |
| ------------- | -------------------------------------- | ------------------------------- |
| CNT-2 / CNT-3 | Content scheduling + metrics surfaces  | [09](09-content-production.md)  |
| NOT-3         | Admin notification analytics dashboard | [07](07-notifications-email.md) |

_Shipped 2026-07-19: CNT-1 (ProductionTab re-enabled), ADM-2/ADM-3 (dead audit_log read
dropped · debug dashboard mounted), AIA-2 (`is_helpful` feedback buttons wired), ASG-2
(assignment_history surfaced as a detail timeline), IDA-2 (avatar storage upload)._

## Open questions (cross-doc index)

Each domain doc keeps its own `## Open questions`; the grill-worthy ones as of 2026-07-18:
student-facing AI ever (08) · `drive_files`/`song_videos` unification (09) ·
streak/achievement design set (04) · `chord_id` orphan risk (05) · ComingSoonCard vs trust pass
(03).
