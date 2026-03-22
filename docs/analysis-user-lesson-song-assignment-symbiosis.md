# Deep Analysis: User-Lesson-Song-Assignment Symbiosis in Strummy

## 1. Entity Relationship Map

```
                    +-------------------------------------------------+
                    |              PROFILES (User)                     |
                    |  id, email, full_name, is_admin/teacher/         |
                    |  student, student_status (pipeline)              |
                    +------+----------------+--------------+----------+
                           |                |              |
              as teacher_id|      as student_id            | as student_id
                           |                |              |
                    +------v----------------v------+  +----v-----------------+
                    |         LESSONS              |  |  STUDENT_REPERTOIRE  |
                    |  teacher_id <-> student_id   |  |  student_id + song_id|
                    |  scheduled_at, status,       |  |  current_status,     |
                    |  lesson_number (auto)        |  |  preferred_key,      |
                    |  google_event_id (cal sync)  |  |  difficulty_rating,  |
                    +------+--------------+--------+  |  practice metrics    |
                           |              |           +----------^-----------+
                    1:N    |              | 1:N (opt)            |
                           |              |                      | auto-sync trigger
                    +------v------+ +-----v----------+          |
                    | LESSON_SONGS| |  ASSIGNMENTS   |          |
                    | lesson_id   | |  teacher_id    |          |
                    | song_id     | |  student_id    |          |
                    | status -----+-|  lesson_id(opt)|          |
                    | repertoire_id-+------------------>--------+
                    | notes       | |  due_date      |
                    +------+------+ |  status (FSM)  |
                           |        +----------------+
                    N:1    |
                    +------v------+
                    |    SONGS    |
                    |  title,     |
                    |  author,    |
                    |  key, tempo,|
                    |  level,     |
                    |  chords,    |
                    |  links...   |
                    +-------------+
```

---

## 2. The Four Core Entities and Their Roles

### Profiles (Users)
The anchor of the entire system. Every profile has three boolean role flags: `is_admin`, `is_teacher`, `is_student`. A single user can hold multiple roles. The `student_pipeline_status` (`lead -> trial -> active -> inactive -> churned`) tracks student lifecycle independently of lesson activity.

**Key insight**: Users don't "own" songs or lessons in isolation. They participate in lessons through typed relationships (`teacher_id` or `student_id`), and their song progress emerges from lesson activity via triggers.

### Songs
A **shared library** -- songs are not owned by any user. They exist globally and become contextual through junction tables. A song carries rich metadata (27 columns) including musical properties (key, tempo, capo, strumming pattern), external links (Spotify, YouTube, Ultimate Guitar, TikTok), and content (chords, cover art, gallery images, audio files as JSONB).

**Key insight**: Songs are curriculum building blocks. Their value grows multiplicatively as they connect to more students and lessons. The `search_vector` (tsvector) and trigram indexes enable instant song discovery when teachers build lesson plans.

### Lessons
The **temporal meeting point** between a teacher and a student. Each lesson has a unique `lesson_number` (auto-incremented per teacher-student pair), a `scheduled_at` timestamp, and a status FSM (`SCHEDULED -> IN_PROGRESS -> COMPLETED -> CANCELLED -> RESCHEDULED`). Google Calendar sync is built-in via `google_event_id`.

**Key insight**: Lessons are the primary context for song assignment. The `lesson_songs` junction table makes the lesson the moment where a song enters (or progresses within) a student's repertoire.

### Assignments
**Asynchronous homework** given by teachers to students. Assignments have their own status FSM (`not_started -> in_progress -> completed / overdue / cancelled`) with enforced transition rules.

The `lesson_id` FK is **optional** -- this is a deliberate design choice that gives assignments three levels of connectivity:

| Scenario | lesson_id | Song Connection | Example |
|----------|-----------|-----------------|---------|
| Standalone | `NULL` | None | "Write down 5 chords you know" |
| Lesson-linked, general | Set | Exists but incidental | "Review everything from today's lesson" |
| Lesson-linked, song-focused | Set | Meaningful (via lesson_songs) | "Practice the songs from lesson #12" |

**Key insight**: Assignments extend the lesson beyond the scheduled time slot. They connect to songs **indirectly and optionally** through the lesson: `Assignment --(optional)--> Lesson --(1:N)--> lesson_songs --(N:1)--> Song`. Every link in this chain is optional or contextual. An assignment never requires a song, but when a `lesson_id` is present, the full song context is available through the join. This flexibility allows assignments to range from completely abstract ("practice scales for 15 minutes") to song-specific ("master the chord transitions in Wonderwall from lesson #12").

---

## 3. The Junction Tables: Where Symbiosis Happens

### lesson_songs -- The Bridge That Creates Progress

This is the most architecturally significant table in the system. It connects a **lesson** to a **song** with a `status` field that tracks learning progress:

```
to_learn -> started -> remembered -> with_author -> mastered
```

Each `lesson_songs` row also carries:
- `notes` -- lesson-specific teacher notes about this song
- `repertoire_id` -- a direct FK to `student_repertoire`, linking this lesson-moment to the student's overall progress

**The trigger cascade** (`fn_sync_lesson_song_to_repertoire`):
1. When a song is **added** to a lesson (`INSERT`) or its **status changes** (`UPDATE`), a `BEFORE` trigger fires
2. It looks up the student from the parent lesson
3. It **auto-creates** a `student_repertoire` entry if one doesn't exist (UPSERT)
4. It **advances status forward only** -- if the new status is higher than the current repertoire status, it updates. Never regresses.
5. It stamps `started_at` when a student first moves past `to_learn`, and `mastered_at` when `mastered` is reached
6. It links `lesson_songs.repertoire_id` back to the repertoire entry

This is the core symbiosis: **lesson activity automatically builds and advances the student's permanent repertoire**.

### student_repertoire -- The Single Source of Truth

This table replaces indirect derivation from `lesson_songs`. It is the **canonical record** of "this student knows/is learning this song" with:

- **Per-student overrides**: `preferred_key`, `capo_fret`, `custom_strumming` (different from the song's global defaults)
- **Progress tracking**: `current_status`, `started_at`, `mastered_at`
- **Practice metrics**: `total_practice_minutes`, `practice_session_count`, `last_practiced_at`
- **Management**: `priority` (high/normal/low/archived), `sort_order`, `is_active`
- **Annotations**: `teacher_notes`, `student_notes`, `difficulty_rating` (1-5)

**Key insight**: A student might practice "Wonderwall" across 15 different lessons over 6 months. Each lesson has its own `lesson_songs` entry with a point-in-time status. But `student_repertoire` is the one record that says "this student has mastered Wonderwall" -- it's the aggregated, forward-only truth.

---

## 4. Data Flow Lifecycles

### Lifecycle 1: Song Discovery -> Lesson Assignment -> Mastery

```
1. Teacher searches song library (tsvector + trigram search)
2. Teacher creates/edits a lesson -> LessonSongSelector modal
3. Song is added to lesson -> INSERT lesson_songs (status: 'to_learn')
   +-- TRIGGER: auto-creates student_repertoire entry
4. During lesson, teacher updates status -> UPDATE lesson_songs.status
   +-- TRIGGER: advances student_repertoire.current_status (forward only)
5. Same song appears in next week's lesson -> new lesson_songs row
   +-- TRIGGER: links to existing repertoire, may advance status further
6. After weeks of practice -> status reaches 'mastered'
   +-- TRIGGER: stamps mastered_at timestamp
```

### Lifecycle 2: Assignment Creation -> Completion

```
1. Teacher creates assignment (standalone OR from a lesson context)
   |-- Links to student_id, teacher_id (always required)
   |-- Optionally links to lesson_id (born from a specific lesson)
   |   +-- When lesson_id is set, songs from that lesson are
   |       available as context (via lesson_songs join),
   |       but the assignment itself has no direct song FK
   +-- Status: 'not_started'
2. Student begins work -> status: 'in_progress'
3. Student completes -> status: 'completed'
   (or: past due_date -> status: 'overdue')
4. Valid transitions enforced:
   not_started -> [in_progress, cancelled]
   in_progress -> [completed, cancelled]
   overdue -> [in_progress, completed, cancelled]
   completed -> [] (terminal)
   cancelled -> [] (terminal)
```

### Lifecycle 3: Student Pipeline

```
lead -> trial -> active -> inactive -> churned

- 'lead': Student added but no lessons yet (via pending_students or direct)
- 'trial': First lesson scheduled/completed
- 'active': Ongoing regular lessons
- 'inactive': Gap in lessons (no activity threshold)
- 'churned': Left the program
```

This is tracked independently on `profiles.student_status` and doesn't auto-update from lesson activity (it's a manual/admin-driven pipeline).

---

## 5. Cross-Entity Query Patterns

### Teacher Dashboard: "My Student's Progress"

```sql
-- All songs a student is learning, with latest lesson context
SELECT sr.*, s.title, s.author, s.level,
       ls.lesson_id, l.scheduled_at, l.lesson_number
FROM student_repertoire sr
JOIN songs s ON s.id = sr.song_id
LEFT JOIN lesson_songs ls ON ls.repertoire_id = sr.id
LEFT JOIN lessons l ON l.id = ls.lesson_id
WHERE sr.student_id = $1
  AND sr.is_active = true
ORDER BY sr.priority, sr.sort_order;
```

### Song Detail Page: "Who's Learning This Song?"

```sql
-- Students grouped by mastery level
SELECT p.full_name, sr.current_status, sr.started_at, sr.mastered_at,
       sr.total_practice_minutes, sr.difficulty_rating
FROM student_repertoire sr
JOIN profiles p ON p.id = sr.student_id
WHERE sr.song_id = $1
ORDER BY
  CASE sr.current_status
    WHEN 'mastered' THEN 1
    WHEN 'with_author' THEN 2
    WHEN 'remembered' THEN 3
    WHEN 'started' THEN 4
    WHEN 'to_learn' THEN 5
  END;
```

### Song Detail Page: "Assignments Related to This Song"

```sql
-- Assignments that connect to this song through their linked lesson
-- Note: this only finds assignments with a lesson_id set;
-- standalone assignments have no song connection by design
SELECT a.id, a.title, a.status, a.due_date,
       sp.full_name as student_name,
       l.lesson_number, l.scheduled_at
FROM assignments a
JOIN lessons l ON l.id = a.lesson_id
JOIN lesson_songs ls ON ls.lesson_id = l.id
JOIN profiles sp ON sp.id = a.student_id
WHERE ls.song_id = $1
  AND a.deleted_at IS NULL
ORDER BY a.due_date DESC;
```

### Lesson Detail Page: "Everything About This Lesson"

```sql
-- Lesson + songs with status + student + teacher + assignments
SELECT l.*,
       sp.full_name as student_name,
       tp.full_name as teacher_name,
       json_agg(DISTINCT jsonb_build_object(
           'song_id', s.id, 'title', s.title, 'status', ls.status
       )) as songs,
       json_agg(DISTINCT jsonb_build_object(
           'id', a.id, 'title', a.title, 'status', a.status, 'due_date', a.due_date
       )) as assignments
FROM lessons l
JOIN profiles sp ON sp.id = l.student_id
JOIN profiles tp ON tp.id = l.teacher_id
LEFT JOIN lesson_songs ls ON ls.lesson_id = l.id
LEFT JOIN songs s ON s.id = ls.song_id
LEFT JOIN assignments a ON a.lesson_id = l.id AND a.deleted_at IS NULL
WHERE l.id = $1
GROUP BY l.id, sp.full_name, tp.full_name;
```

---

## 6. Role-Based Access Control (RLS) Symbiosis

The RLS policies create an elegant access hierarchy:

| Entity | Admin | Teacher | Student |
|--------|-------|---------|---------|
| **Profiles** | See all, edit all | See all, edit none | See own only |
| **Songs** | All (incl. drafts) | All (incl. drafts) | Only non-draft songs in their lessons |
| **Lessons** | All | Only where teacher_id = self | Only where student_id = self |
| **Lesson Songs** | Via lesson access | Via lesson access | Via lesson access |
| **Assignments** | All | Only where teacher_id = self | Only where student_id = self |
| **Student Repertoire** | All | All | Own only |

**Critical RLS insight for songs**: Students can only see songs that appear in their lessons. This means the song library is implicitly filtered -- a student never sees a song they haven't been assigned. This is enforced at the database level:

```sql
-- Student song visibility: only songs in their active lessons
CREATE POLICY songs_select_student ON songs
    FOR SELECT USING (
        is_student() AND EXISTS (
            SELECT 1 FROM lesson_songs ls
            JOIN lessons l ON l.id = ls.lesson_id
            WHERE ls.song_id = songs.id
              AND l.student_id = auth.uid()
              AND l.deleted_at IS NULL
        ) AND NOT is_draft
    );
```

---

## 7. The Symbiosis Model

Here's how these entities work together as a living system:

```
                        +------------------+
                        |   SONG LIBRARY   | (shared curriculum)
                        |   ~N songs       |
                        +--------+---------+
                                 |
                    +------------+------------+
                    |            |            |
           +-------v--+  +-----v-----+  +--v----------+
           | Lesson #1 |  | Lesson #2 |  |  Lesson #N  |
           | (moment)  |  | (moment)  |  |  (moment)   |
           +-----+-----+  +-----+-----+  +------+------+
                 |              |                |
    lesson_songs |   lesson_songs|     lesson_songs|
    (started)    |   (remembered)|     (mastered)  |
                 |              |                |
                 +--------------+----------------+
                                |
                        TRIGGER CASCADE
                        (forward-only)
                                |
                        +-------v--------+
                        |   STUDENT      |
                        |   REPERTOIRE   | (permanent record)
                        | status: mastered|
                        | started: Jan 5  |
                        | mastered: Mar 2 |
                        +----------------+


                    Assignments sit BESIDE the lesson-song axis:

    Songs <---- lesson_songs ----> Lessons <--(optional)-- Assignments
      |          (required)        (required)                    |
      |                                                         |
      +--- indirect, through lesson ----------------------------+

    An assignment MAY connect to songs (through its lesson),
    but it doesn't HAVE to. Both paths are valid by design.
```

**The metaphor**: Songs are **nouns**, lessons are **verbs** (moments where learning happens), lesson_songs are **adverbs** (how the learning progressed at that moment), student_repertoire is the **memory** (accumulated knowledge), and assignments are **homework** -- they sit alongside the lesson, optionally inheriting its song context but never requiring it.

### Temporal Dimension
- **Songs** are timeless (they exist in the library forever)
- **Lessons** are point-in-time events (a specific date with a specific teacher)
- **Lesson_songs** capture the snapshot (status at that lesson moment)
- **Student_repertoire** is the cumulative trajectory (forward-only status, never regresses)
- **Assignments** bridge time gaps (homework between lessons, optionally connected to the songs from that lesson)

### Multiplicative Relationships
- One song can appear in **hundreds of lessons** across **dozens of students**
- One student has **one repertoire entry per song** but **many lesson_songs entries** for the same song
- One lesson has **many songs** and **many assignments**
- One assignment has **one student, one teacher, optionally one lesson** (and through that lesson, optionally connects to songs)

---

## 8. The Assignment-Song Connection in Detail

This relationship deserves special attention because it's **optional at every level** -- a deliberate architectural choice.

### Database Reality

The `assignments` table has these FKs:
- `teacher_id UUID NOT NULL REFERENCES profiles(id)` -- always required
- `student_id UUID NOT NULL REFERENCES profiles(id)` -- always required
- `lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL` -- optional

There is **no `song_id` column** on assignments. The connection to songs flows exclusively through the lesson:

```
Assignment --(optional)--> Lesson --(1:N)--> lesson_songs --(N:1)--> Song
```

### Three Valid Assignment Patterns

**Pattern 1: Standalone Assignment (no lesson, no song)**
```
Assignment { lesson_id: NULL }
  -> No song context whatsoever
  -> Example: "Practice your scales for 20 minutes daily"
  -> Example: "Write down 5 songs you want to learn"
```

**Pattern 2: Lesson-Linked, General (lesson present, song connection incidental)**
```
Assignment { lesson_id: "abc-123" }
  -> Lesson has songs via lesson_songs, but the assignment
     doesn't specifically target them
  -> Example: "Review everything we covered today"
  -> The UI can show which songs were in that lesson as context
```

**Pattern 3: Lesson-Linked, Song-Focused (lesson present, song connection meaningful)**
```
Assignment { lesson_id: "abc-123" }
  -> Teacher creates assignment from lesson detail page
  -> Intent is to practice specific songs from that lesson
  -> Example: "Practice the chord transitions in Wonderwall and Hotel California"
  -> Song specificity lives in the description text, not in schema
```

### UI Implications

- **Song Detail Page** shows "Assignments for this song" by querying through the lesson join. Only assignments with a `lesson_id` pointing to a lesson that contains this song will appear. Standalone assignments are invisible here by design.
- **Lesson Detail Page** shows both songs and assignments side by side, making the implicit connection visible to the teacher.
- **Assignment List** shows assignments with their linked lesson (if any), and the lesson's songs can be expanded for context.

### Why This Design Works

The lack of a direct `song_id` on assignments is intentional flexibility:
1. **Not all homework is about specific songs** -- theory exercises, ear training, technique drills
2. **Assignments often span multiple songs** -- "practice all songs from today" can't be captured by a single `song_id`
3. **The lesson is the natural grouping** -- when a teacher creates homework after a lesson, the lesson context (including all its songs) is the right granularity
4. **Avoids forced coupling** -- a teacher shouldn't need to pick a song just to assign homework

---

## 9. Supporting Cast

### Practice Sessions
Optional student-initiated logs (`practice_sessions`) with `duration_minutes` and optional `song_id`. These feed into `student_repertoire.total_practice_minutes` and `practice_session_count`, adding quantitative depth to the qualitative status progression.

### AI Context System
The AI conversations table has a `context_type` enum: `general | student | lesson | song | assignment | practice`. This means AI assistance is contextually aware -- when a teacher asks AI for help from a lesson detail page, the AI knows which lesson, which student, and which songs are involved.

### Audit Trail
Every change to `profile`, `lesson`, `assignment`, `song`, or `song_progress` is captured in a partitioned `audit_log` table with actor, action, and JSON delta. This provides full traceability across all entity interactions.

### Assignment Templates
Teachers can create reusable templates (`assignment_templates`) to quickly generate common assignment types, reducing friction in the lesson-to-assignment workflow.

---

## 10. Architecture Strengths

1. **Forward-only status via trigger** -- Prevents accidental regression of student progress. A student who reached "remembered" in lesson #5 can never be set back to "to_learn" in the repertoire, even if a new lesson starts them on the same song fresh.

2. **Separation of lesson-moment vs lifetime-progress** -- `lesson_songs.status` is "how this song was going in this lesson." `student_repertoire.current_status` is "how far has this student ever gotten with this song." Both are preserved.

3. **Soft deletes everywhere** -- Lessons, songs, and assignments use `deleted_at` timestamps. Deleting a song doesn't destroy lesson history. All indexes filter `WHERE deleted_at IS NULL`.

4. **Per-student song overrides** -- `student_repertoire` allows each student to have their own key, capo, and strumming pattern for any song, while the song library maintains the canonical version.

5. **RLS at every layer** -- Database-enforced access means even a compromised API route can't leak cross-student data. Students literally cannot query songs they haven't been assigned.

6. **Optional assignment-to-song coupling** -- Assignments connect to songs indirectly through lessons, allowing the full spectrum from abstract homework (no song context) to song-specific practice (via lesson link). This avoids forcing teachers into unnecessary specificity while preserving the relationship when it exists naturally.

---

## 11. Gaps and Potential Improvements

1. **Manual student pipeline** -- The `student_pipeline_status` doesn't auto-advance based on lesson activity. A student with 20 completed lessons could still be marked as `lead` if nobody updates the field.

2. **No lesson recurrence** -- Each lesson is a standalone event. There's no recurring lesson pattern or schedule template, so teachers must create each lesson individually (though Google Calendar sync helps).

3. **Practice sessions disconnected from assignments** -- A student logging practice time doesn't automatically advance an assignment's status. The two systems (practice tracking and assignment tracking) run in parallel without automatic linking.

4. **Assignment templates lack song context** -- Templates store `title` and `description` but don't reference songs. A template like "Practice song X with metronome at Y BPM" would need parameterization to be truly reusable across different songs.

---

## 12. Complete Table Summary

| Table | Role | Required FKs | Optional FKs |
|-------|------|-------------|--------------|
| `profiles` | User identity & roles | `auth.users(id)` | -- |
| `songs` | Shared curriculum library | -- | -- |
| `lessons` | Teacher-student meeting point | `teacher_id`, `student_id` | `google_event_id` |
| `lesson_songs` | Song-in-lesson with progress | `lesson_id`, `song_id` | `repertoire_id` |
| `assignments` | Async homework | `teacher_id`, `student_id` | `lesson_id` |
| `assignment_templates` | Reusable homework templates | `teacher_id` | -- |
| `student_repertoire` | Lifetime song progress (SSOT) | `student_id`, `song_id` | `assigned_by` |
| `practice_sessions` | Student practice logs | `student_id` | `song_id` |
| `student_song_progress` | **DEPRECATED** -- replaced by `student_repertoire` | `student_id`, `song_id` | -- |
| `song_status_history` | Progress change audit | `student_id`, `song_id` | -- |
| `audit_log` | Full entity change history | `entity_type`, `entity_id` | `actor_id` |

---

This analysis covers the **schema layer** (24 tables, 18 enums, 50+ indexes), **business logic layer** (services, server actions, API routes), **trigger layer** (forward-only repertoire sync), **RLS layer** (role-based visibility), and **UI layer** (bidirectional navigation between all entities). The four core entities form a tightly coupled educational feedback loop where songs flow through lessons into student repertoires, optionally tracked by assignments and practice sessions, all under role-based access control.
