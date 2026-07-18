---
created: 2026-07-18
updated: 2026-07-18
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
   ▲ recommended riders: PRA-1, NOT-1, ASG-3 (DB fixes cheapest         │
   │ to apply while cutover window is open)                             ▼
T2 v1 trust fixes ──────── independent branch work, mergeable any time  5 students live
T3 v1.1 parking lot ────── BLOCKED on real usage data (deliberate)         │
T4 debt ────────────────── anytime; some items sharpen launch confidence   ▼
T5 parked/backlog ──────── content pipeline + admin niceties        v1.1 unblocks
```

## Tranche 1 — Self-host launch (critical path)

Procedure + hard gates: [92-launch-runbook.md](92-launch-runbook.md). Summary order:

1. P3 remaining: UPS + pull-the-plug test · external uptime monitor
2. P4 cutover: auth `config.toml` → OAuth to Production → Vercel env repoint → smoke →
   RLS cross-role suite vs StrummyProd
3. P5: dry-run throwaway student → invite the 5 real students

**Recommended riders on the cutover window** (DB-side fixes, apply to StrummyProd while it has
zero users — each is a migration + test, small):

| ID    | What                                                                                                                       | Brief                           |
| ----- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| PRA-1 | Fix practice aggregate/undo triggers — undo currently errors (`42703`) on any song-linked session; aggregates never accrue | [04](04-practice-progress.md)   |
| NOT-1 | Add missing `delivery_channel` column — preference reads silently fall back to defaults                                    | [07](07-notifications-email.md) |
| ASG-3 | Column-scope the student assignment-status RLS write policy                                                                | [06](06-assignments.md)         |

## Tranche 2 — v1 trust fixes (branch work, any time)

Correctness and honesty on surfaces students/teacher already use. No new features.

| ID                    | What                                                                                         | Brief                                                      |
| --------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| IDA-3                 | Re-mount the admin lockout widget (actions exist; component lost in the purge)               | [01](01-identity-access.md)                                |
| ADM-1                 | Restore the system_logs viewer (v1-relevant admin visibility)                                | [10](10-admin-observability.md)                            |
| CAL-2                 | Prove the calendar conflict loop (seed + E2E), then un-hide calendar nav                     | [02](02-lessons-calendar.md)                               |
| LES-1 / LES-2 / IDA-5 | Delete stub routes (`lessons/[id]/live`, `lessons/import`, `users/invite`) — honesty hygiene | [02](02-lessons-calendar.md) · [01](01-identity-access.md) |
| NOT-2                 | Unify the duplicate inbox/bell read paths                                                    | [07](07-notifications-email.md)                            |

## Tranche 3 — v1.1 parking lot (deliberately blocked on real usage)

Do **not** build before the 5 students have produced usage data. Briefs exist so any item can
start the day it's unblocked.

| ID            | What                                                                                             | Brief                         |
| ------------- | ------------------------------------------------------------------------------------------------ | ----------------------------- |
| PRA-2         | Tempo ladder (BPM logging already ships; the ladder view is the feature)                         | [04](04-practice-progress.md) |
| PRA-3         | Teacher practice view                                                                            | [04](04-practice-progress.md) |
| CHT-1 / CHT-2 | Chord-SRS review surface + skills hub                                                            | [05](05-chords-theory.md)     |
| THY-1         | Theory LMS activation                                                                            | [05](05-chords-theory.md)     |
| SNG-1…4       | Song requests UI · SOTW resurface · Spotify match review · song-sections write path              | [03](03-songs-repertoire.md)  |
| CAL-1         | Visual calendar view (open question: needed at all?)                                             | [02](02-lessons-calendar.md)  |
| —             | Achievements / streaks — design **after** usage; open questions in [04](04-practice-progress.md) | [04](04-practice-progress.md) |

## Tranche 4 — Debt

| ID / item     | What                                                                                       | Where                        |
| ------------- | ------------------------------------------------------------------------------------------ | ---------------------------- |
| AIA-1         | Local-LLM E2E: pin `FALLBACK_MODELS.ollama` off the crashing model, finish `ai-agents-e2e` | [08](08-ai-assistant.md)     |
| SNG-5         | Drop deprecated `student_song_progress` (after PRA-1 removes the last trigger dependency)  | [03](03-songs-repertoire.md) |
| ASG-1         | Templates: build the minimal loop or cut the 3 stub routes                                 | [06](06-assignments.md)      |
| IDA-1 / IDA-4 | user_settings + user_preferences: mount or retire (decision, then small PR)                | [01](01-identity-access.md)  |
| LES-3 / CAL-3 | Recurring-lessons action wire-or-drop · recurring-import dedupe test                       | [02](02-lessons-calendar.md) |
| Hooks         | Split `useAIStream` (351 LOC) and `useLessonForm` (241) to the 150-line rule               | vault                        |
| Repo          | `strummy.app` domain · Lighthouse audit · Bruno API drift audit · Jest quarantine drain    | vault                        |
| Cloud         | Decide Cloud project's fate (reconcile or retire) after cutover proves stable              | [92](92-launch-runbook.md)   |

## Tranche 5 — Parked / backlog

Marketing tooling and admin niceties; revisit when the need is active, not before.

| ID            | What                                                                        | Brief                           |
| ------------- | --------------------------------------------------------------------------- | ------------------------------- |
| CNT-1         | Re-enable ProductionTab (`{false && …}` gate; schema blocker verified gone) | [09](09-content-production.md)  |
| CNT-2 / CNT-3 | Content scheduling + metrics surfaces                                       | [09](09-content-production.md)  |
| NOT-3         | Admin notification analytics dashboard                                      | [07](07-notifications-email.md) |
| ADM-2 / ADM-3 | Legacy audit read surface · debug dashboard mount                           | [10](10-admin-observability.md) |
| AIA-2         | Wire `is_helpful` feedback into anything                                    | [08](08-ai-assistant.md)        |
| ASG-2         | Assignment history timeline (write-only table today)                        | [06](06-assignments.md)         |
| IDA-2         | Avatar storage upload                                                       | [01](01-identity-access.md)     |

## Open questions (cross-doc index)

Each domain doc keeps its own `## Open questions`; the grill-worthy ones as of 2026-07-18:
user_settings honor-or-drop (01) · visual calendar needed at all (02) · templates worth existing
(06) · `lesson_reminder_24h` default channel post-launch (07) · student-facing AI ever (08) ·
`drive_files`/`song_videos` unification (09) · dispatcher vs systemd timers post-cutover (10) ·
streak/achievement design set (04) · `chord_id` orphan risk (05) · ComingSoonCard vs trust pass
(03).
