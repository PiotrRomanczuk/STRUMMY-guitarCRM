---
created: 2026-06-16
updated: 2026-07-18
---

# Strummy — Documentation Index

This folder was consolidated on 2026-06-16: ~113 point-in-time docs collapsed into the small living set below. Old docs are recoverable from git history (`git log --all -- docs/<name>`).

## Layers

Documentation is organized in four layers. When they conflict, the deeper layer wins: **Domain → Decisions → Plan → Reference**.

### Plan & decisions (the spine)

| Doc                                           | What                                                                                                                                                                                                                            |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`../CONTEXT.md`](../CONTEXT.md)              | **Domain model / ubiquitous language.** What the words mean (Profile, Role, Teaches, Repertoire, Progress…). Deepest layer.                                                                                                     |
| [`app-blueprint/`](./app-blueprint/README.md) | **The canonical whole-application blueprint (2026-07-18).** 10 domain docs (schema → behavior → UI → agent-executable gap briefs → test plan) + roadmap + testing strategy + launch runbook. Supersedes MASTER_SPEC and specs/. |
| [`MASTER_SPEC.md`](./MASTER_SPEC.md)          | Superseded (2026-07-18) by `app-blueprint/` — retained for history.                                                                                                                                                             |
| [`specs/`](./specs)                           | Superseded (2026-07-18) by `app-blueprint/` — each spec's banner names its absorbing blueprint doc.                                                                                                                             |
| [`adr/`](./adr)                               | **Settled architectural decisions.** 0001 RLS is the security boundary · 0002 Shadow students are first-class · 0003 Unified Pino logger.                                                                                       |

### Reference (how the system works — living)

| Doc                                                          | What                                                                                                              |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md)                       | Tech stack, directory structure, RBAC, DB connection routing, external API system, rate limiting, AI system.      |
| [`DATABASE.md`](./DATABASE.md)                               | Schema / table / RLS reference.                                                                                   |
| [`API_REFERENCE.md`](./API_REFERENCE.md)                     | Authentication (session + `gcrm_` keys), external API, iOS widget, route inventory.                               |
| [`UI_STANDARDS.md`](./UI_STANDARDS.md)                       | Design tokens, responsive/mobile-first, dashboard & table patterns, component conventions (editorial generation). |
| [`TESTING.md`](./TESTING.md)                                 | Pyramid, commands, RLS testing, infrastructure, security patterns, E2E plans by journey.                          |
| [`INTEGRATIONS.md`](./INTEGRATIONS.md)                       | Google Calendar + Spotify technical reference.                                                                    |
| [`NOTIFICATIONS.md`](./NOTIFICATIONS.md)                     | Notification/email channels, queue/retry, preferences, unsubscribe, deliverable-email chokepoint.                 |
| [`FORMS_SPECIFICATION.md`](./FORMS_SPECIFICATION.md)         | Field-level spec for every form (validation, error states).                                                       |
| [`USER_GUIDES.md`](./USER_GUIDES.md)                         | End-user docs for admin / teacher / student.                                                                      |
| [`DEVELOPMENT.md`](./DEVELOPMENT.md)                         | Local setup, scripts, dev workflow.                                                                               |
| [`PRODUCTION_REQUIREMENTS.md`](./PRODUCTION_REQUIREMENTS.md) | Env vars, deployment checklist.                                                                                   |

### Audits (transient — delete once Phase 0 lands)

| Doc                                                                                          | What                                                                                        |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [`2026-06-10-backend-audit.md`](./2026-06-10-backend-audit.md)                               | The 14 findings Phase 0 closes.                                                             |
| [`audits/2026-06-09-fallow-audit.md`](./audits/2026-06-09-fallow-audit.md)                   | Dead-code / duplication / complexity health.                                                |
| [`audits/2026-06-09-schema-reconciliation.md`](./audits/2026-06-09-schema-reconciliation.md) | The 14-table production drift investigation (Phase 0.1 input).                              |
| [`audits/2026-06-16-test-cicd-audit.md`](./audits/2026-06-16-test-cicd-audit.md)             | Measured test-suite + CI/CD state; findings drive [`specs/11`](./specs/11-testing-cicd.md). |
| [`2026-05-13-api-inventory.md`](./2026-05-13-api-inventory.md)                               | Auto-generated route catalog. Regenerate via the route-audit script.                        |

## Conventions

- **Living docs** (reference layer) are dateless and updated in place; freshness tracked by the `updated:` frontmatter field.
- **Point-in-time docs** (audits, ADRs) keep a `YYYY-MM-DD` filename prefix.
- New ADRs go in `adr/` as `YYYY-MM-DD-NNNN-title.md`.
