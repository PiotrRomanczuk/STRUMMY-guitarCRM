# Strummy Guitar CRM — Requirements

**Date**: 2026-05-17
**Author**: Claude (synthesized from `docs/2026-05-13-api-inventory.md`, `docs/2025-12-05-ARCHITECTURE.md`, `docs/2026-01-07-AI_SYSTEM.md`, supabase migrations, server actions, integration code)
**Scope**: Functional and non-functional requirements for the post-cleanup dashboard rebuild, organized by user role (Admin / Teacher / Student)
**Status**: Living document — update `updated:` date when the underlying API/data model shifts

---

## 0. Purpose

The dashboard at `app/dashboard/*` was stripped to empty placeholder cards on 2026-05-17. This document is the **blueprint for what gets rebuilt and in what order**. It captures:

1. What each role needs to accomplish in the product.
2. Which API endpoints / server actions back each capability (so the rebuild reuses the existing backend instead of duplicating it).
3. Which external systems must be alive for each capability (so we know what breaks if Spotify or Google Calendar is down).
4. Non-functional requirements (auth, RLS, performance, observability) that the rebuild must respect.

Everything below is descriptive of the current backend, not aspirational. The frontend was wiped; the backend is intact and is the source of truth.

---

## 1. System at a glance

| Layer         | What                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| Frontend      | Next.js 16 App Router (React 19, Tailwind 4, shadcn/ui, Framer Motion, TanStack Query)                  |
| Backend       | Next.js route handlers (122 routes, 30 domains) + 32 server-action files + 13 Vercel cron jobs          |
| Database      | Supabase Postgres, ~45 tables, RLS on every table, monthly-partitioned `audit_log`                      |
| Auth          | Supabase Auth (email/password, Google OAuth, MFA via TOTP) + bearer-token API keys for external clients |
| AI            | OpenRouter (cloud) or Ollama (local) via provider factory; 10 specialized agents                        |
| External      | Google Calendar, Google Drive, Gmail SMTP, Spotify Web API                                              |
| Observability | Sentry (errors), PostHog (analytics, via CDN rewrite), structured `notification_log`                    |
| Deploy        | Vercel — `main` → preview, `production` → prod                                                          |

### Three roles, boolean flags

Roles are **not mutually exclusive**. A profile can have any combination of `is_admin`, `is_teacher`, `is_student`. A 4th flag `is_parent` is orthogonal (any role can be a parent). `is_development` flags test accounts that get write-blocked by `guardTestAccountMutation()`.

Resolution priority for the dashboard view selector (when multiple roles): **teacher > student > admin** (`app/dashboard/page.tsx::resolveActiveView`). Users with multiple roles see a `RoleSwitcher`.

Role detection: `lib/getUserWithRolesSSR.ts → loadAuthedProfile()`, request-memoized via React `cache()`. SECURITY DEFINER SQL helpers (`is_admin()`, `is_teacher()`, `is_student()`, `is_admin_or_teacher()`, `is_child_of_parent(uuid)`) back RLS.

---

## 2. Domain model (data the UI consumes)

Tables grouped by domain. Names match Postgres. All tables have RLS.

### 2.1 Identity & access

| Table                  | Purpose                                                                                                                                                                                                                                                                                                         | Key columns                                                                                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`             | Source of truth for roles + status. Includes both real users (FK via `user_id` → `auth.users`) and **shadow users** (`is_shadow=true`, `user_id=null`, placeholder `email`, optional `invite_email`). Shadow lifecycle is governed by [ADR 0002](./adr/2026-05-17-0002-shadow-students-in-the-lesson-system.md) | `id`, `user_id`, `is_admin`, `is_teacher`, `is_student`, `is_parent`, `is_shadow`, `invite_email`, `is_development`, `student_status` enum, `parent_id` |
| `user_roles`           | Junction (legacy / explicit role assignment)                                                                                                                                                                                                                                                                    | `user_id`, `role`                                                                                                                                       |
| `user_settings`        | UI preferences (theme, language, timezone)                                                                                                                                                                                                                                                                      | `user_id`, JSONB                                                                                                                                        |
| `user_preferences`     | Notification + product preferences                                                                                                                                                                                                                                                                              | `user_id`, channel toggles                                                                                                                              |
| `user_integrations`    | OAuth tokens for Google / Spotify                                                                                                                                                                                                                                                                               | `user_id`, `provider`, `access_token`, `refresh_token`, `expires_at`                                                                                    |
| `api_keys`             | Bearer tokens for external clients (iOS widget, scripts)                                                                                                                                                                                                                                                        | `user_id`, `key_hash`, `name`, `last_used_at`                                                                                                           |
| `auth_events`          | Sign-in / MFA / password events for audit                                                                                                                                                                                                                                                                       | `user_id`, `event_type`                                                                                                                                 |
| `auth_rate_limits`     | Per-user / per-IP throttling                                                                                                                                                                                                                                                                                    | `key`, `count`, `expires_at`                                                                                                                            |
| ~~`pending_students`~~ | **Dropped 2026-04-25.** Superseded by shadow profiles on `profiles` (`is_shadow=true`). See [ADR 0002](./adr/2026-05-17-0002-shadow-students-in-the-lesson-system.md)                                                                                                                                           | —                                                                                                                                                       |

### 2.2 Curriculum

| Table                                        | Purpose                                                                                                                                                               |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lessons`                                    | Teaching session. FK teacher + student, `lesson_status` enum, `google_event_id` for calendar sync, `lesson_teacher_number` auto-incremented per teacher, soft-deleted |
| `lesson_songs`                               | Songs covered in a lesson, with per-song `lesson_song_status` (`to_learn` → `mastered`)                                                                               |
| `assignments`                                | Homework. FK lesson + student, `assignment_status` enum, due date, grade                                                                                              |
| `assignment_templates`                       | Reusable assignment scaffolds                                                                                                                                         |
| `theoretical_courses`, `theoretical_lessons` | Music-theory curriculum content                                                                                                                                       |
| `theoretical_course_access`                  | Per-student course unlock                                                                                                                                             |
| `task_management`                            | Internal task tracking (admin/teacher to-dos)                                                                                                                         |

### 2.3 Songs & repertoire

| Table                            | Purpose                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| `songs`                          | Catalog. Title, author, key, chords, level, category, Spotify metadata, soft-deleted |
| `song_videos`                    | YouTube / Drive videos attached to songs                                             |
| `song_requests`                  | Student-submitted song requests, teacher-reviewed                                    |
| `song_of_the_week`               | Featured song; students can add to repertoire one-click                              |
| `student_repertoire`             | Songs a student is actively working on. Status, self-rating, target lesson           |
| `student_song_progress`          | Mastery state per (student, song). Practice minutes, sessions, last practiced        |
| `practice_sessions`              | Individual practice log entries                                                      |
| `chord_quiz_attempts`            | Per-attempt chord-quiz results for skill tracking                                    |
| `skills`, `student_skills`       | Skill tree (technique catalog + per-student progress)                                |
| `spotify_matches`                | Pending Spotify→catalog matches awaiting admin approval                              |
| `apple_shortcut_song_import_log` | Audit of imports from iOS Shortcuts                                                  |
| `sync_conflicts`                 | Conflicts during bulk import / sync that need manual resolution                      |

### 2.4 AI

| Table                  | Purpose                                                              |
| ---------------------- | -------------------------------------------------------------------- |
| `ai_conversations`     | Multi-turn AI chat threads, per user, with auto-title                |
| `ai_messages`          | Conversation messages (role: user/assistant/system)                  |
| `ai_generations`       | Fire-and-forget log of every AI call (agent, tokens, latency, error) |
| `ai_usage_stats`       | Daily roll-up per user/agent for rate limiting + billing             |
| `ai_prompt_templates`  | Versioned prompts editable from admin UI                             |
| `agent_execution_logs` | Granular per-step trace of multi-step agent runs                     |

### 2.5 Integrations & sync

| Table                   | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| `webhook_subscriptions` | Active Google Calendar push channels with expiry       |
| `drive_files`           | Mirror of Google Drive files relevant to lessons/songs |

### 2.6 Notifications

| Table                      | Purpose                             |
| -------------------------- | ----------------------------------- |
| `notification_queue`       | Pending notifications awaiting send |
| `notification_log`         | Sent + failed notifications history |
| `notification_preferences` | Per-user channel + frequency rules  |
| `in_app_notifications`     | In-product inbox                    |

### 2.7 Content (social/publishing add-on)

| Table                  | Purpose                        |
| ---------------------- | ------------------------------ |
| `content_posts`        | Scheduled social posts (admin) |
| `content_post_metrics` | Engagement metrics per post    |
| `hashtag_sets`         | Reusable hashtag bundles       |

### 2.8 Audit

`audit_log` is **monthly RANGE-partitioned** (`audit_log_2026_01`, … + `audit_log_default` overflow). Triggers on `profiles`, `lessons`, `assignments`, `songs`, `student_song_progress`, `practice_sessions` write INSERT/UPDATE/DELETE deltas as JSONB. Archive function `archive_old_audit_partitions(months_to_keep)` rolls off old partitions.

---

## 3. RLS posture (truth table)

| Table                                        | Admin    | Teacher                    | Student                     | Parent            | Public |
| -------------------------------------------- | -------- | -------------------------- | --------------------------- | ----------------- | ------ |
| `profiles`                                   | full     | self + assigned students   | self                        | own children read | —      |
| `lessons`                                    | full     | own taught (R+W)           | own attended (R)            | child lessons (R) | —      |
| `lesson_songs`                               | full     | own lessons (R+W)          | own lessons (R)             | via lesson        | —      |
| `assignments`                                | full     | own students (R+W)         | own (R, status-update only) | child (R)         | —      |
| `songs`                                      | full     | all active (R+W)           | active (R)                  | via lesson_songs  | —      |
| `student_repertoire`                         | full     | student's (R+W)            | own (R+W)                   | child (R)         | —      |
| `student_song_progress`                      | full     | student's (R+W)            | own (R, derived)            | child (R)         | —      |
| `practice_sessions`                          | full     | student's (R)              | own (R+W)                   | child (R)         | —      |
| `assignment_templates`                       | full     | own + shared (R+W)         | —                           | —                 | —      |
| `ai_conversations`, `ai_messages`            | full     | own (R+W)                  | own (R+W)                   | —                 | —      |
| `ai_generations`, `ai_usage_stats`           | full (R) | own (R)                    | own (R)                     | —                 | —      |
| `api_keys`                                   | full     | own (R+W)                  | own (R+W)                   | —                 | —      |
| `webhook_subscriptions`, `user_integrations` | full     | own (R+W)                  | own (R+W)                   | —                 | —      |
| `audit_log`                                  | full     | own actions + own students | own actions                 | —                 | —      |

**Test-account guard**: every write server-action calls `guardTestAccountMutation()` to block writes from `is_development=true` accounts in non-dev environments.

---

## 4. Functional requirements by role

For each capability: **what the user needs**, the **API endpoint(s) / server action(s)** that back it, and **external systems** the capability depends on. The rebuild SHOULD route through these — do not invent new endpoints if one already exists.

### 4.1 Admin

Admin is the operational role — system-wide visibility, content moderation, configuration. Admin always has access to all teacher and student capabilities below.

#### A1. User management

- List all users with filters (role, status, last sign-in).
  → `GET /api/users` · `GET /api/admin/users`
- Invite a new user, send invitation email.
  → `POST /api/users` + `app/actions/admin/invite.ts` · email via Gmail SMTP
- Edit any profile, toggle role flags, deactivate, link shadow user to real auth.
  → `PATCH /api/users/:id` · `POST /api/admin/link-shadow-user` · `POST /api/admin/set-passwords` (service-role)
- Pipeline view: leads → trials → active → churned.
  → `GET /api/students/pipeline` (`student_status` enum funnel)

#### A2. Content moderation

- Approve / reject student-submitted song requests.
  → `app/actions/song-requests.ts::reviewSongRequest`
- Approve Spotify match suggestions (queue worker fills this from cron).
  → `POST /api/spotify/matches/approve` · `/reject` · `/action`
- Manage Song of the Week.
  → `app/actions/song-of-the-week.ts::{setSongOfTheWeek, deactivateSongOfTheWeek}`
- Bulk import songs from CSV with validateOnly preview.
  → `app/actions/import-csv-songs.ts`
- Drive video catalog + auto-scan.
  → `GET/PATCH/DELETE /api/admin/drive-videos` · cron `drive-video-scan`

#### A3. System health & observability

- Health dashboard (DB, queue depth, cron last-run, integration tokens).
  → `GET /api/health` · `GET /api/database/status` · `GET /api/students/health`
- Stats: lesson counts, song engagement, chord usage, advanced analytics.
  → `GET /api/lessons/stats/advanced` · `GET /api/song/stats/*` · `GET /api/cohorts/analytics`
- Notification analytics + auth-event audit.
  → `GET /api/admin/notification-analytics` · `audit_log` browsing
- Manual cron dispatch for ops.
  → `GET /api/cron/dispatcher` (cron-secret gated)

#### A4. AI configuration & insights

- Edit prompt templates (versioned via `ai_prompt_templates`).
  → admin-only writes; templates loaded by `lib/ai/agents/*`
- Admin BI agent: data-driven insights for the school.
  → `app/actions/ai.ts::generateAdminInsightsStream` (admin-only rate-limit tier)
- AI debug & usage dashboards.
  → `GET /api/ai/debug` · `ai_usage_stats` aggregates

#### A5. Content publishing (social)

- Schedule posts, manage hashtags, view metrics.
  → `GET/POST /api/content/posts` · `GET /api/content/calendar` · `GET/PUT /api/content/hashtag-sets/:id`

#### A6. iOS widget (admin variant)

- API-key-authenticated stats widget.
  → `GET /api/widget/admin` (api-key + role:admin)

### 4.2 Teacher

Teacher is the primary daily user. Workflow centers on lesson lifecycle.

#### T1. Student management (own students only)

- List own students with health signals (needs-attention, last lesson, practice trend).
  → `GET /api/teacher/students` · `GET /api/students/needs-attention` · `GET /api/students/health`
- Add a new student (creates `profiles` row; can also create a shadow student from calendar).
  → `app/actions/student-management.ts::createStudentProfile`
- Invite a shadow student (two-step: set `invite_email` then send via `inviteUserByEmail`). See [ADR 0002](./adr/2026-05-17-0002-shadow-students-in-the-lesson-system.md).
  → `PATCH /api/users` + `app/dashboard/actions.ts::sendInvite` (shadow-aware path TBD)
- View student detail + history + repertoire + progress export.
  → `GET /api/users/:id` · `GET /api/exports/student/:id` (CSV/JSON)

#### T2. Lesson lifecycle

- Calendar view of upcoming lessons (week / month).
  → `GET /api/lessons/schedule` · `GET /api/teacher/lessons`
- Create / reschedule / cancel a lesson; status transitions SCHEDULED → IN_PROGRESS → COMPLETED.
  → `POST /api/lessons` · `app/actions/lessons.ts::{createLesson, updateLesson, rescheduleLesson, completeLessonAction}`
- Bulk operations: bulk reschedule, bulk delete.
  → `POST/PUT/DELETE /api/lessons/bulk`
- Live-mode lesson view (`/dashboard/lessons/[id]/live`).
  → reads `lesson_songs`, writes status updates via `updateLessonSongStatus`
- Lesson notes editor with AI assist.
  → `app/actions/ai.ts::generateLessonNotesStream` + `generatePostLessonSummaryStream` (OpenRouter / Ollama)
- Import lessons from Google Calendar (auto-create shadow students for unknown attendees, dedup-aware per [ADR 0002](./adr/2026-05-17-0002-shadow-students-in-the-lesson-system.md)).
  → `app/actions/import-lessons.ts` · `lib/services/import-utils.ts::matchStudentByEmail` (matches `email OR invite_email`) · Google Calendar API
- Enable real-time Google Calendar sync.
  → `app/actions/calendar-webhook.ts::enableCalendarWebhook` · webhook receives at `POST /api/webhooks/google-calendar`

#### T3. Song catalog management

- Search / filter / view the full song catalog.
  → `GET /api/song` · `GET /api/song/search` · `GET /api/song/:id`
- Add a new song manually, from CSV, or from Spotify.
  → `POST /api/song/create` · `POST /api/song/from-spotify` (admin+teacher) · `POST /api/spotify/send-to-strummy` · CSV via `import-csv-songs.ts`
- Edit / soft-delete / bulk-delete songs.
  → `PUT /api/song/update` · `POST/DELETE /api/song/bulk` · `songs.ts::bulkSoftDeleteSongs`
- Manage favorites.
  → `GET/POST/DELETE /api/song/favorites`
- Attach videos (Drive upload, YouTube URL).
  → `GET/POST /api/song/:id/videos` · `POST /api/song/:id/videos/upload-url` (Google Drive)
- Search Spotify, link tracks, view "now playing" for context.
  → `GET /api/spotify/search` · `GET /api/spotify/track-from-url` · `GET /api/spotify/now-playing` · `POST /api/spotify/sync`

#### T4. Assignment workflow

- Create assignment (from scratch or template), assign to student, set due date.
  → `POST /api/assignments` · `app/actions/assignments.ts::createAssignmentFromTemplate`
- Edit / delete / track status (`not_started` → `in_progress` → `completed` / `overdue`).
  → `GET/PATCH/DELETE /api/assignments/:id`
- AI-generate assignment description from a target skill or song.
  → `app/actions/ai.ts::generateAssignmentStream`
- Manage assignment templates.
  → `POST /api/lessons/templates` · `app/actions/assignment-templates.ts`

#### T5. Communication

- Compose email drafts to students/parents with AI assist.
  → `app/actions/ai.ts::generateEmailDraftStream` · `lib/email/` SMTP send
- Manage own notifications and in-app inbox.
  → `GET /api/notifications/dashboard` · `GET /api/notifications/unsubscribe` · `app/actions/in-app-notifications.ts`

#### T6. Analytics for own students

- Per-student progress, practice trends, chord analysis.
  → `GET /api/lessons/analytics` · `GET /api/song/stats/advanced` · `GET /api/song/stats/chords`
- Teacher performance dashboard.
  → `GET /api/teachers/performance`
- AI student-progress analyzer (narrative summary).
  → `app/actions/ai.ts::analyzeStudentProgressStream`

#### T7. Settings

- Profile, MFA, API keys, notification preferences, integrations (Google Calendar/Drive/Spotify), theme.
  → `app/actions/{account, mfa, api-keys, settings, notification-preferences}.ts` · `GET /api/spotify/authorize` · `GET /api/calendar-sync`

### 4.3 Student

Student is mostly read + log + self-reflect. Writes are tightly scoped to own data.

#### S1. Personal dashboard

- Next lesson, current repertoire, pending assignments, Song of the Week, practice streak.
  → `GET /api/dashboard/stats` · `GET /api/student/lessons` · `GET /api/stats/weekly`
- View Song of the Week and one-click add to repertoire.
  → `app/actions/song-of-the-week.ts::{getCurrentSongOfTheWeek, addSotwToRepertoire}`

#### S2. Lessons (read + status)

- View own lesson history with notes the teacher shared.
  → `GET /api/student/lessons` · `GET /api/lessons/:id` (RLS-restricted to attended)
- Update per-song progress within a lesson (`to_learn` → `mastered`).
  → `GET/PUT /api/student/song-status` · history at `GET /api/student/song-status-history`

#### S3. Repertoire & practice

- Manage own repertoire: add, remove, self-rate, set target lesson.
  → `app/actions/repertoire.ts::*` · `app/actions/self-rating.ts::updateSelfRatingAction`
- Log a practice session.
  → `app/actions/practice.ts::logPracticeSession` (DB trigger updates `student_song_progress`)
- View own progress map: per-song mastery + practice minutes.
  → `app/actions/repertoire.ts::getStudentSongProgressAction`
- Bulk-add multiple songs to repertoire.
  → `POST /api/repertoire/bulk`

#### S4. Assignments

- See own assignments, update status (`in_progress` → `submitted`).
  → `GET /api/assignments` (RLS scoped to own) · `app/actions/assignments.ts::updateAssignmentStatus`

#### S5. Skills (chord quiz + skill tree)

- Take chord quiz, submit batch results.
  → `app/actions/chord-quiz.ts::submitChordQuizSession`
- View own skill tree progress.
  → `student_skills` queries (TBD route — currently UI-coupled)

#### S6. AI assistance (limited)

- Chat with the general guitar assistant (per-user rate-limited).
  → `app/actions/ai.ts::generateAIResponseStream` (Chat agent)
- AI song notes view (teaching tips for a song in their repertoire).
  → `app/actions/ai.ts::generateSongNotesStream`

#### S7. Requests

- Request a new song be added to the catalog.
  → `app/actions/song-requests.ts::submitSongRequest`

#### S8. Settings

- Same as teacher (profile / MFA / API keys / preferences) — `is_development` accounts blocked from writes.

#### S9. Widget

- iOS widget for own lessons + assignments + streak.
  → `GET /api/widget/dashboard` (api-key + role:teacher OR student)

---

## 5. AI capability matrix

10 specialized agents under `lib/ai/agents/`. Provider selected by `lib/ai/provider-factory.ts` (Ollama first if `AI_PREFER_LOCAL=true`, fallback OpenRouter). Rate-limited per (user, agent) via `lib/ai/rate-limiter.ts`, logged to `ai_generations`/`ai_usage_stats`.

| Agent                       | Purpose                                      | Roles             | Where used           |
| --------------------------- | -------------------------------------------- | ----------------- | -------------------- |
| Chat                        | General-purpose Q&A                          | All authenticated | `/dashboard/ai`      |
| Lesson Notes                | Generate structured lesson notes             | Teacher           | Lesson detail editor |
| Post-Lesson Summary         | Brief recap for student                      | Teacher           | Lesson complete flow |
| Assignment                  | Generate assignment description              | Teacher           | Assignment form      |
| Communication (Email Draft) | Draft emails to students/parents             | Teacher, Admin    | Email composer       |
| Student Progress Insights   | Narrative analysis of practice + lesson data | Teacher, Admin    | Student detail       |
| Admin Dashboard BI          | Operational insights for the school          | Admin             | Admin dashboard      |
| Song Notes                  | Teaching tips for a song                     | Teacher, Student  | Song detail          |
| Song Notes Enhancer         | Polish rough teacher notes                   | Teacher           | Song edit            |
| Song Normalization          | Clean data for Spotify matching              | Admin / system    | Cron + admin tool    |

All agents stream via Vercel AI SDK. Prompt-injection guardrails in `lib/ai/agents/*`. Schemas in `lib/ai/schemas/`.

---

## 6. External connections (must be alive for which features)

| Service                                | Auth                            | Powers                                      | Roles          | Failure mode                                                                                |
| -------------------------------------- | ------------------------------- | ------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------- |
| **Supabase Postgres + Auth + Storage** | service-role / anon             | Everything                                  | All            | Hard dependency — app down                                                                  |
| **OpenRouter**                         | API key                         | All AI agents (cloud path)                  | All            | Falls back to Ollama if `AI_PREFER_LOCAL`; UI shows "AI unavailable" otherwise              |
| **Ollama** (optional local)            | none                            | AI agents (local path)                      | Dev            | Falls back to OpenRouter                                                                    |
| **Google Calendar API**                | OAuth2 (per teacher)            | Lesson sync, lesson import, push webhook    | Teacher        | Manual lesson creation still works; webhook re-registered nightly via cron `renew-webhooks` |
| **Google Drive API**                   | OAuth2 (per teacher)            | Song video uploads, lesson assets           | Teacher        | Uploads blocked, viewing of previously uploaded files OK                                    |
| **Spotify Web API**                    | OAuth2 + client-credentials     | Catalog enrichment, song match, now-playing | Admin, Teacher | Circuit breaker opens after 5 failures, 60s reset; manual song add still works              |
| **Gmail SMTP**                         | App password                    | All transactional email                     | System         | Retried by `process-notification-queue`; dead-letter after N retries                        |
| **Sentry**                             | DSN                             | Error tracking                              | System         | Silent — app unaffected                                                                     |
| **PostHog**                            | API key (via `/ingest` rewrite) | Analytics, feature flags                    | System         | Silent — app unaffected                                                                     |
| **Vercel Cron**                        | `CRON_SECRET`                   | 13 scheduled jobs                           | System         | Vercel-managed; failures alert via Sentry                                                   |

### Cron job inventory

| Schedule  | Endpoint                               | Purpose                                                              |
| --------- | -------------------------------------- | -------------------------------------------------------------------- |
| Daily     | `/api/cron/lesson-reminders`           | Email students 24h before lesson                                     |
| Daily     | `/api/cron/assignment-due-reminders`   | Email students assignments due tomorrow                              |
| Daily     | `/api/cron/assignment-overdue-check`   | Flag overdue, notify teacher                                         |
| Daily     | `/api/cron/update-student-status`      | Recompute `student_status` (lead/trial/active/churned) from activity |
| Daily     | `/api/cron/admin-monitoring`           | Snapshot health metrics for admin dashboard                          |
| Daily     | `/api/cron/cleanup-auth-events`        | Roll off old `auth_events`                                           |
| Daily     | `/api/cron/drive-video-scan`           | Scan Drive folder for new videos to catalog                          |
| Daily     | `/api/cron/daily-report`               | Compose daily ops report                                             |
| Weekly    | `/api/cron/weekly-digest`              | Email teachers + admins weekly summary                               |
| Weekly    | `/api/cron/weekly-insights`            | Run AI insights for active cohorts                                   |
| Every 15m | `/api/cron/process-notification-queue` | Drain `notification_queue` via SMTP                                  |
| Nightly   | `/api/cron/renew-webhooks`             | Re-register Google Calendar push channels before expiry              |
| Manual    | `/api/cron/dispatcher`                 | Admin-triggered ad-hoc job runner                                    |

---

## 7. Cross-cutting / non-functional requirements

### 7.1 Auth & session

- Supabase Auth session via cookie. `app/dashboard/layout.tsx` redirects unauthenticated users to `/sign-in?redirect=/dashboard`.
- MFA via TOTP (`app/actions/mfa.ts`). MFA challenge required for sensitive routes.
- Bearer-token API keys (`Authorization: Bearer gcrm_…`) for external clients. Token hashed in DB; plaintext shown once at creation.
- Test-account writes blocked by `guardTestAccountMutation()` in non-dev environments.

### 7.2 Data integrity

- **RLS on every table.** Server-side privileged operations use the service-role client (`lib/supabase/admin.ts`) and validate `auth.uid()` before bypassing.
- Soft delete on `songs`, `lessons`, `assignments` via `deleted_at`.
- `audit_log` captures every write to mutable domain tables — never deleted, only rolled to monthly partitions.
- Server actions wrap multi-table writes in transactions where Supabase supports it.

### 7.3 Performance

- Server Components by default; Client Components only where interactivity demands.
- TanStack Query for client state with key conventions in `lib/queries/`.
- Partitioned `audit_log` keeps audit queries scoped per month.
- Spotify circuit breaker, AI rate limiter, notification queue all prevent thundering-herd cascades.
- `lib/database/connection.ts` dual-routes (local vs remote Supabase) based on header > cookie > env; **never** cache the wrong client across requests.

### 7.4 Observability

- Sentry instrumentation in `instrumentation.ts` (server + client).
- Structured logs through `lib/logging/` — never log tokens (mask via `token.slice(0, 6) + '...'`).
- `notification_log` is the audit trail for outbound email.
- Cron jobs report success/failure to Sentry + Vercel logs.

### 7.5 Validation

- All API inputs validated with Zod schemas from `schemas/` (31 schema files). Server actions revalidate at boundary.
- Never trust `student_id` from a payload — always derive from session for student writes (`app/actions/chord-quiz.ts`, `practice.ts`, etc.). Corollary: shadow students cannot self-log practice or self-rate; this is intentional and there are **no teacher-proxy variants** for these actions. See [ADR 0002](./adr/2026-05-17-0002-shadow-students-in-the-lesson-system.md) §7 / W1.
- Outbound email to a student MUST route through `getDeliverableEmail(profile)` (per [ADR 0002](./adr/2026-05-17-0002-shadow-students-in-the-lesson-system.md)) — direct `profile.email` access in a notification or AI-draft path is a code-review red flag.

### 7.6 File hygiene (project rules)

- Files <150 LOC, components <200 LOC, hooks <150 LOC, functions <50 LOC.
- No `any`. Use `unknown` if truly unknown.
- Booleans prefixed `is/has/can`. Hooks prefixed `use`. Sub-components `Parent.Section.tsx`.
- API responses: never use `data` as the field name.

### 7.7 Testing

- Unit + integration (Jest), E2E (Playwright). Pyramid 70/20/10.
- Auth baseline spec: `tests/e2e/auth/role-login.spec.ts` (admin / teacher / student must always reach `/dashboard`). This is the **canary** during the dashboard rebuild — break it and you've regressed the foundation.
- Integration tests must hit a real local Supabase, never mocks (`tasks/lessons-coverage` policy).

---

## 8. Rebuild ordering (suggested, not normative)

When restoring the dashboard one card at a time:

1. **Auth + role indicator** (DONE — root `app/dashboard/page.tsx`).
2. **Lessons widget** (teacher) — `GET /api/teacher/lessons` next 7 days. The single most-used screen.
3. **Today / next lesson** (student) — `GET /api/student/lessons`.
4. **Repertoire + practice log** (student) — uses existing actions, no new API needed.
5. **Student health** (teacher) — `GET /api/students/needs-attention`.
6. **Admin user pipeline** (admin) — `GET /api/students/pipeline`.
7. **Song catalog** (teacher) — `GET /api/song/search`.
8. **AI assistants** (lesson notes, assignment, post-lesson summary).
9. **Calendar sync UI** (teacher).
10. **Stats / analytics cards** (all roles).
11. **Spotify / Drive integrations** (teacher / admin).
12. **Content publishing** (admin) — lowest priority since the schema exists but the use case is auxiliary.

Each step: add the card, render data from the existing API, verify role-login spec still green, ship.

---

## 9. What this document is NOT

- Not a UI spec. No mockups, no copy, no component breakdown.
- Not a migration plan. Schema lives in `supabase/migrations/`; deltas go through `supabase-migration-assistant`.
- Not a security policy. See `docs/2026-02-02-SECURITY-TEST-SUMMARY.md` and the `security-reviewer` agent for that.
- Not exhaustive of every internal helper. Lib utilities (`lib/access/`, `lib/queries/`) exist but are implementation detail — consult the source.

When you change the API surface, the data model, or external connections, update **§2, §3, §4, §6** of this file and bump the `updated:` date.
