---
status: accepted
---

# Shadow students are first-class in the lesson system, with explicit visibility and an enforced dedup chokepoint

**Date**: 2026-05-17
**Author**: Claude (synthesized from a grilling session with Piotr)
**Scope**: How shadow profiles (`profiles.is_shadow=true`, `user_id=null`) interact with the lesson lifecycle — picker, calendar sync, notifications, invite, link, audit, cleanup
**Supersedes**: parts of `docs/2026-05-17-REQUIREMENTS.md` §2.1, §4.2, §7 — those sections will be updated to reference this ADR

## Context

The `pending_students` table was dropped in April 2026 and replaced by shadow profiles on `profiles`. Shadows are created automatically from Google Calendar attendees during lesson import, manually via the admin user form, and inline from the calendar events list. They live alongside real users in `profiles` and serve as `lessons.student_id` targets so a teacher can schedule and record lessons before a student has signed up.

The existing implementation works at the data layer but leaves several gaps at the UX and operational layer:

1. **The shadow state is invisible** to the teacher in lesson UIs — a lesson row with a shadow student looks identical to one with a claimed student.
2. **Every outbound email feature** (`lesson-reminders`, `assignment-due-reminders`, `post-lesson-summary`, AI email draft, `weekly-digest`) reads `profile.email` and silently sends to the `shadow_<uuid>@placeholder.com` placeholder. The reminders bounce or hit a dead address.
3. **Google Calendar events** for lessons created in-app pull `profile.email` for the attendee, so the calendar event invites the placeholder address. Once linked, the event remains stuck on the placeholder forever.
4. **There is no end-to-end "invite" flow for a shadow.** `sendInvite()` explicitly rejects shadows; `PATCH /api/users` can set `invite_email` but doesn't email anyone; the teacher has to coordinate signup out-of-band.
5. **Duplicate shadows are possible.** `profiles.email` is UNIQUE but `invite_email` is not. Two teachers can both calendar-import the same student and end up with two shadows whose `invite_email` points to the same real address. On signup, `handle_new_user` `LIMIT 1`s the priority match — the other shadows become orphans with FKs intact, splitting the student's lesson history.
6. **Shadows accumulate forever.** No archive policy; the picker drifts toward noise.
7. **The shadow lifecycle isn't queryable** as a coherent story — events are scattered across `auth_events.shadow_user_created`, generic `audit_log` deltas on `profiles`, and `log.info` calls that go to Vercel logs only.

## Decision

Shadow students are first-class participants in the lesson system. Their state is explicitly visible in the UI, all student-bound outputs flow through a single email-resolution helper, dedup is enforced structurally at the DB level, and the lifecycle is logged to `auth_events` as named events.

### 1. Visibility — shadow state is always shown

Anywhere a student name renders (lesson list rows, lesson detail header, student picker, student detail, admin user list), a shadow profile shows an "Unclaimed" badge alongside the name. The lesson detail page additionally shows a banner with an **Invite** affordance.

### 2. Invite flow — two-step set-and-send

The **Invite** affordance opens a small dialog that:

1. Collects the real email address from the teacher.
2. Calls `PATCH /api/users` to write `invite_email` on the shadow profile.
3. Immediately calls `supabase.auth.admin.inviteUserByEmail(invite_email, { redirectTo: '/accept-invitation' })`.

The existing `handle_new_user` trigger handles the link on signup via `transfer_shadow_profile_references()`. If `invite_email` is already set to a different address, the dialog surfaces an error rather than silently overwriting.

### 3. Email resolution — one chokepoint plus a cron pre-filter

A new helper `getDeliverableEmail(profile)` lives at `lib/email/recipient.ts`:

```ts
export function getDeliverableEmail(p: {
  is_shadow: boolean;
  email: string;
  invite_email: string | null;
}): string | null {
  return p.is_shadow ? p.invite_email : p.email;
}
```

Every code path that sends to a student routes through it. When it returns `null`, the call is skipped and a `notification_log` row is written with `reason='shadow_no_invite_email'`. The teacher/admin dashboard surfaces the count ("3 lessons couldn't notify the student").

Defense-in-depth: cron job queries pre-filter with `is_shadow = false OR invite_email IS NOT NULL`. Two layers; if a future feature forgets the resolver, the cron filter still prevents the bogus enqueue.

### 4. Calendar attendee resolution

**At lesson-create time:** if `getDeliverableEmail(student)` returns `null`, the Google Calendar event is created with no attendee — the teacher's own calendar still has the event. If it returns an address, that address becomes the attendee. The placeholder `shadow_<uuid>@placeholder.com` is never sent to Google.

**At shadow → real link time:** the link path (both the `handle_new_user` trigger and `POST /api/admin/link-shadow-user`) enqueues a `reconcile_calendar_for_student(studentId)` task on the existing `notification_queue`. A cron drains the queue and for each `google_event_id` belonging to that student, calls `updateGoogleCalendarEvent` to swap the attendee. The link itself stays atomic; reconciliation is asynchronous and retryable.

**The matcher learns about invite_email.** `lib/services/import-utils.ts::matchStudentByEmail` is extended to match `email = X OR invite_email = X`. Match priority: real profile with `email=X` > shadow profile with `email=X` (edge case) > shadow profile with `invite_email=X`. This is what makes the round-trip safe — a calendar event we previously created with `invite_email` as attendee will resolve back to the right shadow on re-import.

### 5. Dedup — structural, not policy

A new migration adds a unique partial index:

```sql
CREATE UNIQUE INDEX uq_profiles_invite_email
  ON profiles(invite_email)
  WHERE invite_email IS NOT NULL;
```

All "create shadow" callers route through the (extended) `matchStudentByEmail`. If a profile already exists for the email (as either `email` or `invite_email`), the caller reuses it; only a true no-match creates a new shadow. The unique index makes the orphan class a hard DB error you can't accidentally cause.

**Backfill happens before the index ships.** A one-off script finds collision groups (real profile + N shadows pointing at the same real address) and runs the existing `transfer_shadow_profile_references()` against each group, consolidating onto the canonical profile (real if present; otherwise the oldest by `created_at`). The script runs with `validateOnly=true` first on prod data to eyeball the diff.

### 6. Picker — inline with badge, inline-create, non-blocking warning

The lesson create form's student picker (`LessonForm.ProfileSelect`) becomes a Combobox:

- Real and shadow students interleaved, alphabetical, each row shows a name plus an "Unclaimed" badge if shadow.
- If the typed query looks like an email and matches no profile, the last option is **"Create shadow for `<email>`"** — routed through the dedup chokepoint, so it reuses an existing match if any.
- Selecting a shadow without `invite_email` shows a non-blocking inline warning under the field: "Emma has no contact email yet — calendar events and reminders won't include her until you invite her."

### 7. Student-side writes — accept the gap

`practice_sessions` and `self_rating` mutations stay bound to `auth.uid()`. We do **not** add teacher-proxy variants. Shadow students have empty practice and rating data until claim; this is correct, not a bug. The `lesson_songs.lesson_song_status` enum and proxy-writable `student_repertoire` already capture everything the teacher needs to record about a shadow during the pre-claim window.

`docs/2026-05-17-REQUIREMENTS.md` §7.5 is updated to spell this out.

### 8. Audit — named events on `auth_events`

The `auth_events.event_type` enum is extended with:

- `shadow_invite_email_set` — `PATCH /api/users` set `invite_email` on a shadow.
- `shadow_invite_sent` — `inviteUserByEmail` succeeded.
- `shadow_link_completed` — shadow → real transfer succeeded. Metadata: `transfer_counts` JSONB (from `transfer_shadow_profile_references` return value).
- `shadow_link_failed` — transfer attempted and failed. Metadata: error.

Both the trigger (`handle_new_user`) and the admin endpoint (`POST /api/admin/link-shadow-user`) write these. `shadow_user_created` stays as it is.

We do **not** add a dedicated `shadow_lifecycle` table — `auth_events` already carries the categorization framework and feeds notification analytics; an extra table is premature.

### 9. Cleanup — soft archive at 90 days

A new daily cron, `archive-stale-shadows`, sets `student_status='inactive'` on any profile where:

```
is_shadow = true
AND invite_email IS NULL
AND (last_lesson_scheduled_at IS NULL OR last_lesson_scheduled_at < now() - interval '90 days')
```

The picker default filter excludes `inactive`; the teacher can override per-picker with an "Include inactive" toggle. Hard-delete remains manual via the admin UI — `lessons.student_id` FK stays strict, so an admin must reassign or soft-delete the lessons first.

## Considered Options

### V1. Quarantine shadow lessons into a separate UI section

Rejected. Adds a parallel UI without much payoff — 80% of lesson actions (notes, songs, status, scheduling) are unaffected by claim status. Visible-state-with-affordance is enough.

### V2. Hide shadow state in the UI entirely ("invisible plumbing")

Rejected. The bug surface is exactly this — invisible-but-broken outputs (bouncing reminders, undeliverable calendar invites, AI email drafts to placeholders). Hiding the state means the teacher has no signal that things are wrong.

### I1. Skip writing `invite_email`; create the auth user directly

Rejected. `supabase.auth.admin.createUser` creates an auth.users row the student didn't ask for and ships them a "set your password" email cold. Worse opt-in semantics and worse deliverability than the canonical invite flow.

### E1. Resolver only, no cron pre-filter

Rejected as the sole mechanism. A single chokepoint is correct but fragile — one cron that forgets to use the helper will quietly fill the queue with already-doomed entries. Two layers cost almost nothing.

### E2. Backfill stale reminders after a late invite

Rejected. Holding reminders in `notification_queue` until invite_email arrives means the student receives 14-day-old "your lesson tomorrow" emails after they finally sign up. Worse than the alternative of just not having a reminder for that lesson.

### C1. Sweep & reconcile calendar events inline at link time

Rejected for the main link path. One Google API hiccup mid-loop leaves a partially-updated set; needs retry; needs audit; adds latency to a signup-trigger that should be fast. Async queue is the right shape.

### C2. Forward-only — don't reconcile past calendar events

Rejected. Students who claim a profile after attending several lessons should see those lessons on their calendar going forward. The reconcile cost is one queue drain per signup, paid asynchronously.

### D1. Soft warn at the import preview, but still create

Rejected. We have orphan shadows in prod today precisely because every caller decides for itself. A warning that the teacher can dismiss leaves the orphan class alive. Structural prevention is cheap.

### D2. Hard block + force-link without DB constraint

Rejected. UI-only enforcement leaks under concurrency (two parallel imports race past the check). The unique index is a few lines of SQL and ends the question.

### P1. Sectioned picker, "Active" above "Unclaimed"

Rejected. Combobox controls don't section cleanly; the visual chrome adds cost without solving a real "accidental pick" problem, since shadows usually have distinct calendar-derived names.

### W1. Add teacher-proxy variants for practice/self-rating

Rejected. Self-rating semantically means "the student's own opinion"; proxy breaks the semantic and risks teachers dumping impressions ("rate her a 3, she struggled") that the student then has to fight on claim. The teacher already has `lesson_songs.lesson_song_status` for their assessment.

### A1. Dedicated `shadow_lifecycle` table

Rejected as premature. `auth_events` already has the framework; you'll query the lifecycle once a quarter when debugging, not constantly. Build the table only when there's a clear cohort-analysis need that `auth_events` can't serve.

### CL1. Auto-archive plus auto-delete after another N days

Rejected. The marginal benefit (a cleaner profile table) does not justify the risk of deleting lessons a teacher still wants to remember teaching. Manual hard-delete is fine.

## Consequences

- **The shadow lifecycle becomes explicit** — there is no longer a class of "silently broken" shadow lessons. Every place we'd act on a shadow either succeeds, surfaces a warning, or skips with a logged reason.
- **`getDeliverableEmail` is now a load-bearing helper.** Any new code path that sends to a student MUST use it. CI / review checklist should call this out. Plain `profile.email` access from a notification or AI-draft context should be a code-review red flag.
- **`matchStudentByEmail` returns either type of profile.** Callers must already be type-agnostic (current `import-lessons.ts` is). New callers should be reviewed for the same property.
- **Migration order is not optional.** Backfill (validateOnly) → backfill (real) → unique index → service-layer chokepoint. Shipping the chokepoint before the index is a race; shipping the index before the backfill is a migration failure.
- **`notification_queue` gains a new task type (`reconcile_calendar_for_student`).** The drain cron must learn how to dispatch it. Failure handling: per-event retry with backoff; after N retries, dead-letter to `notification_log` with `reason='reconcile_failed'`.
- **The teacher dashboard shows new signals**: shadow count, stale-shadow count, "couldn't notify N students" count. None of these are blocking; all are advisory.
- **`auth_events` enum grows by 4 values** — needs a migration with `ALTER TYPE ... ADD VALUE`, which in Postgres requires either `IF NOT EXISTS` (16+) or careful staging.
- **The 90-day archive threshold is policy, not architecture.** Tunable via admin settings. Start at 90; adjust based on observed teacher behaviour. Do not bake the value into code constants — read from `user_settings` or a small `app_settings` table if one exists, else default.
- **Reviewers should not "fix" the absence of teacher-proxy practice/self-rating writes by adding them back.** That direction has been considered and rejected for the reasons in W1.

## Out of scope

- Parent → shadow-child interactions. The `is_child_of_parent(uuid)` SQL helper and `parent_id` column already support this; nothing in this ADR changes that.
- RLS policies for shadow rows. `profiles_select_teacher` is already `is_teacher()` — any teacher can read any profile. That is the current security posture, separately scoped under ADR 0001 (RLS is the security boundary).
- AI agents producing different output for shadows. Out of scope; the agents read whatever data is present, and the email-draft agent now routes its result through `getDeliverableEmail`.
- The dashboard rebuild ordering (`docs/2026-05-17-IMPLEMENTATION_PLAN.md`). This ADR informs DASH-007 through DASH-013 but doesn't reorder them.
