---
created: 2026-06-16
updated: 2026-06-19
feature: Auth & Shadow Users
phase: 2
status: partial
---

> **Status (2026-06-19):** ~90% done — only the optional cron remains. **Done:** 6.1 shadow invite (set+send + `InviteShadowButton` UI + events), 6.2 deliverable-email chokepoint (`getDeliverableEmail` wired into notification pipeline), 6.5 Google sign-in (built + callback separated), **6.4 MFA fully removed** (branch + orphaned files deleted — branch `feature/auth-shadow-06`), **6.6 admin lockout visibility** (`app/actions/admin/lockout.ts` `getLockedAccounts`/`unlockAccount` + `LockedAccountsSection` widget on the admin dashboard, 6 tests), **6.3 calendar reconcile on link** (`shadow_link_completed`/`shadow_link_failed` logged in `link-shadow-user`; `reconcileCalendarForStudent` swaps future-event attendees via new `reconcileEventAttendee`, best-effort + system_logs dead-letter, 3 tests). **Remaining:** 6.7 stale-shadow cleanup cron (optional). **Follow-ups:** durable-retry queue for reconcile (currently best-effort); `handle_new_user` trigger-path link logging (DB-side).

# Spec 06 — Auth & Shadow Users

> Part of the [MASTER_SPEC](../MASTER_SPEC.md). Domain: [CONTEXT.md](../../CONTEXT.md) + [ADR-0002](../adr/2026-05-17-0002-shadow-students-in-the-lesson-system.md). Depends on [Phase 0](./00-phase-0-restore-truth.md) (notification_log) + [08-notifications](./08-notifications.md). Feeds [04-users](./04-users.md) (invite button), [02-lessons](./02-lessons.md), [07-calendar](./07-calendar.md).

## Goal

Complete the shadow → real Profile lifecycle so no flow strands a user (MASTER*SPEC §0 exit criterion 2) and no student-bound output is silently misaddressed (criterion 3). A teacher creates lessons against a shadow Profile (`is_shadow=true`, `user_id=null`), invites the real student, and on signup every reference — lessons, assignments, repertoire, future calendar attendees — migrates onto the claimed account with the shadow row gone. Every email to a student passes through one deliverable-email chokepoint that returns `null` for an un-invited shadow and logs the skip instead of mailing the `shadow*<uuid>@placeholder.com` placeholder. The two settled auth cleanups land alongside: the MFA dead-end branch is removed, and Google sign-in is finished as a first-class login distinct from the calendar-integrations OAuth.

This is the highest-value cluster in the project (ADR-0002): it is where shadow becomes claimed.

## Auth UI — current implementation (verified 2026-06-16)

> Title is **Auth UI**, not "Editorial UI": auth has **no editorial generation**. Auth screens are a single production generation; only onboarding has competing generations.

| Surface                                | Live component                                                                                     | Generation                             | State                        |
| -------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------- | ---------------------------- |
| Sign-in (`/(auth)/sign-in`)            | `app/(auth)/sign-in/page.tsx` (uses `components/auth/{AuthLayout,GoogleAuthButton,PasswordInput}`) | production (single, no version branch) | live                         |
| Sign-up (`/(auth)/sign-up`)            | `app/(auth)/sign-up/page.tsx` + `components/auth/useSignUpLogic.ts`                                | production (single)                    | live                         |
| Onboarding (`/onboarding`) **default** | `components/v2/onboarding/*` (`OnboardingV2`) — `DEFAULT_VERSION='v2'`, no cookie ⇒ v2             | v2 (`ui-version` cookie branch)        | **live default**             |
| Onboarding `v1` fallback               | `components/onboarding/OnboardingForm` (+ `OnboardingLayout/GoalSelector/SkillLevelSelector`)      | v1                                     | live only if cookie=`v1`     |
| Onboarding `v3`                        | `components/v2/stitch/onboarding/OnboardingStitch`                                                 | v3 (stitch)                            | live only if cookie=`v3`     |
| Auth artboards                         | `components/design-preview/auth/Auth*`                                                             | design-preview                         | **not wired** (preview only) |
| Onboarding artboards                   | `components/design-preview/onboarding/Onboard*`                                                    | design-preview                         | **not wired** (preview only) |

**What's built.** Sign-in (email+password single-step UI, **Google sign-in** via `handleGoogleSignIn` → `signInWithOAuth({provider:'google', redirectTo:'/auth/callback'})`, demo-account button); sign-up (`useSignUpLogic`, Google button, email-confirmation success screen); onboarding (role/goal/skill steps across three generations). Account-lockout **enforcement** is wired (`signIn` consults `checkAccountLockout`).

**What's missing (net-new for this spec).**

- **Invite dialog** on user detail — does **not** exist anywhere in `components/users` (incl. `components/users/editorial/StudentDetailEditorial.tsx`); only legacy `components/v2/users/UserDetail.Actions.tsx` mentions "invite" text, with no set-and-send wiring. Net-new per §6.1.
- **MFA challenge screen** — to be **removed**, not built: `components/auth/MFAChallengeDialog.tsx` is still **mounted** in `app/(auth)/sign-in/page.tsx` (the dead-end branch) and `MFASetup` in `app/dashboard/profile/profile.client.tsx`. §6.4 deletes these.
- **Admin lockout UI** — absent. Lockout is enforcement-only (`lib/auth/account-lockout.ts` + `signIn`); no `getLockedAccounts`/`unlockAccount` action and no admin widget. Net-new per §6.6.
- **Deliverable-email** — backend concern (`lib/email/*`), not a UI surface; no auth-UI work in §6.2.

**Productionize-to-editorial decision.** Production auth is **not** editorial — there is no `components/auth/editorial/` or `components/onboarding/editorial/` (other domains like users/lessons/songs do have `editorial/`). The `design-preview/auth` + `design-preview/onboarding` artboards are unwired prototypes. The only new admin surface this spec adds (lockout widget, §6.6 / DoD #4) is specced as editorial; the **existing sign-in/sign-up/onboarding screens are left as-is** (productionizing them to an editorial generation, and collapsing the onboarding `ui-version` v1/v2/v3 trees into one, is **out of scope** for spec 06 — it belongs with the broader editorial migration / DoD #5 cleanup, not the auth-shadow lifecycle work).

**Gap to this spec's target behavior (mapped to sub-specs).**

- **6.1 invite flow** — UI gap: no Invite dialog exists; must be built on user detail and wired to the single set-and-send action (surfacing the 409 inline).
- **6.2 deliverable-email** — no UI; only the dashboard "N lessons couldn't notify" count is new surface.
- **6.3 calendar reconcile** — no UI.
- **6.4 MFA remove** — UI gap is a **deletion**: unmount `MFAChallengeDialog` from sign-in + remove `MFASetup` from profile, then delete the components.
- **6.5 Google sign-in** — already built in UI (`handleGoogleSignIn` present in both sign-in and sign-up); gap is verify/harden only, no new UI.
- **6.6 admin lockout** — full UI gap: build the editorial admin widget + Unlock button.
- **6.7 stale-shadow cron** — no UI (picker "Include inactive" override is the only touch).

## User stories

- **Teacher invites a shadow.** As a teacher viewing an Unclaimed student (§2.4 / [04-users](./04-users.md)), I open an Invite dialog, enter the student's real email, and the system records `invite_email` and sends the Supabase invite in one action. If a different `invite_email` is already set, I get an error rather than a silent overwrite.
- **Student claims their account.** As an invited student I click the email link, set a password, and land on the dashboard with all my prior lessons, assignments, and repertoire already present; the shadow row is gone and there is exactly one Profile for my email.
- **Calendar follows the claim.** As a claimed student my future Google Calendar lessons show my real email as the attendee, not the placeholder.
- **No mail to placeholders.** As a teacher, reminders and summaries for an un-invited shadow are skipped and counted ("3 lessons couldn't notify the student") rather than bounced to a dead address.
- **Single-step sign-in.** As any user I sign in with email + password in one step — no challenge screen I can never satisfy.
- **Sign in with Google.** As a teacher I click "Sign in with Google" and land authenticated; if I already have a shadow Profile under that Google email, it is claimed, not duplicated.
- **Admin sees lockouts.** As an admin I see which accounts are locked out and can unlock one, clearing its failure counters.

## Sub-specs

### 6.1 — Shadow invite flow `1–2 days` _(highest-value item)_

**Current state.** Two halves exist but are disconnected. `PATCH /api/users` (`app/api/users/route.ts:343`) validates the caller is admin/teacher, confirms the target `is_shadow`, runs a dedup check (`email.eq.X OR invite_email.eq.X` on other rows → 409), writes `invite_email`, and returns the row — but it never calls `inviteUserByEmail` and logs no event. Separately, `sendUserInvite` (`app/dashboard/actions.ts:9`) calls `supabase.auth.admin.inviteUserByEmail(..., { redirectTo: '/accept-invitation' })` but **rejects shadows** (`if (targetProfile.is_shadow) throw`). `inviteUser` (same file) invites by raw email for the admin-create path. The link-on-signup side works: `handle_new_user` (`supabase/migrations/20260425000002_rewrite_handle_new_user_trigger.sql`) matches `invite_email` and calls `transfer_shadow_profile_references()`.

**Steps.**

1. Make the invite a single set-and-send action. Either extend `PATCH /api/users` to call `inviteUserByEmail(invite_email, { redirectTo: '/accept-invitation' })` after the successful update, or add a thin server action that calls PATCH then sends. Send via the admin client.
2. Drop the `is_shadow` rejection from the shadow path: a shadow **with** `invite_email` is exactly who we invite. Keep `sendUserInvite`'s real-user reset-confirmation path for already-real users; route shadows through the new path.
3. Log the lifecycle: `shadow_invite_email_set` when PATCH writes `invite_email`; `shadow_invite_sent` when `inviteUserByEmail` succeeds (use `lib/auth/auth-event-logger.ts`).
4. UI: wire the Invite dialog on the user detail (§2.4) to the single action; surface the 409 ("already associated with another user") inline.

**Done when.** Teacher invites → student clicks email → signs up → their lessons/assignments/repertoire appear on the real account, shadow row gone, `shadow_link_completed` logged (6.3 closes the calendar half).

### 6.2 — Deliverable-email chokepoint `1 day`

**Current state.** No chokepoint. `lib/email/send-lesson-email.ts` and `lib/email/send-reminder-email.ts` accept a raw `studentEmail` string and pass it straight to `transporter.sendMail({ to: studentEmail })`. `lib/auth/shadow-email.ts` has `isShadowPlaceholderEmail()` and `maskShadowEmail()` (mask the `shadow_<uuid>@placeholder.com` pattern → `null`) but **nothing imports them into the senders**. There is no resolution of `invite_email`, and no skip is logged.

**Steps.**

1. Create `lib/email/recipient.ts` exporting `getDeliverableEmail(p: { is_shadow: boolean; email: string; invite_email: string | null }): string | null` — return `p.is_shadow ? p.invite_email : p.email` (ADR-0002 §3). Treat a `placeholder.com` `email` as undeliverable too (reuse `isShadowPlaceholderEmail`).
2. Route **every** student-bound send through it: `send-lesson-email.ts`, `send-reminder-email.ts`, the post-lesson-summary AI draft path, and the notification-queue processor ([08-notifications](./08-notifications.md)). Senders take a Profile (or the three fields), not a pre-resolved string.
3. On `null`: skip the send and write a `notification_log` row with `reason='shadow_no_invite_email'` (live per [Phase 0](./00-phase-0-restore-truth.md)). Surface the count on the teacher/admin dashboard ("N lessons couldn't notify the student").
4. Defense-in-depth: cron queries pre-filter `is_shadow = false OR invite_email IS NOT NULL` (ADR-0002 §3, option E1).

**Done when.** No email is ever addressed to `shadow_*@placeholder.com`; a unit test asserts it; an un-invited shadow produces a `notification_log` skip row, not a send.

### 6.3 — Calendar reconciliation on link `½ day`

**Current state.** Not implemented. The link endpoint `app/api/admin/link-shadow-user/route.ts` transfers FK references and returns counts but does **not** log `shadow_link_completed` and does **not** enqueue any calendar task. The `handle_new_user` trigger links on signup but likewise enqueues nothing. No `reconcile_calendar_for_student` task type or handler exists anywhere in `lib`/`app`/`supabase`.

**Steps.**

1. On a successful link (both the trigger path and `POST /api/admin/link-shadow-user`), log `shadow_link_completed` with `metadata.transfer_counts` (the JSONB the function already returns); on failure log `shadow_link_failed` with the error.
2. Enqueue a `reconcile_calendar_for_student(studentId)` task on `notification_queue` (ADR-0002 §4).
3. Add a queue handler: for each future event carrying a `google_event_id` for that student, call `updateGoogleCalendarEvent` to swap the attendee to the now-resolvable real email. Per-event retry with backoff; dead-letter to `notification_log` (`reason='reconcile_failed'`) after N retries.

**Done when.** After a link, future calendar events for that student carry the real attendee email; the link itself stays atomic (reconciliation is async + retryable).

### 6.4 — MFA — REMOVE `½ day` _(D-06)_

**Current state.** The dead-end is live. `signIn` (`app/auth/actions.ts:94`) returns `{ success: true, mfaRequired: true, factorId }` when the user has a verified factor; `app/(auth)/sign-in/page.tsx:97` reads it and opens `MFAChallengeDialog`. Enrollment/challenge/verify actions (`app/actions/mfa.ts`) and `components/auth/MFAChallengeDialog.tsx` / `components/profile/MFASetup.tsx` exist. No customer uses it at ~20–30 DAU; it strands anyone who somehow has a factor.

**Steps.**

1. Delete the `mfaRequired`/`factorId` branch from `signIn` (`app/auth/actions.ts:94-103`) — sign-in returns `{ success: true }` only.
2. Remove the `mfaRequired` branch and `MFAChallengeDialog` mount from `app/(auth)/sign-in/page.tsx` (drop the `mfaRequired`/`mfaFactorId` state).
3. Delete now-dead files: `app/actions/mfa.ts`, `components/auth/MFAChallengeDialog.tsx`, `components/profile/MFASetup.tsx`, and their tests. `tsc --noEmit` to catch orphan imports.

**Done when.** Sign-in is single-step for every account; no MFA code path remains; the suite is green after deletion.

### 6.5 — Google sign-in — IMPLEMENT (verify + harden) `½ day` _(D-07)_

**Current state.** Largely already built — this diverges from MASTER_SPEC §2.6.5, which frames it as net-new (see note at end). `handleGoogleSignIn` (`app/(auth)/sign-in/page.tsx:109`) calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '${origin}/auth/callback' } })`; `signInWithOAuth` also appears in `components/auth/SignInForm.tsx` and `components/auth/useSignUpLogic.ts`. The dedicated callback `app/auth/callback/route.ts` exchanges the code, updates last-sign-in, logs `email_confirmed`, and routes to `/onboarding` when no role flag is set — **distinct** from the integrations callback `app/api/oauth2/callback/route.ts` (calendar tokens, untouched).

**Steps.**

1. Verify the separation holds (login callback `/auth/callback` ≠ integrations `/api/oauth2/callback`); document it so neither is "fixed" into the other.
2. Harden the shadow collision: when a Google user signs in whose email matches an existing shadow Profile, the claim must run (via `handle_new_user` `invite_email`/`email` match → `transfer_shadow_profile_references()`), not create a second Profile. Add the test in 6.x acceptance.
3. Consolidate the three `signInWithOAuth` call sites onto one helper if they drift; ensure all use `/auth/callback`.

**Done when.** A new user signs in with Google and lands on the dashboard; a Google user whose email matches a shadow claims it (one Profile, references transferred); the integrations Google flow is unaffected.

### 6.6 — Admin lockout visibility `½ day`

**Current state.** Enforcement exists; visibility does not. `lib/auth/account-lockout.ts` reads/writes `profiles.locked_until` + `failed_login_attempts` (`MAX_FAILED_ATTEMPTS=5`, 30-min lock) and `signIn` consults it. There is **no** admin widget listing locked accounts and **no** unlock action.

**Steps.**

1. Add an admin server action `getLockedAccounts()` → Profiles where `locked_until > now()` (admin-guarded).
2. Add `unlockAccount(profileId)` → set `failed_login_attempts = 0`, `locked_until = null` (reuse `resetFailedAttempts`'s update but key by id; admin-guarded). Both counters clear together.
3. Add an admin widget (editorial) listing locked accounts with an Unlock button.

**Done when.** An admin sees locked accounts and unlocking one clears both counters and restores sign-in.

### 6.7 — Stale-shadow cleanup cron `½ day` _(optional, ADR-0002 §9)_

**Current state.** Not implemented. No `archive-stale-shadows` cron exists.

**Steps.**

1. Add a daily cron `app/api/cron/archive-stale-shadows` (guarded by `verifyCronSecret`; register in `vercel.json` only after [Phase 0](./00-phase-0-restore-truth.md) cron re-enable).
2. Set `student_status='inactive'` where `is_shadow = true AND invite_email IS NULL AND (last_lesson_scheduled_at IS NULL OR last_lesson_scheduled_at < now() - interval '90 days')`.
3. The picker default excludes `inactive` with an "Include inactive" override. Hard-delete stays manual (FK on `lessons.student_id` is strict).

**Done when.** Shadows with no `invite_email` and no lesson in 90 days are archived (not deleted) and drop out of the default picker.

## Data contract

| Surface           | Route / symbol                                                                                                                                            | Payload                                                                                          | RLS / guard                                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Set invite email  | `PATCH /api/users`                                                                                                                                        | `{ userId: uuid, inviteEmail: string }` → `200` Profile, `400` non-shadow, `409` email collision | admin/teacher (`getUserWithRolesSSR`); `invite_email` unique partial index (ADR-0002 §5) |
| Send invite       | extend PATCH or new action → `auth.admin.inviteUserByEmail(invite_email, { redirectTo: '/accept-invitation' })`                                           | n/a (admin client)                                                                               | admin/teacher; logs `shadow_invite_sent`                                                 |
| Deliverable email | `getDeliverableEmail(p)` in `lib/email/recipient.ts`                                                                                                      | `{ is_shadow, email, invite_email }` → `string \| null`                                          | pure; null ⇒ skip + `notification_log{reason:'shadow_no_invite_email'}`                  |
| Link shadow       | `POST /api/admin/link-shadow-user`                                                                                                                        | `{ shadowProfileId, realUserId }` → `200 { profile, transferred }`                               | admin/teacher (`withApiAuth`); logs `shadow_link_completed`; enqueues reconcile          |
| Google sign-in    | `supabase.auth.signInWithOAuth({ provider:'google', options:{ redirectTo:'/auth/callback' } })` → `app/auth/callback/route.ts` (`exchangeCodeForSession`) | n/a                                                                                              | session cookie; callback distinct from `/api/oauth2/callback`                            |
| Lockout admin     | `getLockedAccounts()` / `unlockAccount(profileId)` server actions                                                                                         | id → clears `failed_login_attempts`, `locked_until`                                              | admin-only; `profiles.rls` (admin visibility)                                            |

**Audit events** (`auth_events` via `lib/auth/auth-event-logger.ts`): add `shadow_invite_email_set`, `shadow_invite_sent`, `shadow_link_completed` (metadata `transfer_counts`), `shadow_link_failed` to the `AuthEventType` union and DB enum (ADR-0002 §8). `shadow_user_created` already exists.

## Behavior & edge cases / failure modes

- **Invite to an already-real email.** PATCH's `email.eq.X OR invite_email.eq.X` check returns 409 before any write — no overwrite, no second invite.
- **Invite email already set to a different address.** Surface an error in the dialog; never silently overwrite (ADR-0002 §2).
- **Null deliverable.** `getDeliverableEmail` returns `null` for an un-invited shadow (or a `placeholder.com` email) ⇒ the send is skipped and a `skipped_shadow`/`shadow_no_invite_email` row lands in `notification_log`; the count surfaces on the dashboard. Never a bounce.
- **OAuth user collides with an existing shadow.** Google sign-in for an email matching a shadow must claim it through `handle_new_user` (`invite_email`/`email` match) → `transfer_shadow_profile_references()`; result is one Profile, references transferred — not a duplicate.
- **Unlock clears both counters.** `unlockAccount` sets `failed_login_attempts = 0` **and** `locked_until = null` atomically; a stale `locked_until` alone must not re-lock.
- **Reconcile partial failure.** Calendar reconciliation is async + per-event retried; one Google API hiccup dead-letters that event (`reason='reconcile_failed'`) without rolling back the link (ADR-0002 §4, option C1 rejected).
- **Duplicate shadows pre-index.** Backfill (`scripts/backfill/2026-05-shadow-dedup.ts`) consolidates collision groups via `transfer_shadow_profile_references()` **before** the unique `invite_email` index ships (migration order is not optional — ADR-0002 §5).

## Files to touch

- `lib/email/recipient.ts` — **new** `getDeliverableEmail` (reuse `lib/auth/shadow-email.ts`).
- `lib/email/send-lesson-email.ts`, `lib/email/send-reminder-email.ts` — route through the chokepoint (take Profile/fields, not raw `studentEmail`).
- `app/api/users/route.ts` (PATCH) — send the invite + log `shadow_invite_email_set` / `shadow_invite_sent`.
- `app/dashboard/actions.ts` — drop the `is_shadow` rejection for the invite path; consolidate with the new send.
- `app/auth/actions.ts` (`signIn`) — remove the MFA branch.
- `app/(auth)/sign-in/page.tsx` — remove MFA branch/dialog; keep `handleGoogleSignIn`.
- `app/api/admin/link-shadow-user/route.ts` + `app/api/admin/link-shadow-user/transfer-shadow-references.ts` — log `shadow_link_completed`/`shadow_link_failed`, enqueue reconcile.
- `lib/auth/auth-event-logger.ts` — add the three shadow event types.
- `lib/auth/account-lockout.ts` + new admin action/widget — `getLockedAccounts`/`unlockAccount`.
- `supabase/migrations/*` — `auth_events` enum `ADD VALUE` (×3); confirm unique partial index on `invite_email`; new `notification_queue` reconcile handler/migration; `archive-stale-shadows` cron route.
- **Delete** (6.4): `app/actions/mfa.ts`, `components/auth/MFAChallengeDialog.tsx`, `components/profile/MFASetup.tsx` + tests.
- `__tests__/database/shadow-user-linking.test.ts` — un-skip + extend (see acceptance).

## Acceptance criteria (test names)

- `shadow-invite.flow.test` (integration) — invite → signup → references migrate (lessons/assignments/repertoire) → shadow Profile deleted → events reconciled; `shadow_invite_sent` + `shadow_link_completed` logged.
- `deliverable-email.test` (unit) — shadow with no `invite_email` returns `null` and never receives mail; a `shadow_no_invite_email`/`skipped_shadow` `notification_log` row is written; real user resolves to `email`; placeholder `email` resolves to `null`.
- `google-signin.test` — OAuth sign-in lands authenticated via `/auth/callback`; a Google email matching a shadow claims it (one Profile); the integrations callback `/api/oauth2/callback` is untouched.
- `shadow-merge.db.test` — un-skip the existing `describe.skip` in `__tests__/database/shadow-user-linking.test.ts`; assert `transfer_shadow_profile_references()` row counts for lessons/assignments/repertoire and shadow deletion.

## Definition of Done

1. **Behavior** — invite (set+send), shadow claim, Google sign-in, and admin lockout/unlock all work end-to-end; the MFA dead-end is gone.
2. **No silent failure** — every student-bound send passes through `getDeliverableEmail`; nulls log a `notification_log` skip; no mail to `placeholder.com`.
3. **RLS-tested** — `profiles.rls.test` (admin sees lockouts; self-only update) plus the shadow-transfer DB test pass against a real Supabase.
4. **Editorial** — the auth/onboarding and admin-lockout surfaces mount `components/<domain>/editorial/*`; no `ui-version` cookie branch.
5. **Old trees deleted** — extra `components/v2/onboarding/*` variants and v1 auth forms removed once one survives; MFA components deleted; `tsc --noEmit` clean.

## Dependencies & out of scope

**Depends on.** [Phase 0](./00-phase-0-restore-truth.md) — `notification_log` (skip rows) and `notification_queue` (reconcile task) must exist; the `auth_events` table must be live (see divergence below). [08-notifications](./08-notifications.md) — queue processor routes through the chokepoint. Feeds [04-users](./04-users.md) (Invite button), [02-lessons](./02-lessons.md), [07-calendar](./07-calendar.md) (attendee resolution).

**Out of scope** (ADR-0002): parent → shadow-child interactions (`parent_id` already supports it); shadow-row RLS changes (`profiles_select_teacher = is_teacher()`, scoped under ADR-0001); AI agents producing shadow-specific output (they route their drafts through the chokepoint, no behavior change); teacher-proxy `practice_sessions`/`self_rating` writes (deliberately rejected, ADR-0002 §7/W1); auto-delete of archived shadows (manual hard-delete only, CL1).

---

**Divergences from MASTER_SPEC §2.6 (flag, do not re-litigate):**

1. **§2.6.5 Google sign-in is already implemented**, not net-new. `app/auth/callback/route.ts` and `handleGoogleSignIn` exist and the login callback is already distinct from `/api/oauth2/callback`. This spec reframes 6.5 as **verify + harden (shadow collision)** rather than "implement from scratch." D-07's intent (separate callback) is already satisfied.
2. **`auth_events` table — RESOLVED 2026-06-16: kept (restored).** ADR-0002 §8 and `lib/auth/auth-event-logger.ts` write the shadow lifecycle to `auth_events`; it was reclassified from bucket C (delete) → **bucket A (restore)** in Phase 0 §0.1. This cluster's three new `auth_events` enum values (§ Audit events) are safe to add. No blocker for 6.1/6.3.
