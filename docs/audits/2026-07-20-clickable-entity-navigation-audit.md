# Clickable Entity Navigation Audit (Admin POV)

**Date**: 2026-07-20
**Author**: Claude
**Scope**: Every place a Student (User), Lesson, or Song is _named_ in the admin & dashboard UI — is it clickable to that record's detail page?

> Interactive version: published as a Claude artifact (color-coded coverage matrix).
> Method is read-only; **no source files were modified**.

---

## The one question

Strummy has detail routes for all three entities — `/dashboard/users/[id]`, `/dashboard/lessons/[id]`, `/dashboard/songs/[id]` (plus `/dashboard/assignments/[id]`). This audit walks the admin UI and asks, at each place one of those entities is displayed: **does the text take you to that record, or is it a dead end?**

**Verdict legend**

- ✅ **LINKED** — navigates to that record's own `/[id]` detail page.
- 🟡 **ADJACENT** — clickable, but lands on a list, a filter, or a _different_ record.
- ❌ **DEAD** — plain text, nothing happens.

Excluded from the ratios as correctly-not-links: form `<select>`/checkbox pickers, the signed-in user's own identity chrome (topbar/sidebar), aggregate count summaries, mocked data, and "coming soon" stubs.

---

## Headline

Across **46 primary references** to a Student, Lesson, or Song:

|                                            | Count  | Share |
| ------------------------------------------ | ------ | ----- |
| ✅ Linked to the record                    | **19** | 41%   |
| 🟡 Adjacent (list / filter / other record) | **11** | 24%   |
| ❌ Dead text                               | **16** | 35%   |

The core list & detail screens are solid. The gaps cluster in **notifications, the teacher's daily dashboard, repertoire/practice, and health** — the secondary surfaces an admin bounces through all day.

| Entity   | Refs | ✅  | 🟡  | ❌  |
| -------- | ---- | --- | --- | --- |
| Students | 21   | 7   | 6   | 8   |
| Lessons  | 12   | 5   | 3   | 4   |
| Songs    | 13   | 7   | 2   | 4   |

---

## Systemic findings (ranked by admin impact)

1. **The notifications inbox is inert.** `components/notifications/editorial/NotificationsEditorial.List.tsx` renders every row as a plain `<div>` and never reads the `action_url` the data already carries — so _every_ entity notification there is dead text. The bell dropdown (`NotificationBell.Item.tsx`) _does_ wrap `action_url` in a link, but the content builders (`lib/services/notification-in-app-content.ts`) point it at the list, not the specific record. **One fix lights up user + lesson + song notifications at once.**

2. **"Clickable" usually means the list, not the record.** Notifications → `/dashboard/lessons`; Health "Schedule" → `/dashboard/lessons?student=`; song-mastery → `/dashboard/songs`. The click "works" but drops the admin one level short.

3. **A real route bug in Student Health.** The desktop "View Profile" icon and the mobile card both link to `/dashboard/users?id=X` — a query param on the _list_ — instead of the `/dashboard/users/[id]` detail route (`StudentHealthTable.tsx:62,222`).

4. **List rows hijack the click.** In the lessons & assignments lists the whole row is one big `<Link>` to that row's record, so the _other_ entities named in the row (student, teacher, songs) can't be clicked individually. HTML forbids nested links — this needs a sibling link with `stopPropagation`, or a row action menu.

5. **Teacher identity is a blind spot.** Teacher names are essentially never linkable and often not even rendered (lessons list/detail don't show the teacher; student dashboard shows it as plain text).

6. **Repertoire & Practice titles are dead.** `RepertoireCard.tsx` and `PracticeHistoryList.tsx` print song titles as plain text — even though the near-identical repertoire block on student-detail _is_ linked.

7. **Mobile loses parity.** Student Health desktop links the student name; the mobile card renders it as plain text.

8. **The core screens are done right.** The three list tables, three detail pages, and the lesson↔student↔song cross-links all link correctly to `/[id]`. The foundation is sound; the work is finishing the edges.

---

## Students — every reference (7 / 21 linked)

| Location                                | File · line                         | Goes to           | Verdict |
| --------------------------------------- | ----------------------------------- | ----------------- | ------- |
| Users table row (name/avatar/email)     | `UsersListEditorial.tsx:185`        | /users/[id]       | ✅      |
| Lesson detail "with …"                  | `LessonDetailEditorial.tsx:175`     | /users/[id]       | ✅      |
| Assignment detail "for …"               | `AssignmentDetailEditorial.tsx:144` | /users/[id]       | ✅      |
| Teacher dash · Needs attention          | `BackfillCards.tsx:24`              | /users/[id]       | ✅      |
| Teacher dash · Roster                   | `BackfillCards.tsx:186`             | /users/[id]       | ✅      |
| Student Health · desktop name           | `StudentHealthTable.tsx:161`        | /users/[id]       | ✅      |
| Notification card (when action_url set) | `NotificationCenter.tsx:178`        | /users/[id]*      | ✅      |
| Lessons table · student column          | `LessonsListEditorial.tsx:299`      | /lessons/[id]     | 🟡      |
| Assignments table · student column      | `AssignmentsListEditorial.tsx:195`  | /assignments/[id] | 🟡      |
| Teacher "today" schedule · student      | `TeacherDaySpineLesson.tsx:54`      | /lessons/[id]     | 🟡      |
| Student dash · next-lesson teacher      | `StudentDashboardEditorial.tsx:158` | /lessons/[id]     | 🟡      |
| Users table · "Edit →"                  | `UsersListEditorial.tsx:263`        | /users/[id]/edit  | 🟡      |
| Student Health · "View Profile" (bug)   | `StudentHealthTable.tsx:222`        | /users?id= ⚠      | 🟡      |
| Admin · Locked accounts name            | `LockedAccountsCard.tsx:76`         | —                 | ❌      |
| Student dash · "with {teacher}"         | `StudentDashboardEditorial.tsx:115` | —                 | ❌      |
| Student Health · mobile card name       | `StudentHealthTable.tsx:62`         | —                 | ❌      |
| Admin AI · email draft summary          | `EmailDraftGenerator.tsx:280`       | —                 | ❌      |
| Admin AI · progress insights            | `StudentProgressInsights.tsx:141`   | —                 | ❌      |
| Theory course access list names         | `TheoryCourseAccessManager.tsx:75`  | —                 | ❌      |
| Admin · System logs (raw userId)        | `SystemLogsTable.Row.tsx:22`        | —                 | ❌      |
| Admin dash · pending invite email       | `AdminDashboardEditorial.tsx:155`   | —                 | ❌      |

_Excluded (correctly not links):_ student `<select>` pickers (lesson form, assignment-create, email-draft, progress-insights), theory grant checkboxes, and the signed-in user's own topbar/sidebar avatar.

---

## Lessons — every reference (5 / 12 linked)

| Location                            | File · line                           | Goes to           | Verdict |
| ----------------------------------- | ------------------------------------- | ----------------- | ------- |
| Lessons list rows                   | `LessonsListEditorial.tsx:270`        | /lessons/[id]     | ✅      |
| Teacher "today's schedule"          | `TeacherDaySpineLesson.tsx:28`        | /lessons/[id]     | ✅      |
| Student dash · Next lesson card     | `StudentDashboardEditorial.tsx:130`   | /lessons/[id]     | ✅      |
| Student detail · Recent lessons     | `StudentDetailEditorial.tsx:278`      | /lessons/[id]     | ✅      |
| Assignment detail · lesson link     | `AssignmentDetailEditorial.tsx:186`   | /lessons/[id]     | ✅      |
| Notification (bell) · lesson types  | `notification-in-app-content.ts:35`   | /lessons (list)   | 🟡      |
| Student Health · "Schedule Lesson"  | `StudentHealthTable.tsx:105`          | /lessons?student= | 🟡      |
| Roster · "last lesson" date         | `BackfillCards.tsx:213`               | /users/[id]       | 🟡      |
| Notifications inbox rows            | `NotificationsEditorial.List.tsx:124` | —                 | ❌      |
| Calendar · conflict card            | `ConflictList.tsx:84`                 | —                 | ❌      |
| Student dash · greeting text        | `StudentDashboardEditorial.tsx:109`   | —                 | ❌      |
| Student Health · "Last Lesson" chip | `StudentHealthTable.tsx:185`          | —                 | ❌      |

_Structural gap:_ `app/dashboard/calendar/page.tsx` renders only Google-sync settings — it shows **no lesson events at all**. _Excluded (aggregate counts):_ teacher greeting "{N} lessons scheduled", admin dashboard & insights "Lessons" totals.

---

## Songs — every reference (7 / 13 linked)

| Location                           | File · line                                | Goes to       | Verdict |
| ---------------------------------- | ------------------------------------------ | ------------- | ------- |
| Song library table                 | `SongsListEditorial.tsx:34`                | /songs/[id]   | ✅      |
| Song detail · related songs        | `SongSidebarEditorial.tsx:137`             | /songs/[id]   | ✅      |
| Lesson detail · songs in lesson    | `LessonDetailEditorial.tsx:214`            | /songs/[id]   | ✅      |
| Assignment detail · song           | `AssignmentDetailEditorial.tsx:175`        | /songs/[id]   | ✅      |
| Student detail · repertoire        | `StudentDetailEditorial.Repertoire.tsx:26` | /songs/[id]   | ✅      |
| Student dash · working on          | `StudentDashboardEditorial.tsx:174`        | /songs/[id]   | ✅      |
| Admin/teacher dash · library       | `BackfillCards.tsx:241`                    | /songs/[id]   | ✅      |
| Teacher day-spine · song chips     | `TeacherDaySpineLesson.tsx:105`            | /lessons/[id] | 🟡      |
| Notification (bell) · mastery      | `notification-in-app-content.ts:103`       | /songs (list) | 🟡      |
| Repertoire grid card               | `RepertoireCard.tsx:54`                    | —             | ❌      |
| Practice history                   | `PracticeHistoryList.tsx:62`               | —             | ❌      |
| Notifications inbox rows (mastery) | `NotificationsEditorial.List.tsx:156`      | —             | ❌      |
| Spotify import · debug notice      | `SpotifyImportDebug.tsx:37`                | —             | ❌      |

_Excluded (correctly not links):_ song `<select>` pickers (lesson form, assignment-create, practice-log), the song's own detail hero, mocked "popular songs" in admin insights, and five "coming soon" analytics/stats stubs.

---

## Recommendations (by return)

| Priority     | Fix                                                                                                                                                                              | Files                                                                       | Effort |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------ |
| **P0 · bug** | Point Health "View Profile" at `/dashboard/users/[id]` (not `?id=`); restore the link on mobile                                                                                  | `StudentHealthTable.tsx:62,222`                                             | Quick  |
| **P1**       | Make notifications actionable: consume `action_url` in the inbox; emit `/[id]` deep links in the content builders                                                                | `NotificationsEditorial.List.tsx`, `notification-in-app-content.ts`         | Medium |
| **P1**       | Link song titles in Repertoire & Practice (reuse the linked title block student-detail already uses)                                                                             | `RepertoireCard.tsx:54`, `PracticeHistoryList.tsx:62`                       | Quick  |
| **P1**       | Make student/teacher names in list rows individually clickable (sibling link + `stopPropagation`); surface + link the teacher on lesson detail                                   | `LessonsListEditorial`, `AssignmentsListEditorial`, `LessonDetailEditorial` | Medium |
| **P2**       | Long tail: locked-account name → user; admin-AI summaries → profile; Spotify "exists/created" → song; name (not UUID) in system logs; render + link lessons on the Calendar page | various                                                                     | Varies |
