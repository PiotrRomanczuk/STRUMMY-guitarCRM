---
created: 2026-06-09
updated: 2026-06-09
---

# Editorial Implementation Checklist

Single source of truth for **what's left to wire to production**. One row per section, three checkboxes each:

- [ ] **mockup** — design-preview artboard merged to `main` at `/design-preview/<slug>`
- [ ] **production** — real route at `/dashboard/<route>` wired to Supabase
- [ ] **cleanup** — v1 (`components/<domain>/`) and v2 (`components/v2/<domain>/`) deleted

When all three are checked, the section is done.

For per-section data sources, mutations, and v1/v2 deletion targets, see [production-plan.md](./production-plan.md). Workflow conventions and prototype source paths live in [README.md](./README.md).

---

## Tier 1 — domain core

### song-detail

- [x] mockup — #431
- [x] production — #433 at `/dashboard/songs/[id]` + #434 polish
- [ ] cleanup — delete `components/songs/details/` (~1900 LOC) + `components/v2/songs/SongDetailPage.tsx`

### assignments

- [x] mockup — #432
- [x] production — `/dashboard/assignments` editorial list shipped (PR #441). `/dashboard/assignments/[id]` detail + mutations (create/submit/review) deferred.
- [ ] cleanup — `components/assignments/`, `components/v2/assignments/`

### lessons

- [ ] mockup — partial scaffolds uncommitted on `main` (1173 LOC).
- [x] production — `/dashboard/lessons` list (PR #436) + `/dashboard/lessons/[id]` detail (PR #442) shipped. Filtering chips + notes mutation deferred.
- [ ] cleanup — `components/lessons/`, `components/v2/lessons/`

### student-detail

- [ ] mockup — scaffold-only files uncommitted on `main` (786 LOC stubs).
- [x] production — `/dashboard/users/[id]` editorial detail shipped (PR #438). Hero + repertoire + recent lessons. Tabs / practice log / achievements deferred.
- [ ] cleanup — `components/users/`, `components/students/`, `components/v2/users/`

## Tier 2 — first-time + cross-cutting flows

### onboarding

- [x] mockup — #430
- [ ] production — `/onboarding`. Needs `profiles`, `user_preferences`, `user_settings`. Mutations: save studio info / set goals + level.
- [ ] cleanup — `components/onboarding/`, `components/v2/onboarding/`, `components/v2/stitch/onboarding/`

### auth

- [x] mockup — #429
- [ ] production — `/sign-in`, `/sign-up`, `/forgot-password`, `/accept-invitation`. Auth wiring already exists; this is visual polish on top of the working flows.
- [ ] cleanup — `components/auth/` (audit carefully — auth logic lives there too)

### dashboards (student / teacher / admin)

- [x] mockup — #428
- [x] production — all 3 role views shipped: teacher (PR #435, greeting + day-spine), student (PR #445, greeting + next lesson + songs), admin (PR #446, platform pulse + pending invites). Placeholder card backfills still pending.
- [ ] cleanup — `components/dashboard/`, `components/v2/dashboard/`

## Tier 3 — secondary views

### settings

- [ ] mockup — not started
- [x] production — `/dashboard/settings` editorial hub shipped (PR #439). Profile (email read-only, name editable via Server Action) + notifications link. Theme / locale / password change deferred.
- [ ] cleanup — `components/settings/`, `components/v2/settings/`

### notifications

- [ ] mockup — not started
- [x] production — `/dashboard/notifications` editorial inbox shipped (PR #440). `in_app_notifications` table, mark-all-read Server Action. Per-row dismiss / archive / filters deferred.
- [ ] cleanup — `components/notifications/`, `components/v2/notifications/`

### song-form

- [ ] mockup — not started
- [x] production — `/dashboard/songs/new` create form (PR #437) + `/dashboard/songs/[id]/edit` update form (PR #443) shipped. Cover/audio/lyrics editing deferred.
- [ ] cleanup — `components/songs/form/`

### fretboard

- [ ] mockup — not started
- [x] production — `/dashboard/fretboard` 12-fret reference shipped (PR #444). Interactive scale overlays + chord shapes deferred.
- [ ] cleanup — `components/fretboard/`, `components/v2/fretboard/`

## Tier 4 — new surfaces (no current route)

### parent

- [ ] mockup — not started
- [ ] production — new `/parent` or `/dashboard/parent`. Needs `profiles`, `student_repertoire`, `lessons`, `practice_sessions` + a new RLS policy for the parent role (which doesn't exist yet — separate STRUM ticket).
- [ ] cleanup — N/A (new surface)

### tablet

- [ ] mockup — not started
- [ ] production — new `/tablet` route or `?layout=tablet` flag on lesson detail. Reuses lesson-detail data. Defer until lessons (Tier 1) ships.
- [ ] cleanup — N/A (new surface)

### landing

- [ ] mockup — not started here; in-flight on `feature/STRUM-landing-cinematic` (commit 21abac9b, no PR yet)
- [ ] production — `/` (homepage). Already wired separately; not coupled to this migration.
- [ ] cleanup — `components/landing/` (carefully — sub-folders may overlap with new editorial landing)

## Reference-only (no production target)

### states

- Empty + loading state patterns. Adopted into each section's own empty/skeleton implementation as that section ships. **No production migration line for this section.**

---

## Recommended next step

**assignments** — Tier 1, biggest user value (teachers use it daily), proves the role-based variant pattern, and unblocks lessons (Tier 1) which depends on the same `lesson_songs` reshape.

After assignments lands, the order in `production-plan.md` is:
**lessons → dashboards → student-detail → onboarding/auth → settings/notifications → song-form → fretboard/landing/tablet/parent.**
