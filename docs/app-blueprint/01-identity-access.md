---
created: 2026-07-18
updated: 2026-07-18
domain: Identity & Access
tables:
  [
    profiles,
    user_roles,
    user_preferences,
    user_settings,
    auth_events,
    auth_rate_limits,
    api_keys,
    user_history,
  ]
maturity: mixed
---

# Identity & Access

## Purpose

Everything about who a user is and what they may touch: the `profiles` row that every other
domain FKs into, the three-role RBAC model (Admin / Teacher / Student) enforced by RLS, the
shadow-student lifecycle (teacher-created profiles without auth accounts, claimed later via
invite), account security (lockout, rate limiting, auth audit trail), per-user settings and
onboarding preferences, and bearer-token API keys for external access.

Supersedes the former specs 04-users, 06-auth-shadow, and 10-profile-multirole (deleted
2026-07-18; recoverable via git history). Most of what those specs listed as unbuilt has since
shipped — this doc records the verified current state.

## Data model

| Table              | Role                                                                                                                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`         | Central identity row. `user_id` → `auth.users` (**null for shadows**). Role booleans + lifecycle + security columns.                                                                            |
| `user_roles`       | RBAC junction (`user_id`, `role` enum `admin\|teacher\|student`). Kept in sync **from** `profiles` booleans by trigger.                                                                         |
| `user_preferences` | Onboarding answers: `goals[]`, `skill_level`, `learning_style[]`, `instrument_preference[]`.                                                                                                    |
| `user_settings`    | Per-user app settings: `theme`, `language` (en/pl/es/de/fr), `timezone`, `profile_visibility`, `show_email`, `show_last_seen`, `font_scheme`.                                                   |
| `auth_events`      | Auth audit stream — 20-value `auth_event_type` enum covering signup/signin/invite/shadow lifecycle, with `email_status`, `ip_address`, `metadata`.                                              |
| `auth_rate_limits` | Attempt log (`identifier`, `operation`, `attempted_at`) backing the `check_auth_rate_limit` RPC.                                                                                                |
| `api_keys`         | Bearer keys for the external API: `key_hash` (SHA-256 — plaintext never stored), `name`, `is_active`, `last_used_at`.                                                                           |
| `user_history`     | Trigger-written audit of profile changes (`created/updated/deleted/role_changed/status_changed`, jsonb before/after). `user_id` deliberately not FK-enforced — audit rows outlive their source. |

Key `profiles` columns beyond the basics: role flags (`is_admin`/`is_teacher`/`is_student`,
synced to `user_roles`), `is_shadow` + `invite_email` (shadow lifecycle), `is_active`
("false disables login") + `deleted_at` (soft delete), `student_status` (default `archived`),
`failed_login_attempts` + `locked_until` (lockout), `first_name`/`last_name` (+
`trg_sync_full_name` keeping `full_name` coherent), `parent_id` + `is_parent` (parent
concept — see Behavior), `deletion_requested_at`/`deletion_scheduled_for` (GDPR-style
deletion request), `onboarding_completed`, `sign_in_count`/`last_sign_in_at`.

Notable constraints/indexes: `ix_profiles_email_lower` (unique, case-insensitive),
`no_self_parent`, partial indexes on `invite_email`, `locked_until`,
`deletion_scheduled_for`, and `is_parent = true`. The `user_overview` and
`lesson_counts_*` views are `security_invoker`.

### Triggers & functions (behavioral one-liners)

- `sync_profile_roles` — flipping `is_admin/is_teacher/is_student` on `profiles` rewrites the matching `user_roles` rows; the booleans are the write surface, the junction is derived.
- `handle_new_user` — on `auth.users` insert, creates/claims the profile; matches `invite_email`/`email` against an existing shadow and calls `transfer_shadow_profile_references()` to migrate lessons/assignments/repertoire. **Post-baseline drift**: patched on live StrummyProd (migration `20260622210000`) to persist `first_name`/`last_name` from signup metadata.
- `claim_shadow_profile` / `transfer_shadow_profile_references` — **post-baseline drift**: exist on live StrummyProd, not in the 2026-06-22 baseline dump. Shadow → real account reference transfer (also invoked by `POST /api/admin/link-shadow-user`).
- `has_role(_role)` — RLS helper reading `user_roles`.
- `check_auth_rate_limit(identifier, operation, window_ms)` / `cleanup_auth_rate_limits()` — DB side of auth rate limiting.
- `track_user_changes` (→ `user_history`), `tr_audit_profiles` (→ legacy `audit_log`), `tr_notify_student_welcome`, `tr_initialize_notification_preferences` — profile insert/update side-effects.
- ~199 RLS policies overall; profiles shape: SELECT own-or-admin + teacher read; UPDATE self-or-admin; parent policies via `is_child_of_parent()` exist but the parent UX is unbuilt.

## Behavior & rules

- **RLS is the security boundary** (ADR-0001); app-layer checks are convenience. Mechanics: `docs/app-blueprint/reference/ARCHITECTURE.md` §Role-Based Access Control.
- **Multi-role is real**: a profile may hold several roles (the owner is Admin+Teacher). View selection is highest-role-wins with Teacher > Student > Admin precedence (`resolveActiveView`, `app/dashboard/page.tsx`), overridable via `?view=` gated on held roles. Flags (`is_parent`, `is_development`) are not roles and never enter view selection.
- **Shadow lifecycle**: teacher creates a shadow (`is_shadow=true`, `user_id=null`) via `/dashboard/users/new` or inline from the lesson form (see 02); teacher sets+sends an invite (`invite_email`, dedup 409 on collision, `shadow_invite_email_set`/`shadow_invite_sent` events); student signs up → `handle_new_user` claims the shadow and transfers references; `shadow_link_completed`/`shadow_link_failed` logged. Every student-bound email passes the deliverable-email chokepoint (`getDeliverableEmail`) — an un-invited shadow returns `null`, the send is skipped and logged, never mailed to a `shadow_*@placeholder.com` placeholder.
- **Soft delete, never hard**: `DELETE /api/users/[id]` sets `is_active=false` + `deleted_at` + auth ban; reactivation lifts both. The only remaining `profiles.delete()` paths are shadow-only cleanups in `app/dashboard/actions.ts` (orphan sweep + explicit shadow delete), which is intentional — shadows have no auth account to strand.
- **Lockout**: 5 failed attempts → 30-min `locked_until` (`lib/auth/account-lockout.ts`, consulted by `signIn`). Unlock clears both `failed_login_attempts` and `locked_until` (`app/actions/admin/lockout.ts`).
- **Rate limiting**: dual-layer — in-memory `lib/auth/rate-limiter.ts` per identifier+operation, backed by the `check_auth_rate_limit` RPC over `auth_rate_limits`; a cleanup cron prunes rows. Details: `docs/app-blueprint/reference/ARCHITECTURE.md` §Rate Limiting.
- **Google sign-in** is first-class login via `/auth/callback` — deliberately distinct from the calendar-integrations OAuth callback `/api/oauth2/callback` (see 02). A Google email matching a shadow claims it rather than duplicating.
- **MFA was removed by design** (spec 06 §6.4) — sign-in is single-step; do not reintroduce.
- **API keys**: `Bearer gcrm_<token>` → SHA-256 hash lookup in `api_keys` (`lib/auth/api-auth.ts` `authenticateRequest`), used by external-API routes (e.g. `app/api/widget/admin`). Keys are per-user, revocable (`is_active`), plaintext shown once at creation.
- **Self-edit**: `PUT /api/users/profile` (self-only) accepts `first_name/last_name/full_name/phone/avatar_url`, 400s on empty body. Admin edit is the separate `PUT /api/users/[id]` (partial payload; flags never clobbered).
- **Parent role is aspirational**: schema (`parent_id`, `is_parent`, `is_child_of_parent` RLS policies on assignments etc.) exists; no parent-facing UI or flows are built. One-liner status, not a gap brief — v1.1 at the earliest.

## UI surfaces

| Surface                                                                           | Route / component                                                                                                              | Maturity                 |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| Sign-in / sign-up / auth callback                                                 | `app/(auth)/*`, `components/auth/*` (incl. Google button)                                                                      | mounted                  |
| Onboarding                                                                        | `/onboarding` (writes `user_preferences` via `app/actions/onboarding.ts`)                                                      | mounted                  |
| Users list (search/role/status/active filters, shadow badge, inline invite)       | `/dashboard/users` → `UsersListEditorial`                                                                                      | mounted (nav "Students") |
| Student detail (stats, repertoire, lessons, shadow badge, invite + delete-shadow) | `/dashboard/users/[id]` → `StudentDetailEditorial`                                                                             | mounted                  |
| User edit (name, role flags, active toggle)                                       | `/dashboard/users/[id]/edit` → `UserEditFormEditorial` (admin-only)                                                            | mounted                  |
| Create student (incl. shadow)                                                     | `/dashboard/users/new` → `CreateStudentForm`                                                                                   | mounted                  |
| Song import for a student                                                         | `/dashboard/users/[id]/import` → `SongImportForm`                                                                              | mounted                  |
| Settings (self-edit name/phone/avatar-URL, role label)                            | `/dashboard/settings` → `SettingsEditorial` + `IntegrationsSection` + `ApiKeyManager`                                          | mounted                  |
| Profile page                                                                      | `/dashboard/profile` → redirect to `/dashboard/settings` (single self-edit surface)                                            | mounted (redirect)       |
| API key management                                                                | `ApiKeyManager` on settings; CRUD via `app/api/api-keys/*`                                                                     | mounted                  |
| Notification preferences                                                          | `/dashboard/settings/notifications` → `NotificationPreferences` (owned by 07)                                                  | mounted                  |
| `/dashboard/users/invite`                                                         | "Coming soon" stub — invite lives inline on list/detail instead                                                                | dormant stub             |
| Admin lockout visibility                                                          | `getLockedAccounts`/`unlockAccount` actions exist; **no component mounts them** (widget lost in the July dead-component purge) | unbuilt (actions built)  |
| `user_settings` panel (theme/language/timezone)                                   | `getUserSettings`/`saveUserSettings` in `app/actions/settings.ts`; **no UI consumer**                                          | unbuilt (actions built)  |
| Avatar upload                                                                     | Settings form takes a raw URL string; no storage-bucket upload                                                                 | unbuilt                  |
| Parent experience                                                                 | —                                                                                                                              | aspirational             |

## Gaps & planned work

### IDA-1 — Retire `user_settings` · **decided 2026-07-18: retire (T4 debt)**

**Decided in grill**: no UI will honor these fields soon — theme is client-side, language
has no i18n, visibility means nothing yet. Retire: delete the unconsumed server-action pair
(`app/actions/settings.ts`: `getUserSettings`/`saveUserSettings`) and queue a drop migration
for `user_settings` in the next schema-consolidation pass (T4). If timezone ever matters
(e.g. notification scheduling), it moves to `profiles` as a single column. **Files**:
`app/actions/settings.ts` (delete), `supabase/migrations/` (drop), this doc's frontmatter
`tables:` on completion. **Accept**: no references remain (`grep user_settings` clean in
app/, components/, lib/); build + tests green; migration applied to StrummyProd.

### IDA-2 — Avatar upload via storage bucket

**Missing**: `avatar_url` is a bare URL text input in `SettingsEditorial`; no file upload
exists anywhere. **Approach**: create a public `avatars` storage bucket (owner-write policy,
public read); add a file input + client-side resize/limit to the settings Profile card;
upload via the browser Supabase client, then submit the public URL through the existing
`updateProfileNameAction` (schema already accepts `avatar_url`). Keep the URL field as a
fallback or drop it. **Files**: `components/settings/editorial/SettingsEditorial.tsx`, new
`lib/storage/avatar.ts` helper, storage-policy migration under `supabase/migrations/`.
**Accept**: uploading an image persists a working `avatar_url`; a >2 MB or non-image file is
rejected with a visible error; another user cannot overwrite my object (storage policy test).

### IDA-3 — Admin lockout widget (re-mount)

**Missing**: `app/actions/admin/lockout.ts` (`getLockedAccounts`, `unlockAccount`, tested)
has no consuming component — the `LockedAccountsSection` widget referenced by spec 06 no
longer exists after the dead-component deletions. **Approach**: small editorial card on the
admin dashboard (`components/dashboard/` next to `AdminDashboardEditorial`) listing profiles
with `locked_until > now()` (email, locked-until, attempts) and an Unlock button calling
`unlockAccount`; render nothing when the list is empty. **Files**: new
`components/dashboard/LockedAccountsCard.tsx`, mount in the admin dashboard view,
reuse the existing actions untouched. **Accept**: seed a locked profile → admin dashboard
lists it; Unlock clears `failed_login_attempts` + `locked_until` and the row disappears;
non-admin gets nothing (action already guards).

### IDA-4 — Surface `user_preferences` to the teacher · **decided 2026-07-18: build in v1.1**

**Decided in grill**: keep collecting at onboarding; surface to the teacher (real first-lesson
prep value). v1.1 — after the 5 students onboard. **Missing**: onboarding writes
goals/skill-level/learning-style, but nothing ever reads `user_preferences` — the teacher
can't see what the student told us. **Approach**: read the row in
`lib/services/student-detail-queries.ts` and render a compact "About this student" line
(skill level + goals chips) in `StudentDetailEditorial`; empty state hidden. **Files**:
`lib/services/student-detail-queries.ts`, `components/users/editorial/StudentDetailEditorial.tsx`.
**Accept**: a student who completed onboarding shows their skill level on the teacher's
detail view; a student without a row renders no empty section; RLS: teacher can read their
students' rows (verify — current policies are self+admin; may need a teacher SELECT policy).

### IDA-5 — Delete the `/dashboard/users/invite` stub

**Missing**: the route renders a "Coming soon" card while the real invite flow ships inline
(`InlineInviteButton`, `InviteShadowButton`). A reachable placeholder violates the
no-placeholder rule of the trust pass. **Approach**: delete
`app/dashboard/users/invite/page.tsx` (or redirect to `/dashboard/users`); grep for links to
the route first. **Files**: `app/dashboard/users/invite/`, any `href` referencing it.
**Accept**: route 404s (or redirects); `npm run lint && npm test` green; no nav/link points
at it.

## Test plan

- **RLS isolation (cross-role)**: `tests/e2e/cross-role/rls-data-isolation.spec.ts` and
  `tests/e2e/cross-role/access-control.spec.ts` — journeys C.\* in `reference/E2E_JOURNEYS.md`.
- **Auth/session**: `tests/e2e/auth/{role-login,sign-out,sign-up-complete}.spec.ts` (A1.1,
  A1.5, B1.\*). Uncovered per E2E_JOURNEYS: A1.3 password reset, A1.4 lockout.
- **Users management**: `tests/e2e/teacher/users-management.spec.ts` +
  `tests/e2e/teacher/student-onboarding.spec.ts` (A6.1–A6.3). Uncovered: A6.4 profile edit
  round-trip, A6.6 lockout/unlock (blocked on IDA-3), A6.7 role change.
- **API keys**: `tests/e2e/settings/api-keys.spec.ts` (B8.3 — spec exists; journey doc's ❌
  is stale).
- **Unit/integration**: `app/actions/__tests__/{api-keys,onboarding}.test.ts`,
  `app/actions/admin/__tests__/lockout.test.ts`, `app/auth/__tests__/actions.test.ts`
  (lockout + rate-limit branches), `lib/auth/rate-limiter.test.ts`, shadow-transfer DB test
  (`__tests__/database/shadow-user-linking.test.ts`).
- Gap acceptance tests are listed inline per gap; new RLS assertions belong in the
  `jest.config.rls.ts` suites (see `91-testing-strategy.md`).

## Open questions

1. ~~`user_settings` honor-or-drop~~ — **resolved 2026-07-18: retire** (see IDA-1).
2. **Account-deletion request flow**: `deletion_requested_at`/`deletion_scheduled_for` and
   `app/actions/account.ts` exist, but there is no cron that executes scheduled deletions and
   no settings UI to request one. Is self-service deletion a launch requirement (GDPR posture
   for 5 invited students) or owner-mediated?
3. **`user_history`/`auth_events` read surface**: both are written faithfully and read almost
   nowhere (auth_events only for pending invites + cleanup). Does the admin need an audit
   view, or is psql-on-demand acceptable for a single-operator system? (Overlaps 10-admin.)
4. **Teacher visibility scope**: profiles RLS currently lets teachers read broadly rather
   than only "students they teach". With one teacher this is moot; decide before a second
   teacher ever onboards.

## References

- Schema: `supabase/baseline/cloud_schema_2026-06-22.sql` (tables §profiles/§user_\*, enum
  `auth_event_type`, functions `handle_new_user`, `sync_profile_roles`, `check_auth_rate_limit`)
- Drift: `claim_shadow_profile`, `transfer_shadow_profile_references`, patched
  `handle_new_user` — see `00-overview.md` §Schema truth
- Superseded specs 04-users / 06-auth-shadow / 10-profile-multirole (deleted; git history);
  ADR-0002 (shadow students)
- Auth/RLS/rate-limiter mechanics: `docs/app-blueprint/reference/ARCHITECTURE.md`
- Related domains: lessons create shadow inline (02), notifications chokepoint (07), admin
  observability (10)
