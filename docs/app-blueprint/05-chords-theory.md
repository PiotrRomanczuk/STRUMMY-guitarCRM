---
created: 2026-07-18
updated: 2026-07-18
domain: Chords, Theory & Fretboard
tables:
  [
    chord_quiz_attempts,
    chord_srs,
    theoretical_courses,
    theoretical_lessons,
    theoretical_course_access,
  ]
maturity: mixed
---

# Chords, Theory & Fretboard

## Purpose

Three self-service learning tools orbiting the core loop, all currently hidden from navigation:

1. **Chord quiz + SRS** — students identify chord diagrams; every answer feeds an SM-2 spaced
   repetition schedule per chord, so weak chords come back sooner.
2. **Theory LMS** — a mini course platform (courses → ordered lessons, publish flags, explicit
   per-student access grants) authored by the teacher.
3. **Fretboard explorer** — a pure client-side chord/scale visualizer with **no tables** (no
   persistence by design; documented here because it shares the domain).

## Data model

DDL: `supabase/baseline/cloud_schema_2026-06-22.sql`. `chord_srs` added by migration
`20260619200001_chord_srs.sql`.

| Table                       | Role                                                                                                                                                                                    |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chord_quiz_attempts`       | Append-only answer log: `student_id`, `chord_id` (text key into the static `CHORD_SHAPES` library — **not** a DB FK), `selected_answer`, `is_correct`, optional `response_time_ms`.     |
| `chord_srs`                 | One row per (student, chord): SM-2 state — `repetitions`, `interval_days` (real), `ease_factor` (default 2.5), `next_review_at`, `last_reviewed_at`. "Due" ≡ `next_review_at <= now()`. |
| `theoretical_courses`       | Course shell: title/description/cover, `level`, `created_by`, `is_published` + `published_at`, `sort_order`, soft delete `deleted_at`.                                                  |
| `theoretical_lessons`       | Ordered content pages per course: `content` text (markdown-ish), `excerpt`, own `is_published`, `sort_order`, soft delete.                                                              |
| `theoretical_course_access` | Explicit grant: (course_id, user_id, granted_by, granted_at). A student sees a course only if **published AND granted**.                                                                |

## Behavior & rules

### Chord quiz session

`components/skills/ChordQuiz/` (`useChordQuiz`, question/results subcomponents,
`ChordDiagram`) runs a client-side session over the static chord-shape library, then submits the
whole session in one round-trip: `submitChordQuizSession` (`app/actions/chord-quiz.ts`) validates
via `ChordQuizSessionSchema`, inserts the attempt batch (student_id always from the session,
never the payload), and calls `updateChordSRSBatch`.

### SM-2 scheduling (`lib/music-theory/srs.ts`)

Simplified binary-quality SM-2: **incorrect** → repetitions reset to 0, interval 1 day, ease
−0.2 (floor 1.3); **correct** → interval 1 day, then 6, then `round(interval × ease)`;
repetitions +1, ease unchanged. New chords start due immediately (`newSRSCard`). Time is injected
(`nowMs`) for testability. `app/actions/chord-srs.ts` exposes `getChordsDueCount`,
`getDueChordIds` (≤30, soonest-due first), and the batch upsert.

### Review mode

The quiz page offers a **review toggle** when the student has due chords: review mode limits the
question set to the due chords (E2E C1.3–C1.5). There is no separate review surface, no due-count
nudge anywhere outside the quiz page itself (CHT-1).

### Theory LMS

`app/dashboard/theory/actions.ts` carries the full CRUD: courses and lessons
(create/update/delete with publish flags and sort order), plus `get/grant/revokeCourseAccess`.
Authoring components live in `components/theory/` (course form, lesson form, access manager,
chapter reader).

### Access (RLS)

- `chord_quiz_attempts` / `chord_srs`: students insert/read/update own rows; staff read all
  (`Staff read all SRS state`, staff attempts select). No delete policies — history is
  append-only.
- `theoretical_courses`: staff see all non-deleted (`tc_select_admin`/`tc_select_teacher`);
  students only `is_published AND deleted_at IS NULL AND` an access-grant row exists
  (`tc_select_student`). Insert staff-only; update/delete creator-or-admin. Lessons and access
  rows follow the same pattern (`tl_*`, `tca_*` — students read own grants).

### Fretboard

`components/fretboard/editorial/` (`useFretboardExplorer`, board/controls/info panel) — chord and
scale selection, transposition, all client-side. No writes, no reads, no RLS involvement.

## UI surfaces

| Surface                                                                           | Route                                                                             | State                                                                                                            |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Chord quiz (with SRS review toggle)                                               | `/dashboard/skills/chord-quiz` → `components/skills/ChordQuiz/`                   | routed + working, but **no nav link** (parent "Skills" item is nav-hidden and the hub page is a stub) — URL-only |
| Skills hub                                                                        | `/dashboard/skills`                                                               | **stub** ("Coming soon"); `skills` in `CORE_LOOP_HIDDEN_ITEMS`                                                   |
| Theory: course list, course detail, lesson reader, new/edit forms, access manager | `/dashboard/theory`, `/[courseId]`, `/[courseId]/[lessonId]`, `new`/`edit` routes | **nav-hidden** (`theory` hidden for both teacher and student menus) but fully routed                             |
| Fretboard explorer                                                                | `/dashboard/fretboard` → `components/fretboard/editorial/`                        | **nav-hidden** (`fretboard` under Tools)                                                                         |

## Gaps & planned work

Scope frame (grill 2026-07-18): all items here are **v1.1 — do not build before real usage data
exists**. The only v1 gap across docs 03–05 is PRA-1 (doc 04).

### CHT-1 · Dedicated SRS review surface + due nudge (v1.1)

Concept: a "N chords due today" entry point (student dashboard card or nav badge) leading into
review mode, instead of the toggle buried on a URL-only quiz page. Schema and actions are ready
(`getChordsDueCount` exists with zero consumers outside the quiz). Open design questions: where
the nudge lives; review session cap (currently 30 via `getDueChordIds`); whether review sessions
should log `chord_quiz_attempts` distinguishably from free quizzing (no `mode` column today —
would need one if analytics ever care).

### CHT-2 · Skills hub rebuild (v1.1)

Concept: replace the `/dashboard/skills` stub with a hub linking chord quiz (and future drills),
then unhide `skills` from `CORE_LOOP_HIDDEN_ITEMS`. Pure UI; no schema. Blocked on deciding
whether skills is a student surface, a teacher monitoring surface (staff can read all attempts /
SRS state — nothing renders it), or both.

### THY-1 · Theory LMS activation (v1.1)

Concept: decide whether the theory platform joins the student surface at all. Everything is
built (CRUD, publish flags, grants, reader) but nav-hidden with no real content. Before
unhiding: author at least one real course; test the student path (published + granted) end to
end; fix discoverability (grant flow lives on the course page, easy to forget → student sees
nothing). Open design questions: content format commitment (plain text/markdown in
`theoretical_lessons.content` — no renderer contract is documented); **no completion tracking
exists** (no read/progress table — is "read" state needed, or is theory reference material?);
per-lesson vs per-course publish semantics (both flags exist — the interaction is undocumented).

## Test plan

Journey catalog: `reference/E2E_JOURNEYS.md` §B8.5 (quiz attempt logged), §A11.1 (fretboard).

- **E2E (exist)**: `tests/e2e/student/chord-quiz-srs.spec.ts` — C1.1 quiz page loads (not Coming
  Soon), C1.2 answer + advance, C1.3 no review toggle without SRS state, C1.4 toggle appears when
  chords seeded due, C1.5 review limited to due count, C1.6 admin access.
- **E2E (missing)**: theory has **zero** E2E coverage (author→publish→grant→student-reads is the
  journey to add when THY-1 activates); fretboard render journey A11.1.
- **Unit**: `lib/music-theory/srs.ts` interval/ease math (time-injected — cover reset, 1→6→round
  progression, ease floor); `components/skills/ChordQuiz/chord-quiz.helpers.unit.test.ts`
  (exists).
- **Integration/RLS**: chord tables own-row vs staff-read policies; theory student visibility
  (unpublished-but-granted and published-but-ungranted must both yield zero rows).

## Open questions

- `chord_id` is an app-level string key into `CHORD_SHAPES` with no DB referent — renaming or
  removing a shape orphans SRS rows silently. Accept (document the key as append-only) or add a
  chords reference table someday?
- Attempts and SRS state are kept forever with no retention policy — fine at studio scale;
  revisit only if the quiz sees real use.
- Should fretboard/theory/skills remain URL-reachable while nav-hidden, or be access-gated until
  their v1.1 activation? (Current stance: reachable-but-hidden is acceptable because none of them
  can corrupt core-loop data.)

## References

- DDL: `supabase/baseline/cloud_schema_2026-06-22.sql`; migration
  `20260619200001_chord_srs.sql`
- Logic: `lib/music-theory/srs.ts` ·
  Actions: `app/actions/{chord-quiz,chord-srs}.ts`, `app/dashboard/theory/actions.ts`
- UI: `components/skills/ChordQuiz/`, `components/theory/`,
  `components/fretboard/editorial/`, routes under `app/dashboard/{skills,theory,fretboard}/`
- Nav gating: `components/navigation/menuConfig.ts` (`CORE_LOOP_HIDDEN_ITEMS`)
- Related: doc 04 (practice/BPM), doc 10 (admin chord-analysis stats), `reference/E2E_JOURNEYS.md`
