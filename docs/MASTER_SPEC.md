# Strummy — Master Specification

**Date**: 2026-06-16 · **Updated**: 2026-06-19
**Author**: Claude (grilled by Piotr)
**Scope**: The single, authoritative specification of the **whole working application** — every functional domain (what it is, what it does, who can do it, current state) — **and** the plan to bring it to 100% (functional completeness + component consolidation). Domain summaries link out to the per-feature specs and reference docs; the remediation plan lives in §6.
**Status**: Living. Updated in place.

**Supersedes**: `docs/2026-06-10-road-to-100-todo.md` (absorbed; recover via `git log --all -- docs/2026-06-10-road-to-100-todo.md`) and `tasks/design-preview/production-plan.md` (retained with a "Superseded by" header, unmaintained).

**Layer precedence** (deeper wins on conflict): **Domain → Decisions → Plan → Reference**.

- `CONTEXT.md` — domain model / ubiquitous language. The source of truth for _what the words mean_.
- `docs/adr/` — settled architectural decisions: [0001 RLS is the security boundary](./adr/2026-05-09-0001-rls-is-the-security-boundary.md), [0002 Shadow students are first-class](./adr/2026-05-17-0002-shadow-students-in-the-lesson-system.md), [0003 Unified Pino logger](./adr/2026-05-17-0003-unified-logger-pino-backend.md).
- **This document** — the plan + the whole-app spec. When it conflicts with an older planning doc, this wins; when it conflicts with `CONTEXT.md` or an ADR, **those** win.
- Reference layer (the spokes): [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`DATABASE.md`](./DATABASE.md), [`API_REFERENCE.md`](./API_REFERENCE.md), [`INTEGRATIONS.md`](./INTEGRATIONS.md), [`NOTIFICATIONS.md`](./NOTIFICATIONS.md), [`TESTING.md`](./TESTING.md), [`UI_STANDARDS.md`](./UI_STANDARDS.md), [`FORMS_SPECIFICATION.md`](./FORMS_SPECIFICATION.md), [`PRODUCTION_REQUIREMENTS.md`](./PRODUCTION_REQUIREMENTS.md), [`USER_GUIDES.md`](./USER_GUIDES.md), [`DEVELOPMENT.md`](./DEVELOPMENT.md), [`GOOGLE_AUTH_DEV.md`](./GOOGLE_AUTH_DEV.md).

---

## 0. What Strummy is

**Strummy** is a production student-management SaaS for guitar teachers (Next.js 16 App Router, React 19, Supabase/Postgres with RLS, ~20–30 DAU; owner is the sole teacher). It manages the full teaching loop: a **song library**, scheduled **lessons** (bidirectionally synced to Google Calendar), **assignments** with a status lifecycle, student **repertoire & practice** tracking, an **AI assistant** for planning/communication, an event-driven **notification** system, and **analytics** dashboards — all gated by three roles (Admin / Teacher / Student) enforced at the database via Row-Level Security.

The ubiquitous language (Profile vs User, Role vs flag, Teaches, Repertoire, Progress, Shadow student) is defined in **[`CONTEXT.md`](../CONTEXT.md)** — read it first; it is the deepest layer.

---

## 1. Architecture at a glance

> Full detail: **[`ARCHITECTURE.md`](./ARCHITECTURE.md)**.

- **Stack:** Next.js 16 (App Router, RSC), React 19, TypeScript 5, Tailwind CSS 4, Supabase (Postgres + Auth + RLS, `@supabase/ssr`), TanStack Query, Zod 4, React Hook Form. AI via Vercel AI SDK + OpenRouter/Ollama. Sentry + Pino. Deployed on Vercel.
- **Compute split:** read/UI through **Server Components**; mutations through **Server Actions** (`app/**/actions*.ts`, `'use server'`); machine/3rd-party surfaces through **API routes** (`app/api/**`) wrapped in `withApiAuth()`.
- **Data layer:** dual **local/remote Supabase** selected by `lib/supabase/config.ts` (local auto-picked when reachable; `sb-provider-preference=remote` cookie overrides; `next.config.ts` falls back if local is down). Three clients: server (RLS), browser (RLS), admin/service-role (bypass — lookups/cron/migrations only).
- **Security boundary:** **RLS is the only enforcement point** (ADR-0001). App code never re-filters with `WHERE`.
- **AI layer:** provider-agnostic factory (`lib/ai/provider-factory.ts`) + agent registry (`lib/ai/agent-registry.ts`); OpenRouter (cloud) / Ollama (local), rate-limited and retried. See §4.11.
- **Integrations:** Google (Calendar/Drive/OAuth, `lib/google.ts`), Spotify (`lib/spotify.ts`), SMTP email (`lib/email/`). See §4.7, §4.12–§4.13.
- **Observability:** unified Pino logger with secret redaction + Sentry tying + request context (ADR-0003, `lib/logger/`).
- **Deploy:** `main` → preview (`strummy-preview.vercel.app`), `production` → prod (`strummy.app`); version auto-bumps from branch prefix on merge; Vercel Crons (§4.18).

---

## 2. Roles & access model

> Detail: **[specs/06](./specs/06-auth-shadow.md)** · **[`API_REFERENCE.md`](./API_REFERENCE.md)** · ADR-0001 / ADR-0002.

- **Three roles** stored as boolean flags on `profiles` (`is_admin`, `is_teacher`, `is_student`; plus `is_parent`, `is_development`). Resolved per-request and cached by `lib/auth/loadAuthedProfile.ts` → consumed via `getUserWithRolesSSR()`. A profile may hold multiple roles (multi-role rendering sweep — specs/10).
- **Boundaries:** Admin sees all; Teacher sees only their students/lessons; Student sees only their own records — **enforced by RLS**, not app code (ADR-0001).
- **Shadow students** (ADR-0002): `profiles` rows with `user_id = null`, created inline during lesson/calendar import before the student has an account; auto-linked to the real Profile on signup via DB trigger. The `auth_events` table is their audit trail.
- **Authentication:** Supabase Auth (JWT in cookies) via `lib/supabase/middleware.ts`; email/password + **Google sign-in** (`app/auth/callback`). Account lockout + rate limiting (`lib/auth/`). Machine access via **bearer API keys** (`gcrm_…`, `api_keys` table, hashed) resolved by `withApiAuth()`.

---

## 3. Domain map

Status legend: **live** (works end-to-end) · **partial** (works but has known gaps / unmounted UI) · **planned** (spec'd, not built).

| #    | Domain                          | Owning spec / reference                                                                                          | Status  |
| ---- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------- |
| 4.1  | Lessons                         | [specs/02](./specs/02-lessons.md)                                                                                | partial |
| 4.2  | Songs & library                 | [specs/01](./specs/01-songs.md)                                                                                  | partial |
| 4.3  | Users & Students                | [specs/04](./specs/04-users.md)                                                                                  | partial |
| 4.4  | Assignments                     | [specs/03](./specs/03-assignments.md)                                                                            | partial |
| 4.5  | Repertoire & Practice           | [specs/05](./specs/05-repertoire-practice.md)                                                                    | partial |
| 4.6  | Auth, RBAC & Shadow             | [specs/06](./specs/06-auth-shadow.md)                                                                            | partial |
| 4.7  | Google Calendar sync            | [specs/07](./specs/07-calendar.md) · [INTEGRATIONS](./INTEGRATIONS.md) · [GOOGLE_AUTH_DEV](./GOOGLE_AUTH_DEV.md) | partial |
| 4.8  | Notifications & Email           | [specs/08](./specs/08-notifications.md) · [NOTIFICATIONS](./NOTIFICATIONS.md)                                    | partial |
| 4.9  | Content / Production            | [specs/09](./specs/09-content-production.md)                                                                     | partial |
| 4.10 | Profile & Settings              | [specs/10](./specs/10-profile-multirole.md)                                                                      | partial |
| 4.11 | AI Assistant & Agents           | §4.11 (this doc) · [ARCHITECTURE](./ARCHITECTURE.md)                                                             | live    |
| 4.12 | Spotify enrichment              | §4.12 · [INTEGRATIONS](./INTEGRATIONS.md)                                                                        | live    |
| 4.13 | Google Drive video storage      | §4.13 · [INTEGRATIONS](./INTEGRATIONS.md)                                                                        | live    |
| 4.14 | Analytics, Dashboards & Cohorts | §4.14                                                                                                            | live    |
| 4.15 | Theory · Skills · Fretboard     | §4.15                                                                                                            | partial |
| 4.16 | Song-of-the-week                | §4.16                                                                                                            | live    |
| 4.17 | External API & widgets          | §4.17 · [API_REFERENCE](./API_REFERENCE.md)                                                                      | live    |
| 4.18 | Cron & scheduled jobs           | §4.18                                                                                                            | live    |
| 4.19 | Admin tooling                   | §4.19                                                                                                            | live    |

Testing & CI/CD is tracked as **[specs/11](./specs/11-testing-cicd.md)** (cross-cutting, §5.3).

---

## 4. Feature domains

> Each domain: **Purpose · Roles · Entities · Surfaces · Behaviors · Integrations · State → Detail.** "State" lines reference the road-to-100 work in §6 where relevant.

### 4.1 Lessons → [specs/02](./specs/02-lessons.md)

- **Purpose:** the core teaching unit — a scheduled session between a teacher and a (possibly shadow) student, with attached songs and notes.
- **Roles:** Teacher/Admin create/edit/delete; Student reads their own.
- **Entities:** `lessons` (teacher_id, student_id, scheduled_at, status, `google_event_id`, notes), `lesson_songs` (M:N + per-song status/order).
- **Surfaces:** `/dashboard/lessons[/new|/[id]|/[id]/edit|/[id]/live|/import]`; `app/api/lessons/**` (CRUD, search, schedule, stats, bulk, export, templates); `lib/services/lessons-queries.ts`, `lesson-detail-queries.ts`.
- **Behaviors:** CRUD, song attach/reorder, calendar push on write (§4.7), bulk ops, CSV export, stats rollups.
- **Integrations:** Google Calendar (outbound on create/update/delete).
- **State:** list+detail wired (editorial); **create/edit form is net-new**, and inline shadow-create is net-new (§6 code-audit corrections).

### 4.2 Songs & library → [specs/01](./specs/01-songs.md)

- **Purpose:** the song catalogue with musical attributes, links, videos, and analytics.
- **Roles:** Teacher/Admin manage; Student browses (RLS-scoped — see state).
- **Entities:** `songs` (title, author, level, key, capo_fret, tempo, chords, cover/youtube/spotify links, `search_vector`), `song_videos`, `song_requests`, `song_of_the_week` (§4.16).
- **Surfaces:** `/dashboard/songs[/[id]]`; `app/api/song/**` (CRUD, search, stats: usage/advanced/engagement/chords, favorites, from-spotify); `lib/services/songs-list-queries.ts`, `song-detail-queries.ts`, `song-analytics.ts`.
- **Behaviors:** full-text search, filters/pagination, chord analytics, video upload (Drive), Spotify enrichment.
- **Integrations:** Spotify (§4.12), Google Drive (§4.13).
- **State:** detail wired; **list GET runs under `createAdminClient()` → bypasses RLS** (students not scoped on the list — security-relevant, §6); edit form scalar-only.

### 4.3 Users & Students → [specs/04](./specs/04-users.md)

- **Purpose:** user/student lifecycle — listing, detail, edit, invite, onboarding, soft-delete.
- **Roles:** Admin manages all; Teacher manages their students; user self-edits profile (§4.10).
- **Entities:** `profiles` (roles + `student_status`, `is_active`), `parent_profiles`, `user_preferences`, `user_settings`.
- **Surfaces:** `/dashboard/users[/new|/[id]|/[id]/edit|/invite]`, `/onboarding`; `app/api/users/**`, `app/api/teacher/students`, `app/api/students/{pipeline,health,needs-attention}`, `app/api/admin/{users,set-passwords,link-shadow-user}`; `lib/services/user.service.ts`, `users-list-queries.ts`, `student-detail-queries.ts`.
- **Behaviors:** invite-by-email, onboarding flow, shadow-link/merge, student pipeline & health, soft-delete.
- **State:** student detail wired (read-only); **list/edit are stubs; invite/soft-delete/shadow-badge net-new**; delete is currently **hard** (soft-delete is net-new, D-09).

### 4.4 Assignments → [specs/03](./specs/03-assignments.md)

- **Purpose:** teacher-assigned practice tasks with a status lifecycle and reminders.
- **Roles:** Teacher/Admin create/assign/edit; Student updates own status.
- **Entities:** `assignments` (title, description, status, due_date, teacher/student/lesson ids), `assignment_templates`.
- **Surfaces:** `/dashboard/assignments[/new|/[id]]`; `app/api/assignments/**`; `lib/services/assignments-queries.ts`, `assignment-detail-queries.ts`; reminder crons (§4.18).
- **Behaviors:** CRUD, status state machine, templates, due/overdue notifications.
- **State:** list wired (status read-only); **detail/create/edit/status-control net-new**; a **student-status-only UPDATE RLS policy is net-new** (today `assignments_update_policy` admits only admin/teacher — §6).

### 4.5 Repertoire & Practice → [specs/05](./specs/05-repertoire-practice.md)

- **Purpose:** track each student's song progress and log practice sessions.
- **Roles:** Student logs practice & self-rates own; Teacher/Admin read & edit (role-scoped).
- **Entities:** `student_repertoire` (status, mastery_level, practice_count, last_practiced_at, self_rating), `practice_sessions` (duration, notes); legacy `student_song_progress` (slated for removal, §5.5).
- **Surfaces:** `/dashboard/repertoire`, `/dashboard/practice`; `app/api/repertoire/bulk`; `app/actions/practice.ts`, `repertoire.ts`, `self-rating.ts`.
- **Behaviors:** practice logging (**immutable + same-day undo**, D-08), mastery progression, self-rating, repertoire edit.
- **State:** read-only summaries exist; **no editorial page / practice route net-new**; same-day undo must reverse the AFTER-INSERT stat trigger (§6).

### 4.6 Auth, RBAC & Shadow → [specs/06](./specs/06-auth-shadow.md)

- **Purpose:** authentication, role-based access, account security, shadow-student lifecycle. See §2.
- **Entities:** `profiles` (roles), `auth_events`, `auth_rate_limits`, `api_keys`, `user_integrations`.
- **Surfaces:** `app/(auth)/*`, `app/auth/callback`, `app/api/auth/google`, `app/api/oauth2/callback`; `lib/auth/*` (loadAuthedProfile, withApiAuth, account-lockout, rate-limiter, auth-event-logger, shadow-email).
- **Behaviors:** email/password + Google sign-in, invite flow, account lockout, bearer-key API auth, shadow create/link.
- **State:** sign-in/up live (incl. Google — **D-07 becomes verify/harden**, already built); **invite dialog + admin-lockout widget net-new; remove the dead-end MFA branch** (D-06).

### 4.7 Google Calendar sync → [specs/07](./specs/07-calendar.md) · [INTEGRATIONS](./INTEGRATIONS.md) · [GOOGLE_AUTH_DEV](./GOOGLE_AUTH_DEV.md)

- **Purpose:** bidirectional sync between lessons and the teacher's Google Calendar.
- **Roles:** Teacher connects & syncs; per-user by design.
- **Entities:** `lessons.google_event_id`, `sync_conflicts`, `webhook_subscriptions`, `user_integrations` (provider `google`).
- **Surfaces:** `/dashboard/calendar` (stub), Settings → Integrations (Connect/Disconnect); `app/api/calendar-sync` (SSE), `app/api/webhooks/google-calendar`, `app/api/cron/renew-webhooks`; `lib/google.ts`, `lib/services/{calendar-lesson-sync,google-calendar-sync,calendar-sync-service,sync-conflict-resolver,webhook-renewal}.ts`.
- **Behaviors:** outbound push on lesson CRUD; inbound import (Calendly-marked events → lessons + shadow students); push webhooks (HTTPS) + daily renewal; polling fallback; conflict detection/resolution; on-demand dev sync (`npm run dev:calendar-sync`).
- **Integrations:** Google OAuth (calendar + drive.file + userinfo.email scopes; one client, two flows — see GOOGLE_AUTH_DEV).
- **State:** engine + webhook + conflict tables live but **`/dashboard/calendar` is a "Coming soon" stub; conflict UI net-new; user-session token refresh gap (7.5)**. Operationally dormant: 1 connected user, webhooks off by default.

### 4.8 Notifications & Email → [specs/08](./specs/08-notifications.md) · [NOTIFICATIONS](./NOTIFICATIONS.md)

- **Purpose:** event-driven in-app + email notifications with queue, retry, preferences.
- **Roles:** all roles receive; user manages own preferences; Admin monitors.
- **Entities:** `notification_queue`, `notification_log`, `notification_preferences`, `in_app_notifications`.
- **Surfaces:** `/dashboard/notifications`, `/unsubscribe`; `app/api/notifications/**`; cron processor + reminder/digest crons (§4.18); `lib/services/notification-service.ts`, `notification-queue-processor.ts`, `in-app-notification-service.ts`; 18 templates in `lib/email/templates/`.
- **Behaviors:** DB trigger → queue → cron processor → dual-channel router; retry/dead-letter; bounce tracking; rate limiting; per-type opt-out + unsubscribe.
- **Integrations:** SMTP (Nodemailer, `lib/email/`).
- **State:** feed + bell wired (reads `in_app_notifications`); **preferences UI built but unreachable** (`settings/notifications` stub); **deliverable-email chokepoint net-new** (senders use `recipient.email` directly).

### 4.9 Content / Production → [specs/09](./specs/09-content-production.md)

- **Purpose:** social-media content calendar (TikTok/Instagram/YouTube Shorts) tied to songs.
- **Roles:** Admin/Teacher.
- **Entities:** `content_posts` (platform, status, scheduled_at, hook, caption, hashtag_set_ids, metrics), `content_post_metrics`, `hashtag_sets`.
- **Surfaces:** `/dashboard/content`; `app/api/content/**` (posts, hashtag-sets, calendar, metrics).
- **Behaviors:** schedule posts, track per-post metrics over time, hashtag sets.
- **State:** **ProductionTab built but mounted nowhere; standalone content pages are Coming-soon** → decision: ProductionTab only, hide standalone from nav (D-10).

### 4.10 Profile & Settings → [specs/10](./specs/10-profile-multirole.md)

- **Purpose:** user self-service account/profile/preferences + multi-role rendering.
- **Roles:** every user (self); Admin extras.
- **Entities:** `profiles`, `user_preferences`, `user_settings`, `notification_preferences`, `api_keys`.
- **Surfaces:** `/dashboard/settings`, `/dashboard/profile`; `app/dashboard/settings/actions.ts`, `app/actions/{profile-settings,settings,notification-preferences,api-keys}.ts`; `components/settings/` (incl. Integrations — Google Connect/Disconnect).
- **Behaviors:** edit name/phone/avatar, theme, notification prefs, API-key management, integrations connect.
- **State:** sections wired; **self-edit form is name-only** (calls `updateProfileNameAction`, not the capable `PUT /api/users/profile`); multi-role rendering sweep pending.

### 4.11 AI Assistant & Agents _(no prior spec — described here)_

- **Purpose:** AI features for lesson planning, content generation, student communication, and an admin chat assistant.
- **Roles:** Teacher/Admin (per-agent `targetUsers`); read-only data access by design.
- **Entities:** `ai_conversations`, `ai_messages`, `ai_usage_stats`, `ai_prompt_templates`, `agent_execution_logs`.
- **Surfaces:** `/ai`, `/dashboard/ai`; `app/actions/ai/*` (core, lessons, songs, assignments, students, email, admin); `lib/ai/` — `provider-factory.ts`, `agent-registry.ts`, `agent-execution.ts`, `agents/` (chatAssistant, lessonNotes, assignmentGenerator, postLessonSummary, progressInsights, adminInsights, songNormalization, songNotes/+Enhancer, emailDraft), `rate-limiter.ts`, `retry.ts`, `token-estimation.ts`, `model-mappings.ts`.
- **Behaviors:** provider-agnostic completion (OpenRouter cloud / Ollama local, auto-select via `AI_PROVIDER`/`AI_PREFER_LOCAL`); streaming; per-user/per-model rate limits; retry w/ backoff; usage + execution logging for analytics.
- **Integrations:** OpenRouter (`OPENROUTER_API_KEY`), Ollama (`OLLAMA_BASE_URL`), Vercel AI SDK adapter.
- **State:** **live.** Consolidation debt: split `app/actions/ai.ts` (~1,140 LOC) per agent (§5.5). No dedicated RLS/spec coverage yet.

### 4.12 Spotify enrichment _(no prior spec — see [INTEGRATIONS](./INTEGRATIONS.md))_

- **Purpose:** enrich the song library with Spotify metadata/audio features and import tracks.
- **Roles:** Admin (import/connect/match review).
- **Entities:** `user_integrations` (provider `spotify`), `spotify_matches` (song_id, spotify_id, confidence, status).
- **Surfaces:** `/dashboard/admin/{spotify-import,spotify-connect,spotify-matches}`; `app/api/spotify/**` (authorize, callback, search, features, now-playing, matches approve/reject, sync, send-to-strummy, track-from-url); `lib/spotify.ts`, `lib/spotify-user.ts`, `lib/services/enhanced-spotify-search.ts`, `app/api/song/from-spotify/spotify-mapper.ts`.
- **Behaviors:** client-credentials + user OAuth; **fuzzy matching with confidence + manual review queue**; circuit breaker (5 fails → open 60s); rate-limit respect; create songs from Spotify.
- **State:** **live.**

### 4.13 Google Drive video storage _(no prior spec — see [INTEGRATIONS](./INTEGRATIONS.md))_

- **Purpose:** store/manage song videos in Google Drive; auto-scan/match to songs.
- **Roles:** Admin manage; gated on a Google connection.
- **Entities:** `drive_files` (file_id, name, mime, size, song_id, uploaded_by), `user_integrations` (provider `google`, `drive.file` scope).
- **Surfaces:** `/dashboard/admin/drive-videos`; `app/api/drive/files/**`, `app/api/admin/{drive-sync,drive-videos}`; `lib/services/{google-drive,google-drive-service-account,drive-video-sync,drive-video-matcher}.ts`; cron `drive-video-scan` (daily 03:00).
- **Behaviors:** upload/stream/delete; nightly scan → match to songs; gated by `hasGoogleIntegration()`.
- **State:** **live.**

### 4.14 Analytics, Dashboards & Cohorts _(no prior spec — described here)_

- **Purpose:** role-aware dashboards plus teacher/cohort/song analytics and health signals.
- **Roles:** Teacher (own), Student (own summaries), Admin (global).
- **Entities:** reads across `lessons`/`songs`/`student_repertoire`/`practice_sessions` + `ai_usage_stats`, `system_logs`; `v_teacher_lesson_trends` (SECURITY DEFINER view — see §6 0.5).
- **Surfaces:** `/dashboard` (role-resolved editorial), `/dashboard/{stats,cohorts,health,logs}`, `/dashboard/admin/stats/*`; `app/api/{dashboard/stats,cohorts/analytics,teachers/performance,lessons/stats,song/stats,students/health}`; `lib/services/{teacher,student,admin}-dashboard-queries.ts`, `cohort-analytics.ts`, `teacher-performance.ts`, `chord-analytics.ts`, `weekly-insights.ts`.
- **Behaviors:** teacher day-spine/needs-attention/utilization/roster; cohort metrics; chord-difficulty analysis; weekly insights (cron).
- **State:** **live** (Teacher dashboard is the most complete editorial surface); confirm the SECURITY DEFINER view is student-safe (§6 0.5).

### 4.15 Theory · Skills · Fretboard _(no prior spec — described here)_

- **Purpose:** music-theory courses, skill tracking, and an interactive fretboard tool.
- **Roles:** Student learns; Teacher/Admin author/track.
- **Entities:** `theoretical_courses`, `theoretical_lessons`, `theoretical_course_access`, `skills`, `student_skills`, `chord_quiz_attempts`.
- **Surfaces:** `/dashboard/{theory,skills,fretboard}`; `app/dashboard/theory/actions.ts`; `components/{theory,skills,fretboard}`.
- **Behaviors:** theory lessons + access control, skill progress, chord quizzes; fretboard is a self-contained static tool (no backend).
- **State:** **partial** — fretboard fully wired & mounted (editorial); theory/skills backend exists, UI coverage uneven.

### 4.16 Song-of-the-week _(no prior spec — described here)_

- **Purpose:** featured-song rotation.
- **Roles:** Admin sets; all see.
- **Entities:** `song_of_the_week` (song_id, start/end_date, category).
- **Surfaces:** `app/actions/song-of-the-week.ts`; surfaced in dashboard/library.
- **State:** **live** (lightweight).

### 4.17 External API & widgets _(no prior spec — see [API_REFERENCE](./API_REFERENCE.md))_

- **Purpose:** read-only public/programmatic access (e.g. iOS widget) via API keys.
- **Roles:** machine clients with a `gcrm_` bearer key.
- **Entities:** `api_keys` (hashed, `last_used_at`).
- **Surfaces:** `app/api/external/{songs,database/status}`, `app/api/widget/{admin,dashboard}`, `app/api/health`; auth via `withApiAuth()`.
- **Behaviors:** key-authenticated read endpoints, health/status checks, per-key rate limiting.
- **State:** **live.**

### 4.18 Cron & scheduled jobs _(no prior spec — described here)_

- **Purpose:** background maintenance, reminders, digests, sync.
- **Entities/registry:** `lib/health/cron-registry.ts` (+ health checkers); cron auth via `lib/auth/cron-auth.ts` (`CRON_SECRET`).
- **Schedule (`vercel.json`):** `drive-video-scan` 03:00 · `cleanup-auth-events` 03:30 · `daily-report` 06:00 · `update-student-status` 02:00 · `renew-webhooks` 00:00 · `weekly-insights` Mon 09:00 · `weekly-digest` Sun 18:00. Plus dispatcher-driven: `process-notification-queue`, `assignment-due-reminders`, `assignment-overdue-check`, `lesson-reminders`, `admin-monitoring`.
- **Behaviors:** each returns 200 (no silent failure — §6 0.4); Sentry cron monitors; dispatcher routes multi-step jobs (e.g. calendar sync + student-status).
- **State:** **live** (Phase 0 hardened the 500-ing crons).

### 4.19 Admin tooling _(no prior spec — described here)_

- **Purpose:** operational tools for the owner/admin.
- **Roles:** Admin only.
- **Surfaces:** `/dashboard/admin/*` (debug, notifications analytics, spotify-import/connect/matches, drive-videos, stats), `/dashboard/logs`; `app/api/admin/**`; `lib/services/admin-dashboard-queries.ts`.
- **Behaviors:** user/password management, shadow-merge, Spotify import & match review, Drive video management, notification analytics, system log viewer (ADR-0003), AI diagnostics.
- **State:** **live.**

---

## 5. Cross-cutting concerns

### 5.1 RLS — the security boundary (ADR-0001)

RLS is the only place membership is enforced; app code never duplicates the `WHERE`. Phase 4 extends `jest.config.rls.ts` (real Supabase, serial) to every core table: `assignments.rls.test`, `profiles.rls.test`, `practice-sessions.rls.test`, `student-repertoire.rls.test`, plus the §6 0.5 `SECURITY DEFINER` view fix test. **Done when:** every table named in a §4 contract has an RLS test asserting teacher isolation + student own-only.

### 5.2 Editorial consolidation — sole survivor (D-05)

Editorial becomes the **only** generation. Per domain, as its feature lands: (1) mount `components/<domain>/editorial/*` at the route (no cookie branch); (2) delete `components/<domain>/*` (v1), `components/v2/<domain>/*`, `components/v2/stitch` (v3); (3) `rg` for stragglers + `tsc --noEmit` after each deletion. At 100%: delete `lib/ui-version.ts`, `lib/ui-version.server.ts`, `AppShellV2`, the `strummy-ui-version` cookie.

**Editorial UI inventory (verified 2026-06-16):** 8 editorial dirs, 30 files. Dominant pattern: **read surfaces wired to real data; write surfaces unbuilt or orphaned** — so per-domain v1/v2/v3 deletion (DoD gate 5) is blocked until the write half is (re)built. Several finished components are **built but not mounted** (calendar controls, ProductionTab, notification preferences).

| Domain              | Editorial dir                 | Read                                                                          | Write                                          | Spec                                    |
| ------------------- | ----------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------- |
| Songs               | `songs/editorial` (12)        | list **partial** (RLS-bypassed; missing key/author filters), detail **wired** | edit **partial** (scalar only)                 | [01](./specs/01-songs.md)               |
| Lessons             | `lessons/editorial` (4)       | list + detail **wired**                                                       | **none** (create/edit net-new)                 | [02](./specs/02-lessons.md)             |
| Assignments         | `assignments/editorial` (1)   | list **wired** (status read-only)                                             | **none**                                       | [03](./specs/03-assignments.md)         |
| Users               | `users/editorial` (1)         | student detail **wired**                                                      | **none** (list/edit stubs)                     | [04](./specs/04-users.md)               |
| Repertoire/Practice | —                             | read-only summaries                                                           | **none** (practice route absent)               | [05](./specs/05-repertoire-practice.md) |
| Auth/Onboarding     | —                             | sign-in/up **live** (incl. Google); onboarding v2 default                     | invite/lockout net-new; MFA dead-end to delete | [06](./specs/06-auth-shadow.md)         |
| Calendar            | — (integration)               | sync/webhook controls **built but orphaned**                                  | conflict UI net-new                            | [07](./specs/07-calendar.md)            |
| Notifications       | `notifications/editorial` (1) | feed **wired** + bell                                                         | preferences **built but unreachable**          | [08](./specs/08-notifications.md)       |
| Content/Production  | —                             | —                                                                             | ProductionTab **built, mounted nowhere**       | [09](./specs/09-content-production.md)  |
| Profile/Settings    | `settings/editorial` (1)      | sections **wired**                                                            | self-edit **name-only**                        | [10](./specs/10-profile-multirole.md)   |

**Cross-cutting surfaces (no single feature owns):** Dashboards `dashboard/editorial` (9 files, mounted at `/dashboard` via `resolveActiveView` Teacher>Student>Admin); Fretboard `fretboard/editorial` (1, static); shared `primitives.tsx`/`format.ts` design-system pieces (keep & consolidate).

### 5.3 Testing & CI gates → [specs/11](./specs/11-testing-cicd.md)

Measured 2026-06-16: unit green **by exclusion** (51 quarantined files); integration **16 failing**; RLS **0 running** (`describe.skip`); coverage **53%** (non-blocking); CI **filters `tsc` errors** with `grep -v`; E2E runs **only on `production`**. Four S1s (honest signal): un-skip RLS (§5.1), burn down the 51-file quarantine, remove the CI `tsc grep -v` filter, add a `@smoke` E2E gate to the PR path. Then make gates blocking (coverage ratchet, `@typescript-eslint/no-explicit-any: error`). Full detail in specs/11 + [audits/2026-06-16-test-cicd-audit.md](./audits/2026-06-16-test-cicd-audit.md).

### 5.4 Observability — unified logger (ADR-0003)

Logger Phases 1–2.5 shipped (Pino backend + `system_logs` + admin viewer). Remaining: enforce no-console in CI (part of §5.3 lint); confirm Sentry captures Error objects (not message strings) so stacks survive.

### 5.5 Consolidation debt

- Split `app/actions/ai.ts` (1,140 LOC) → `actions/ai/{lesson-notes,assignments,emails,summaries,progress,admin-insights}.ts`.
- Split `notification-service.ts`/`notification-monitoring.ts` (1,021 LOC) per channel; `user.service.ts` (583 LOC).
- Delete `cypress/` after porting its 1 active spec to Playwright.
- Drop deprecated `student_song_progress` (data lives in `student_repertoire`; remove the `slow_tempo` dead enum branch in `CONTEXT.md`).
- Dependabot: triage open alerts (`npm audit`).
- Keep `CLAUDE.md` version + the `.env.local` Supabase URL note current.

---

## 6. The Road to 100% (remediation plan)

> The "what's left" tracker. The §4 domain "current state" lines defer here. Phase 0 is a hard dependency for every feature spec.

### 6.0 Definition of "100%"

**Product-level exit criteria:**

1. **No Coming-soon page reachable from nav.** Every nav destination renders a real feature.
2. **No flow strands a user.** No dead-end (MFA branch, shadow invite, half-built OAuth).
3. **No silent failure.** No swallowed `.from()` error on a real flow; crons return 200.
4. **Every core table is RLS-tested** against a real Supabase instance.
5. **PR CI runs smoke E2E and a blocking coverage gate.**

**Per-feature contract** — a domain in §4 (and its spec) is _done_ only when all five hold:

| ✓   | Gate                      | Meaning                                                                                                          |
| --- | ------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| ☐   | **Behavior complete**     | No stub/Coming-soon; the full user story works for every role.                                                   |
| ☐   | **No silent failure**     | Every backend call has a live table/RPC; errors surface.                                                         |
| ☐   | **RLS-tested**            | The feature's tables have a real-Supabase RLS test (`jest.config.rls.ts`).                                       |
| ☐   | **Renders via editorial** | The route mounts `components/<domain>/editorial/*`; no `ui-version` cookie branch.                               |
| ☐   | **v1/v2/v3 deleted**      | The old `components/<domain>/*` (v1), `components/v2/<domain>/*`, `components/v2/stitch` (v3) trees are removed. |

This unifies **functional completeness** (gates 1–3) and **component consolidation** (gates 4–5).

### 6.1 Phase 0 — Restore Truth (BLOCKING)

> Nothing downstream is trustworthy until Phase 0 lands. Full spec: **[specs/00](./specs/00-phase-0-restore-truth.md)**. **Decision:** restore schema buckets A+B, delete C+D (D-04). Production ref `zmlluqqqwrfhygvpfqka`.

| Sub | Task                                                                     | Done when                                                           |
| --- | ------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| 0.1 | Resolve the 14-table schema drift (restore A+B / delete C+D)             | `supabase db diff` vs prod empty; no live call sites for bucket C/D |
| 0.2 | Reconcile migration history                                              | `supabase migration list` matches repo 1:1                          |
| 0.3 | Consolidate bearer auth → `withApiAuth()`                                | `rg "bearer-auth"` empty; Bruno passes with a `gcrm_` key           |
| 0.4 | Fix the 500-ing crons                                                    | each cron returns 200 in prod + a regression test                   |
| 0.5 | Audit the `SECURITY DEFINER` view (`v_teacher_lesson_trends`)            | a student query returns only student-visible rows                   |
| 0.6 | Restore CI signal (quarantine triage · bulk-DELETE 400 guard · CI gates) | PR runs smoke E2E + a blocking coverage gate                        |

> ✅ **Resolved (2026-06-16):** `auth_events` reclassified **C → A (restore)** — the audit trail for the shadow invite/link lifecycle (ADR-0002); `lib/auth/auth-event-logger.ts` / [specs/06](./specs/06-auth-shadow.md) write to it. Apply its migration alongside the notification tables; `cleanup-auth-events` cron stays valid.

### 6.2 Feature-spec index (the spine)

Each feature has a standalone, code-grounded, agent-ready spec; the detail (user stories · data contracts · current-state deltas · files · edge cases · acceptance test names · 5-point DoD) lives in the file. The §4 domain sections summarize these.

| #   | Feature               | Spec                                    | Phase | Scope                                                                               |
| --- | --------------------- | --------------------------------------- | ----- | ----------------------------------------------------------------------------------- |
| 01  | Songs                 | [01](./specs/01-songs.md)               | 2     | List (filters/pagination) + edit form; editorial; delete v1/v2/v3                   |
| 02  | Lessons               | [02](./specs/02-lessons.md)             | 2     | Create/edit + calendar sync + inline shadow-create                                  |
| 03  | Assignments           | [03](./specs/03-assignments.md)         | 2     | Create/detail/edit + status machine + notify                                        |
| 04  | Users                 | [04](./specs/04-users.md)               | 2     | List/detail/edit + soft-delete (D-09) + shadow badge                                |
| 05  | Repertoire & Practice | [05](./specs/05-repertoire-practice.md) | 2     | Repertoire read/edit (role-scoped) + practice log (immutable + same-day undo, D-08) |
| 06  | Auth & Shadow         | [06](./specs/06-auth-shadow.md)         | 2     | Invite, email chokepoint, MFA remove (D-06), Google sign-in (D-07), lockout         |
| 07  | Google Calendar       | [07](./specs/07-calendar.md)            | 3     | Mount UI, conflicts, polling, recurring, refresh, disconnect, webhook hardening     |
| 08  | Notifications         | [08](./specs/08-notifications.md)       | 2     | In-app + email on restored bucket-A tables; preferences; unsubscribe                |
| 09  | Content / Production  | [09](./specs/09-content-production.md)  | 2     | ProductionTab only; remove standalone from nav (D-10)                               |
| 10  | Profile & Multi-role  | [10](./specs/10-profile-multirole.md)   | 2     | Self-edit form + multi-role rendering sweep                                         |
| 11  | Testing & CI/CD       | [11](./specs/11-testing-cicd.md)        | 0.6/4 | Restore honest signal then make gates blocking (§5.3)                               |

**Code-audit corrections (2026-06-16):** Songs list bypasses RLS (admin client) — students unscoped on list ([01](./specs/01-songs.md)); User delete is HARD today, soft-delete net-new, `is_active` has no RLS predicate ([04](./specs/04-users.md)); Lesson create has no shadow-create ([02](./specs/02-lessons.md)); Student assignment-status blocked at RLS ([03](./specs/03-assignments.md)); Google sign-in already built → D-07 verify/harden ([06](./specs/06-auth-shadow.md)); Calendar `syncAllTeacherCalendars()` is called + `singleEvents=true` set — gap is per-instance dedupe ([07](./specs/07-calendar.md)); Practice undo needs stat reversal (AFTER-INSERT trigger only) ([05](./specs/05-repertoire-practice.md)); Deliverable-email chokepoint net-new ([08](./specs/08-notifications.md)).

### 6.3 Sequencing (solo, ~6–8 weeks)

| Week | Focus                                                                                                       | Gates closed                           |
| ---- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| 1    | **Phase 0 entirely** (0.1→0.6) + Songs 2.1/2.2 quick wins                                                   | "no silent failure", CI signal         |
| 2–3  | Feature CRUD: Lessons → Assignments → Users → Repertoire/Practice (behavior + editorial + delete old trees) | gates 1,4,5 per feature                |
| 4    | Auth & Shadow (invite + email chokepoint first, then MFA-remove / Google-signin / lockout)                  | "no flow strands a user"               |
| 5    | Calendar (mount UI day 1 → conflicts → cron → recurring → disconnect)                                       | calendar 100%                          |
| 6–7  | Testing (RLS breadth + journeys + quarantine triage)                                                        | "every core table RLS-tested", CI gate |
| 8    | Consolidation (§5.5) + kill the `ui-version` switch + buffer                                                | one generation; debt down              |

Critical-path: **Phase 0 must finish before Week 2.**

### 6.4 Decision Ledger

| ID   | Decision                                                              | Rationale                                              | Consequence                                               |
| ---- | --------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------- |
| D-01 | Single consolidated master spec (this doc)                            | One tracker prevents drift                             | Supersedes road-to-100 + production-plan                  |
| D-02 | Unify functional + editorial tracks                                   | Done = works **and** renders via editorial             | 5-point per-feature checklist                             |
| D-03 | Hybrid skeleton (Phase 0 + feature spine + sequence)                  | Phase 0 is a hard dependency                           | This structure                                            |
| D-04 | Schema drift: restore A+B, delete C+D (`auth_events` C→A, 2026-06-16) | "No silent failure" forbids leaving A broken; C/D dead | Notifications + ProductionTab + shadow audit-trail real   |
| D-05 | Editorial **sole survivor**, kill the switch                          | One generation is simplest end state                   | Delete v1/v2/v3 + `ui-version` at 100%                    |
| D-06 | MFA: **remove** the dead-end                                          | Premature for ~20–30 DAU                               | Delete `{mfaRequired,factorId}` branch                    |
| D-07 | Google sign-in: **implement** (separate callback)                     | Friction-reducing login                                | New `app/auth/callback`; integrations cb untouched        |
| D-08 | Practice: **immutable + same-day undo**                               | Integrity + mis-tap forgiveness                        | `deletePracticeSession` gated to `current_date`           |
| D-09 | User delete: **soft-delete**                                          | System-wide consistency; preserves FKs                 | `is_active=false` + auth ban; RLS hides inactive          |
| D-10 | Content: **ProductionTab only**, hide standalone                      | Least-scope "no silent failure" + "no Coming-soon"     | Remove `/dashboard/content/*` from nav                    |
| D-11 | Supersede & consolidate older planning docs                           | Single source of truth                                 | road-to-100 + production-plan get "Superseded by" headers |
| D-12 | Implementation-grade altitude                                         | Sections must be agent/issue ready                     | Contracts + files + RLS + test names per feature          |

### 6.5 Open Questions / Risks

1. **Editorial rollback risk.** Sole-survivor deletion is big-bang per domain. Mitigation: mount editorial → soak in preview → _then_ delete the old tree (staged, not a separate generation).
2. **Schema restore on prod is irreversible-ish.** Apply bucket A/B migrations to a Supabase branch first (`mcp__supabase__create_branch`), verify, then merge. Snapshot before applying.
3. **`song_sections` / `user_roles` reverse-engineering** (0.1) may surface columns the repo never modeled — budget time to reconcile types/Zod after `pg_dump`.
4. **Production lag.** `production` trails `main` by ~9 minor versions. This spec targets `main`/preview; a promotion gate must verify Phase 0 changes are prod-safe before `strummy.app`.
5. **`strummy.app` NXDOMAIN.** Out of scope but tracked: reactivate DNS or repoint CV/portfolio links to `strummy.vercel.app`.

---

> **New-domain spec spin-out (optional, future):** §4.11–§4.19 (AI, Spotify, Drive, Analytics, Theory/Skills, SOTW, External API, Cron, Admin) are summarized here but have no standalone `specs/NN-*.md`. Promote any to a full spec if it enters an active build/remediation cycle.
