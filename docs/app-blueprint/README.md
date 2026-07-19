---
created: 2026-07-18
updated: 2026-07-18
---

# Strummy App Blueprint

The canonical documentation of **what the application does, how each feature works, what remains
to build, and how to prove it works**. This folder is the whole of `docs/` since 2026-07-18: the
former MASTER_SPEC, specs/00–11, audits, and standalone reference docs were merged, relocated
into [reference/](reference/) and [adr/](adr/), or deleted (recoverable via git history).

## Reading order

1. [00-overview.md](00-overview.md) — app thesis, roles, core loop, domain map, maturity legend
2. Domain docs `01`–`10` — one per feature domain (see map below)
3. [90-roadmap.md](90-roadmap.md) — the ordered implementation plan across all domains
4. [91-testing-strategy.md](91-testing-strategy.md) — how anything gets proven
5. [92-launch-runbook.md](92-launch-runbook.md) — self-host cutover procedure + hard gates
6. [reference/](reference/) — living how-the-system-works docs · [adr/](adr/) — settled decisions

## Precedence rules

| Question                                                  | Authority                                                                                                                |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| What a feature does / how to build a gap / how to test it | **This blueprint**                                                                                                       |
| Current task status, priorities, what's in flight (WHEN)  | Vault `~/Obsidian/MainCV-Planner/projects/Strummy/Strummy.md`                                                            |
| Stack, request flow, RLS mechanics, AI system internals   | [reference/ARCHITECTURE.md](reference/ARCHITECTURE.md)                                                                   |
| Exact DDL                                                 | `supabase/baseline/cloud_schema_2026-06-22.sql` (verified vs live StrummyProd 2026-07-18; see 00-overview §Schema truth) |
| Domain vocabulary                                         | `CONTEXT.md` · decisions: [adr/](adr/)                                                                                   |
| E2E journey catalog                                       | [reference/E2E_JOURNEYS.md](reference/E2E_JOURNEYS.md)                                                                   |

## Reference docs ([reference/](reference/))

`ARCHITECTURE` (stack, RBAC, routing, AI system) · `TESTING` (mechanics/commands) ·
`E2E_JOURNEYS` (journey catalog) · `PRODUCTION_REQUIREMENTS` (env vars, deploy checklist) ·
`API_REFERENCE` (routes, external API, `gcrm_` keys) · `FORMS_SPECIFICATION` (field-level form
spec) · `UI_STANDARDS` (design tokens, editorial patterns) · `USER_GUIDES` (end-user docs) ·
`DEVELOPMENT` (local setup) · `GOOGLE_AUTH_DEV` (Google OAuth dev setup)

This blueprint deliberately contains **no checkboxes, statuses, or dates-done** — the vault owns
those. When a gap ships, delete its brief here and record completion in the vault.

## Domain map

| Doc                                                    | Domain                                        | Tables |
| ------------------------------------------------------ | --------------------------------------------- | ------ |
| [01-identity-access.md](01-identity-access.md)         | Users, roles, auth, shadow students, settings | 8      |
| [02-lessons-calendar.md](02-lessons-calendar.md)       | Lessons + Google Calendar sync                | 6      |
| [03-songs-repertoire.md](03-songs-repertoire.md)       | Song catalog, repertoire, Spotify             | 9      |
| [04-practice-progress.md](04-practice-progress.md)     | Practice tracking, stats, gamification (v1.1) | 1      |
| [05-chords-theory.md](05-chords-theory.md)             | Chord quiz + SRS, theory LMS, fretboard       | 5      |
| [06-assignments.md](06-assignments.md)                 | Assignments + templates                       | 3      |
| [07-notifications-email.md](07-notifications-email.md) | Notification engine + email                   | 4      |
| [08-ai-assistant.md](08-ai-assistant.md)               | AI chat, generations, agents                  | 6      |
| [09-content-production.md](09-content-production.md)   | Video production + social pipeline + Drive    | 5      |
| [10-admin-observability.md](10-admin-observability.md) | Audit, logs, cron, admin analytics            | 15     |

Every one of the 62 baseline tables appears in exactly one doc's `tables:` frontmatter.

## Doc conventions

- Living docs: dateless filenames, `created:`/`updated:` frontmatter, bump `updated:` on edit.
- Target length ≤ ~450 lines; strict section structure (Purpose → Data model → Behavior & rules →
  UI surfaces → Gaps & planned work → Test plan → References).
- **Gap IDs** (`LES-1`, `PRA-2`, …) are stable and agent-executable: each brief is self-contained
  (files to touch, approach, acceptance tests) so it can be handed to a fresh agent session.
  `90-roadmap.md` orders gaps by ID; domain docs define them.
- Unresolved design questions live in a doc's `## Open questions` section until resolved via a
  grill session, then get folded into the body.
