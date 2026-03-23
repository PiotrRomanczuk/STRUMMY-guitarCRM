# Architecture Plan: Users - Lessons - Songs

## Current State Analysis

### Database Schema (As-Is)

```
profiles (users)
  id, email, full_name, is_admin, is_teacher, is_student, student_status, ...

songs (global library)
  id, title, author, level, key, capo_fret, strumming_pattern, tempo, ...

lessons
  id, teacher_id -> profiles, student_id -> profiles,
  lesson_number, scheduled_at, status, notes, ...

lesson_songs (junction: lesson <-> song)
  id, lesson_id -> lessons, song_id -> songs,
  status (song_progress_status), notes

student_song_progress (DEPRECATED — replaced by student_repertoire)
  id, student_id -> profiles, song_id -> songs,
  current_status, started_at, mastered_at,
  total_practice_minutes, practice_session_count, last_practiced_at,
  teacher_notes, student_notes, difficulty_rating

assignments
  id, teacher_id, student_id, lesson_id (optional),
  title, description, status, due_date

practice_sessions
  id, student_id, song_id (optional), duration_minutes, notes

skills / student_skills
  Skill mastery tracking per student
```

### Relationship Diagram (As-Is)

```
                    +-----------+
                    | profiles  |
                    +-----+-----+
                   /      |      \
          teacher_id  student_id  student_id
                /         |          \
       +-------+    +-----+-----+    +-------------------------+
       |lessons|    |assignments |    |student_song_progress    |
       +---+---+    +-----------+    |(DEPRECATED — use        |
                                     | student_repertoire)     |
                                     +-------------------------+
           |                              |
    lesson_id                          song_id
           |                              |
    +------+------+                 +-----+-----+
    | lesson_songs|---------------->|   songs    |
    +-------------+    song_id      +-----------+
```

### Key Problems

1. **No direct user-to-song relationship for repertoire**: A student's song repertoire is derived indirectly from `lessons -> lesson_songs -> songs`. There is no way to assign a song to a student outside a lesson context.

2. **`student_song_progress` is DEPRECATED**: This table has been superseded by `student_repertoire` (see migration `20260222000000`). All code now reads from `student_repertoire`.

3. **No user-specific song configuration**: Song attributes like key, capo, strumming pattern live on the global `songs` table. A student who plays "Wonderwall" in a different key or with a different capo position has nowhere to store that preference.

4. **Lesson creation not accessible from user page**: The user detail page shows lessons read-only. Teachers cannot create a new lesson for a student directly from the student's profile page.

5. **No repertoire management workflow**: Teachers can't curate a student's song list outside of lesson context. There's no "add song to student's repertoire" action, no ordering/prioritization, no active/inactive distinction.

6. **Dual progress tracking resolved**: `student_repertoire` is now the single source of truth for song progress. `lesson_songs.status` tracks per-lesson progress; `student_repertoire.current_status` tracks lifetime progress. `student_song_progress` is deprecated.

---

## Proposed Architecture (To-Be)

### Core Principle: Three Levels of Song Data

```
Level 1: GLOBAL SONG LIBRARY        (songs table - master reference data)
Level 2: STUDENT REPERTOIRE          (student_repertoire - per-student song config & progress)
Level 3: LESSON SONG ACTIVITY        (lesson_songs - what happened in a specific lesson)
```

Each level has a clear purpose:
- **Level 1** is the canonical song record (title, author, default key, etc.)
- **Level 2** is the student's relationship with a song (their preferred key, progress, notes)
- **Level 3** is a historical record of what was worked on in a specific lesson

---

### New/Modified Tables

#### 1. `student_repertoire` (NEW -- replaces `student_song_progress`)

This is the **primary user-to-song relationship**. It represents "this student is learning/has learned this song" with student-specific configuration.

```sql
CREATE TABLE student_repertoire (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Core relationship
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,

    -- Student-specific song configuration (overrides global song defaults)
    preferred_key music_key,               -- Student plays in a different key
    capo_fret SMALLINT CHECK (capo_fret IS NULL OR (capo_fret >= 0 AND capo_fret <= 20)),
    custom_strumming VARCHAR(255),          -- Student-specific strumming pattern
    student_notes TEXT,                     -- Student's own notes
    teacher_notes TEXT,                     -- Teacher notes for this student + song

    -- Progress tracking (single source of truth)
    current_status song_progress_status NOT NULL DEFAULT 'to_learn',
    started_at TIMESTAMPTZ,
    mastered_at TIMESTAMPTZ,
    difficulty_rating SMALLINT CHECK (difficulty_rating IS NULL OR (difficulty_rating >= 1 AND difficulty_rating <= 5)),

    -- Practice metrics (aggregated)
    total_practice_minutes INTEGER DEFAULT 0,
    practice_session_count INTEGER DEFAULT 0,
    last_practiced_at TIMESTAMPTZ,

    -- Repertoire management
    assigned_by UUID REFERENCES profiles(id),  -- Teacher who added this song
    sort_order INTEGER DEFAULT 0,               -- Custom ordering
    is_active BOOLEAN DEFAULT true,             -- Active in current practice rotation
    priority VARCHAR(20) DEFAULT 'normal'
        CHECK (priority IN ('high', 'normal', 'low', 'archived')),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_student_repertoire UNIQUE (student_id, song_id)
);
```

**Why this replaces `student_song_progress`:**
- Same core fields (student_id, song_id, current_status, started_at, mastered_at, practice metrics)
- Adds student-specific song configuration (preferred_key, capo, strumming)
- Adds repertoire management (sort_order, is_active, priority, assigned_by)
- Single table instead of two concepts

#### 2. `lesson_songs` (MODIFIED -- add repertoire reference)

```sql
-- Add column to link lesson_songs to student_repertoire
ALTER TABLE lesson_songs
    ADD COLUMN repertoire_id UUID REFERENCES student_repertoire(id) ON DELETE SET NULL,
    ADD COLUMN notes_for_lesson TEXT;  -- lesson-specific notes (already exists as 'notes')
```

**Behavior change:** When a song is added to a lesson:
1. Check if `student_repertoire` entry exists for this student + song
2. If not, auto-create one (status = 'to_learn', assigned_by = teacher)
3. Link `lesson_songs.repertoire_id` to the repertoire entry
4. When `lesson_songs.status` is updated, cascade the best status to `student_repertoire.current_status`

#### 3. `songs` table (UNCHANGED)

The global song library stays as-is. It represents the canonical master data. Student-specific overrides go into `student_repertoire`.

#### 4. `lessons` table (UNCHANGED)

No schema changes needed for lessons. The improvements are in the UI layer.

---

### Relationship Diagram (To-Be)

```
                       +-----------+
                       | profiles  |
                       +-----+-----+
                      /      |      \
             teacher_id  student_id  student_id
                   /         |          \
          +-------+    +-----+-----+    +--------------------+
          |lessons|    |assignments |    |student_repertoire  |<-- NEW: direct user-song link
          +---+---+    +-----------+    +---------+----------+
              |                               |         |
       lesson_id                          song_id   repertoire_id
              |                               |         |
       +------+------+                 +------+----+    |
       | lesson_songs|--repertoire_id->|          |<---+
       |             |---------------->|  songs   |
       +-------------+    song_id      +----------+
```

**Key difference:** `student_repertoire` creates a direct edge between users and songs, eliminating the need to traverse through lessons.

---

## User Page Architecture

### URL Structure

```
/dashboard/users/[id]              -- Overview (default tab)
/dashboard/users/[id]?tab=lessons  -- Lessons tab
/dashboard/users/[id]?tab=songs    -- Repertoire tab
/dashboard/users/[id]?tab=homework -- Assignments tab
/dashboard/users/[id]?tab=practice -- Practice tab
```

### Tab 1: Overview (Default)

**Purpose:** At-a-glance student summary

```
+---------------------------------------------------------------+
| [Avatar] Student Name                           [Edit] [More] |
| student@email.com | Active since Jan 2024                     |
+---------------------------------------------------------------+
|                                                                |
| +-- Stats Row -----------------------------------------------+|
| | Total Lessons: 24  | Songs: 12  | Mastered: 5  | Streak: 3||
| +------------------------------------------------------------+|
|                                                                |
| +-- Upcoming Lessons (3) --------+  +-- Active Songs (5) ----+|
| | #25 - Mon Feb 24 (SCHEDULED)   |  | Wonderwall - learning  ||
| | #26 - Mon Mar 3  (SCHEDULED)   |  | Blackbird  - started   ||
| | [+ Schedule New Lesson]        |  | Hotel Cali - to_learn  ||
| +--------------------------------+  | [+ Add Song]           ||
|                                     +------------------------+|
| +-- Recent Assignments -----------+                           |
| | Practice chord transitions (DUE)|                           |
| | Learn intro riff (COMPLETED)    |                           |
| +--------------------------------+                            |
+---------------------------------------------------------------+
```

**Data sources:**
- Profile from `profiles`
- Stats from `student_repertoire` (counts by status) + `lessons` (count)
- Upcoming lessons from `lessons WHERE student_id AND status = SCHEDULED`
- Active songs from `student_repertoire WHERE is_active = true ORDER BY sort_order`
- Assignments from `assignments WHERE student_id`

### Tab 2: Lessons

**Purpose:** Full lesson history with ability to create new lessons

```
+---------------------------------------------------------------+
| Lessons for [Student Name]                 [+ New Lesson]     |
+---------------------------------------------------------------+
| Filter: [All Statuses v] [Date Range] [Search]               |
+---------------------------------------------------------------+
| # | Date         | Teacher       | Songs            | Status  |
|---|-------------|---------------|------------------|---------|
|25 | Feb 24 2026 | Piotr R.      | Wonderwall(2)... | SCHED   |
|24 | Feb 17 2026 | Piotr R.      | Blackbird(1)     | DONE    |
|23 | Feb 10 2026 | Piotr R.      | -                | CANCEL  |
|...|             |               |                  |         |
+---------------------------------------------------------------+
```

**[+ New Lesson] button behavior:**
- Opens lesson creation form pre-filled with:
  - `student_id` = current user
  - `teacher_id` = current logged-in teacher (or selectable if admin)
  - Song selector showing songs from `student_repertoire` first (with option to add new)

**Lesson detail expandable row or click-through:**
- Shows songs worked on in that lesson (from `lesson_songs`)
- Per-song status at that point in time
- Lesson notes
- Quick status update for lesson

### Tab 3: Repertoire (Songs)

**Purpose:** Manage the student's song collection with per-student configuration

```
+---------------------------------------------------------------+
| Repertoire for [Student Name]               [+ Add Song]      |
+---------------------------------------------------------------+
| Filter: [All v] [Active Only] [By Level] [Search songs...]   |
| Group by: [Status] [Priority] [None]                          |
+---------------------------------------------------------------+
|                                                                |
| -- HIGH PRIORITY -----------------------------------------    |
| | Wonderwall - Oasis        Key: G (song: Em) Capo: 2    |   |
| | Status: [learning v]  Last practiced: 2 days ago        |   |
| | Teacher note: "Focus on strumming pattern"              |   |
| | [Edit Config] [Add to Next Lesson] [Archive]            |   |
| +--------------------------------------------------------+   |
|                                                                |
| -- NORMAL PRIORITY ----------------------------------------   |
| | Blackbird - Beatles       Key: G (default)  No capo    |   |
| | Status: [started v]   Last practiced: 1 week ago        |   |
| | [Edit Config] [Add to Next Lesson] [Archive]            |   |
| +--------------------------------------------------------+   |
|                                                                |
| -- ARCHIVED -----------------------------------------------   |
| | Hotel California - Eagles (mastered Jan 2026)           |   |
| +--------------------------------------------------------+   |
+---------------------------------------------------------------+
```

**[+ Add Song] flow:**
1. Search the global song library
2. If song exists: create `student_repertoire` entry with defaults
3. If song doesn't exist: create song first, then add to repertoire
4. Optional: set initial config (key, capo, priority, notes)

**[Edit Config] inline/modal:**
```
+-- Edit Song Configuration ---------------+
| Song: Wonderwall (by Oasis)              |
|                                          |
| Preferred Key: [G       v]  (Song: Em)  |
| Capo Position: [2       v]              |
| Strumming:     [D-DU-UDU    ]           |
| Priority:      [High    v]              |
|                                          |
| Teacher Notes:                           |
| [Focus on strumming pattern, student    ]|
| [tends to rush the upstrokes            ]|
|                                          |
| Student Notes:                           |
| [I find the bridge difficult            ]|
|                                          |
| [Save]  [Cancel]                         |
+------------------------------------------+
```

**[Add to Next Lesson]:**
- Finds the next SCHEDULED lesson for this student
- Adds the song to that lesson's `lesson_songs`
- If no upcoming lesson exists, prompts to create one

### Tab 4: Assignments

**Purpose:** Homework and practice task management

```
+---------------------------------------------------------------+
| Assignments for [Student Name]         [+ New Assignment]     |
+---------------------------------------------------------------+
| [Active: 3] [Completed: 12] [Overdue: 1]                     |
+---------------------------------------------------------------+
| Title               | Due Date  | Linked Lesson | Status      |
|---------------------|-----------|---------------|-------------|
| Practice transitions| Feb 26    | Lesson #25    | IN PROGRESS |
| Learn intro riff    | Feb 20    | Lesson #24    | COMPLETED   |
| Chord changes C-G   | Feb 15    | -             | OVERDUE     |
+---------------------------------------------------------------+
```

**[+ New Assignment]:**
- Pre-fills `student_id`
- Optional link to an existing lesson
- Can link to a specific song from repertoire
- Template selector from `assignment_templates`

### Tab 5: Practice (Future)

**Purpose:** Practice session logs and analytics

```
+---------------------------------------------------------------+
| Practice Log for [Student Name]                               |
+---------------------------------------------------------------+
| This Week: 3 sessions, 45 min total                          |
| [Mon: 20min] [Wed: 15min] [Fri: 10min]                      |
+---------------------------------------------------------------+
| Recent Sessions:                                              |
| Feb 21 - 20 min - Wonderwall (strumming practice)            |
| Feb 19 - 15 min - Blackbird (fingerpicking intro)            |
| Feb 17 - 10 min - General chord transitions                  |
+---------------------------------------------------------------+
```

---

## Data Flow: Key User Journeys

### Journey 1: Teacher adds a song to a student's repertoire

```
Teacher opens /dashboard/users/[student-id]?tab=songs
  -> Clicks [+ Add Song]
  -> Searches "Wonderwall"
  -> Song found in global library
  -> Teacher sets: preferred_key=G, capo=2, priority=high
  -> System creates:
     INSERT INTO student_repertoire (student_id, song_id, preferred_key,
       capo_fret, priority, assigned_by, current_status)
     VALUES ($student, $song, 'G', 2, 'high', $teacher, 'to_learn')
```

### Journey 2: Teacher creates a lesson with songs from repertoire

```
Teacher opens /dashboard/users/[student-id]?tab=lessons
  -> Clicks [+ New Lesson]
  -> Form pre-fills: student_id, teacher_id, next available date
  -> Song selector shows student_repertoire entries (sorted by priority)
  -> Teacher picks "Wonderwall" and "Blackbird" from repertoire
  -> Teacher adds lesson notes
  -> System creates:
     INSERT INTO lessons (student_id, teacher_id, scheduled_at, ...)
     INSERT INTO lesson_songs (lesson_id, song_id, repertoire_id, status)
       for each selected song
```

### Journey 3: During/after a lesson, teacher updates song progress

```
Teacher opens lesson detail /dashboard/lessons/[id]
  -> Changes "Wonderwall" status from "to_learn" to "started"
  -> System updates:
     UPDATE lesson_songs SET status = 'started' WHERE id = $lessonSongId
  -> Trigger/action also updates:
     UPDATE student_repertoire SET current_status = 'started', started_at = now()
       WHERE id = $repertoireId AND current_status < 'started'
     (Only advances forward, never regresses)
```

### Journey 4: Student views their own repertoire

```
Student opens /dashboard/users/[own-id]?tab=songs
  -> Sees all songs in their repertoire with current status
  -> Can add student_notes to any song
  -> Can set difficulty_rating
  -> Cannot modify teacher_notes, priority, or assigned_by
  -> Can see which lessons each song appeared in (via lesson_songs.repertoire_id)
```

---

## Migration Strategy

### Phase 1: Database (student_repertoire table)

1. Create `student_repertoire` table
2. Migrate data from `student_song_progress` into `student_repertoire`
3. Backfill from `lesson_songs` for any student-song pairs not in `student_song_progress`
4. Add `repertoire_id` column to `lesson_songs`
5. Backfill `lesson_songs.repertoire_id` using student_id from lesson + song_id
6. Add RLS policies to `student_repertoire`
7. ~~Keep `student_song_progress` temporarily for backwards compatibility~~ -- DONE: deprecated in migration `20260322000001`

### Phase 2: Backend (APIs & Server Actions)

1. Create server actions for `student_repertoire` CRUD
2. Create API route: `GET/POST /api/users/[id]/repertoire`
3. Create API route: `PATCH /api/users/[id]/repertoire/[songId]`
4. Modify lesson creation to auto-create repertoire entries
5. Modify `lesson_songs` status update to cascade to `student_repertoire`
6. Update `fetchUserData` in user detail page to query `student_repertoire` instead of deriving from lessons

### Phase 3: Frontend (User Page Redesign)

1. Add tab navigation to user detail page
2. Build `UserRepertoire` component with song configuration
3. Build `AddSongToRepertoire` dialog with search + config form
4. Build `EditSongConfig` dialog/inline form
5. Add [+ New Lesson] button to lessons tab (pre-filled student)
6. Modify lesson form song selector to prioritize repertoire songs
7. Add "Add to Next Lesson" quick action on repertoire songs

### Phase 4: Cleanup

1. ~~Drop `student_song_progress` table~~ -- In progress: table deprecated in migration `20260322000001`, will be dropped in a future migration
2. ~~Remove derived song queries from user detail page~~ -- DONE: `fetchUserData` now queries `student_repertoire` directly
3. Update views (`v_song_usage_stats`, etc.) to use `student_repertoire`

---

## RLS Policies for `student_repertoire`

```sql
-- Students can view their own repertoire
CREATE POLICY "Students view own repertoire" ON student_repertoire
    FOR SELECT USING (student_id = auth.uid());

-- Students can update their own notes and difficulty rating
CREATE POLICY "Students update own notes" ON student_repertoire
    FOR UPDATE USING (student_id = auth.uid())
    WITH CHECK (student_id = auth.uid());

-- Admins and teachers can view all
CREATE POLICY "Admin/teachers view all repertoire" ON student_repertoire
    FOR SELECT USING (is_admin_or_teacher());

-- Admins and teachers can manage all
CREATE POLICY "Admin/teachers manage repertoire" ON student_repertoire
    FOR ALL USING (is_admin_or_teacher());
```

---

## Summary: What Changes

| Area | Current | Proposed |
|------|---------|----------|
| Student-song link | Indirect (via lessons) | Direct (`student_repertoire`) |
| Song config per student | None (global only) | preferred_key, capo, strumming, notes |
| Progress source of truth | Dual (`lesson_songs` + `student_song_progress`) | Single (`student_repertoire`, with `lesson_songs` as history) |
| Add song to student | Only through lesson | Directly from user page or through lesson |
| User page layout | Flat sections | Tabbed (Overview, Lessons, Repertoire, Assignments, Practice) |
| Lesson creation from user | Not possible | [+ New Lesson] pre-filled with student |
| Repertoire management | None | Priority, ordering, active/archived, grouping |
| Song in lesson | Independent of student | References `student_repertoire` entry |
