---
created: 2026-07-18
updated: 2026-07-22
---

# Application Overview

## Thesis

Strummy is a **student management system for guitar teachers** — a single-teacher CRM/LMS run by
its owner for his own studio. The teacher schedules lessons, curates a song catalog, assigns
repertoire and homework; students log in to see their lessons, songs, assignments, and log
practice. Around that core sit an AI assistant, a notification engine, Google Calendar sync,
Spotify enrichment, a theory-course LMS, and a video/social content pipeline.

**Current strategic frame** (decided 2026-06-22, reaffirmed in grill 2026-07-18): a **trust pass,
not a feature pass**. The immediate goal is onboarding 5 real students onto a clean self-hosted
production stack (`StrummyProd` on uwh). The student-facing surface must be honest — no
placeholder features — and the working core loop must be reliable. New student-facing features
(gamification, tempo ladder, SRS review) are **v1.1, built after real usage**.

## Roles & access model

Three roles enforced via Supabase RLS: **Admin**, **Teacher**, **Student** (an `is_parent` flag
exists but the parent experience is unbuilt). The owner is currently the only teacher, and admin
and teacher views coincide in practice. Students never see each other's data — proven by the RLS
cross-read E2E (`tests/e2e/cross-role/rls-data-isolation.spec.ts`). **Shadow students** are
teacher-created profiles without auth accounts, linkable later via invite
(`claim_shadow_profile` / `transfer_shadow_profile_references`).

CRUD rule of thumb (per-domain detail lives in each domain doc): **Admin/Teacher** — full CRUD
on all rows of every domain table. **Student** — reads/writes only own rows; teaching artifacts
(songs, lessons, assignments) are read-only, with a few explicit self-service writes: advance
own assignment status, log practice (immutable; same-day delete = undo), repertoire
self-rating/notes, song requests, own profile/settings/notification preferences.

Full RBAC/RLS mechanics: `docs/app-blueprint/reference/ARCHITECTURE.md`.

## The core loop

```
Teacher schedules lesson ──▶ attaches songs ──▶ teaches ──▶ marks statuses, assigns homework
        ▲                                                            │
        │                                                            ▼
Student practices ◀── sees repertoire + assignments ◀── gets notified (email + in-app)
        │
        └── logs practice sessions ──▶ progress visible to teacher
```

Navigation is intentionally scoped to this loop (`CORE_LOOP_HIDDEN_ITEMS` in
`components/navigation/menuConfig.ts`): teachers see Lessons / Songs / Assignments / Students;
students see My Lessons / My Songs / My Assignments. Everything else remains URL-reachable but
nav-hidden until individually proven.

`menuConfig.ts` is a per-feature **"reveal when proven"** ledger — each hidden item carries its own
reason, so surfacing is a per-feature readiness call, never a blanket flip. The graduation rule
(grill 2026-07-22): a student-facing feature leaves `nav-hidden` by **attaching to the
teacher-driven loop** — assignable, with its outcome visible to the teacher — not by floating as
free self-study. The first such graduation is the chord quiz, via assignable drills (see
[90-roadmap.md](90-roadmap.md) §Tranche 3 and docs 05/06). Teacher/admin-only tools (content
planner, cohort analytics, Spotify, Drive) are a **separate** surface the student trust-pass never
governed — they mount to staff nav on their own merits.

## UI generation

**Editorial is the sole UI generation.** The v1/v2/v3 version-switch machinery, 435 dead
components, the design-preview prototype surface, and Cypress were all deleted in July 2026
(commits `fda52ea7`…`8fb45d5d`). Each core domain has a `components/<domain>/editorial/` tree its
pages import. Historical UI-plan record: `tasks/design-preview/`.

## Schema truth

The authoritative schema is `supabase/baseline/cloud_schema_2026-06-22.sql` — 62 tables,
20 enums, ~50 functions, 199 RLS policies — **verified against live StrummyProd on 2026-07-18**:
tables/columns/enums identical. Known post-baseline drift (out-of-band, StrummyProd has no
migration-tracking table):

- 4 added functions: `claim_shadow_profile`, `transfer_shadow_profile_references`,
  `ensure_audit_partitions`, `refresh_song_matviews`
- Patched `handle_new_user` body (persists first/last name; migration `20260622210000`)
- Auto-created partition `audit_log_2027_01`

Generated-types gotcha: two TypeScript type files exist — root `database.types.ts`
(auto-generated, current) and `types/database.types.ts` (legacy, drifted). Use the root file;
regenerate with `npx supabase gen types typescript`.

## Production topology (2026-07-18)

| Stack                                 | Where                                | Role                                                                         |
| ------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------- |
| `StudentManager`                      | uwh, ports 543xx, Cloudflare tunnel  | **Live prod today** (dev-conflated — the problem)                            |
| `StrummyProd`                         | uwh, ports 553xx, systemd auto-start | **Migration target** — clean, backed up (NAS + encrypted R2), restore-proven |
| Supabase Cloud `zmlluqqqwrfhygvpfqka` | cloud                                | Divergent side-copy, 0 live users; schema baseline origin; rollback          |
| Vercel `strummy.vercel.app`           | cloud                                | Next.js app; `main` → preview, `production` → prod                           |

Cutover procedure: [92-launch-runbook.md](92-launch-runbook.md).

## Maturity legend (used in every domain doc)

| Status              | Meaning                                                              |
| ------------------- | -------------------------------------------------------------------- |
| **mounted**         | Route live and reachable in nav                                      |
| **nav-hidden**      | Built and routed, hidden via `CORE_LOOP_HIDDEN_ITEMS`, URL-reachable |
| **built-unmounted** | Component exists, no route imports it                                |
| **unbuilt**         | Schema/back-end exists, no UI                                        |
| **dormant**         | Table exists, superseded or unused by design                         |
| **aspirational**    | No schema — concept only (v1.1)                                      |

## Domain map (62 tables → 10 docs)

See [README.md](README.md#domain-map). Grouping judgment calls: Calendar merges into Lessons
(sync is a lesson side-effect); Practice splits from Repertoire (song-centric CRM vs
student-centric time series); analytics splits between 04 (student stats) and 10 (admin
dashboards); the 14 `audit_log` partitions get one disposition row, not prose.
