---
created: 2026-07-18
updated: 2026-07-18
---

# Testing Strategy

How anything in this blueprint gets proven. Mechanics (commands, configs, helpers, pyramid) live
in [reference/TESTING.md](reference/TESTING.md) — this doc adds the strategy layer: what a gap must ship with,
where RLS proof lives, and how E2E journeys map to domains.

## Definition of Done for any blueprint gap

Every gap brief's acceptance tests roll up to these gates before merge:

1. **Unit/integration** — new logic covered at the Jest layer per
   [TESTING.md](reference/TESTING.md) (70% on new code; integration for handlers/actions with mocked
   Supabase via `lib/testing/integration-helpers.ts`).
2. **RLS** — if the gap touches a table's read/write path, an RLS case proving role isolation
   (see below). No RLS case → no merge for data-surface changes.
3. **E2E** — only if the gap changes a critical browser journey; extend the _existing_ journey
   spec rather than adding a new one (journey catalog: [docs/app-blueprint/reference/E2E_JOURNEYS.md](reference/E2E_JOURNEYS.md)).
4. **Quality gates** — `npm run lint && npm test` green locally; full suite in CI.

## RLS testing

Two layers, both against a **real** Supabase (never mocked):

- **Jest RLS suite** — `npx jest --config jest.config.rls.ts`, serial, per-table policy cases.
- **Cross-role E2E** — `tests/e2e/cross-role/rls-data-isolation.spec.ts` (student A cannot read
  student B via `/rest/v1/`) and `tests/e2e/cross-role/access-control.spec.ts` (route-level
  role gating).

Launch-critical: the cross-role suite must pass **against StrummyProd** before cutover — a
hard gate in [92-launch-runbook.md](92-launch-runbook.md). Passing against dev does not count.

## E2E journey ↔ domain map

| Blueprint domain       | Journey specs (`tests/e2e/`)                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 01 Identity & Access   | `auth/*` (role-login, sign-out, sign-up-complete), `onboarding/complete-flow`                                                         |
| 02 Lessons & Calendar  | `teacher/lessons-crud`, `teacher/lesson-song-status`, `student/lessons-read`, `dashboard/today-lessons`, `dashboard/upcoming-lessons` |
| 03 Songs & Repertoire  | `teacher/songs-crud`, `student/songs-read`, `student/repertoire`                                                                      |
| 04 Practice & Progress | `student/practice`, `student/practice-bpm`                                                                                            |
| 05 Chords & Theory     | `student/chord-quiz-srs`, `teacher/fretboard`                                                                                         |
| 06 Assignments         | `teacher/assignments-crud`, `student/assignments-interact`                                                                            |
| 07 Notifications       | `notifications/inbox`, `notifications/prefs`                                                                                          |
| 08 AI                  | `ai/*` (playground, assignment-ai, lesson-notes)                                                                                      |
| Cross-cutting          | `teacher-full-journey`, `student-full-journey`, `smoke/critical-path`, `cross-role/*`, `mobile/mobile-responsiveness`, `demo/*`       |

Full catalog with per-journey status: [docs/app-blueprint/reference/E2E_JOURNEYS.md](reference/E2E_JOURNEYS.md). Cap: journeys
stay few and critical — new scenarios default to the integration layer (TESTING.md philosophy).

## Environment strategy

- **Local dev Supabase** = `StudentManager` stack on uwh (543xx) — where Jest RLS + E2E normally
  run (see `reference_local_e2e_runbook` memory / `playwright.config.ts` auto-detection).
- **StrummyProd** (553xx) — pre-cutover verification target only: RLS cross-role suite + smoke.
- **Known open item**: local-LLM (Ollama) AI E2E — see gap in
  [08-ai-assistant.md](08-ai-assistant.md).

## Quarantine policy

Rotted tests are quarantined in `jest.config.ts` rather than deleted silently; the quarantine
list is debt (tracked in [90-roadmap.md](90-roadmap.md) Tranche 4). Do not add to it to make CI
green — fix or consciously quarantine with a comment.

## References

- [reference/TESTING.md](reference/TESTING.md) — mechanics, commands, helpers
- [docs/app-blueprint/reference/E2E_JOURNEYS.md](reference/E2E_JOURNEYS.md) — journey catalog
- Superseded: `docs/specs/11-testing-cicd.md` (deleted 2026-07-18; git history)
