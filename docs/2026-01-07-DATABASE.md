# Database Reference

## 📊 Schema Overview

Guitar CRM uses PostgreSQL via Supabase with Row Level Security (RLS).

### Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `profiles` | User profiles extending auth.users | ✅ |
| `user_roles` | Role assignments (admin, teacher, student) | ✅ |
| `songs` | Song library with metadata | ✅ |
| `lessons` | Lesson scheduling and tracking | ✅ |
| `lesson_songs` | Songs assigned to lessons | ✅ |
| `assignments` | Practice tasks for students | ✅ |
| `assignment_templates` | Reusable assignment templates | ✅ |
| `api_keys` | Bearer token authentication | ✅ |
| `user_integrations` | OAuth tokens (Google Calendar) | ✅ |
| `webhook_subscriptions` | External webhook management | ✅ |
| `assignment_history` | Assignment change tracking | ✅ |
| `lesson_history` | Lesson change tracking | ✅ |
| `song_status_history` | Song progress tracking | ✅ |
| `student_song_progress` | **DEPRECATED** — use `student_repertoire` | ⚠️ |
| `practice_sessions` | Practice session logging | ✅ |

### Views

| View | Purpose |
|------|---------|
| `lesson_counts_per_student` | Aggregate lesson counts by student |
| `lesson_counts_per_teacher` | Aggregate lesson counts by teacher |
| `song_usage_stats` | Song usage analytics |
| `user_overview` | Combined user and role data |

---

## 🔑 Key Tables

### profiles

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK, auto-generated |
| `user_id` | uuid | FK → auth.users (nullable for shadow users) |
| `email` | text | UNIQUE, with email check constraint |
| `full_name` | text | Display name |
| `avatar_url` | text | Profile image |
| `notes` | text | Admin notes |
| `phone` | text | Contact number |
| `is_admin` | boolean | Admin role flag |
| `is_teacher` | boolean | Teacher role flag |
| `is_student` | boolean | Student role flag |
| `is_development` | boolean | Development account flag |
| `is_active` | boolean | Account active status |
| `is_shadow` | boolean | Shadow user (no auth account) |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

### songs

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `title` | text | NOT NULL |
| `author` | text | Artist/author name |
| `level` | difficulty_level | beginner/intermediate/advanced |
| `key` | music_key | Musical key (C, Am, etc.) |
| `ultimate_guitar_link` | text | UG URL |
| `chords` | text | Chord progression |
| `short_title` | varchar(50) | Abbreviated title |
| `youtube_url` | text | Video link |
| `gallery_images` | text[] | Image URLs |
| `spotify_link_url` | text | Spotify link |
| `capo_fret` | integer | 0-20 |
| `strumming_pattern` | text | Pattern description |
| `category` | text | Genre/category |
| `tempo` | integer | BPM |
| `time_signature` | integer | Numerator |
| `duration_ms` | integer | Duration in milliseconds |
| `release_year` | integer | Release year |
| `cover_image_url` | text | Album art |
| `audio_files` | jsonb | Audio file references |
| `deleted_at` | timestamptz | Soft delete |
| `search_vector` | tsvector | Full-text search |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update |

### lessons

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `teacher_id` | uuid | FK → profiles.id |
| `student_id` | uuid | FK → profiles.id |
| `lesson_teacher_number` | integer | Auto-set by trigger |
| `scheduled_at` | timestamptz | Lesson date/time |
| `status` | lesson_status | SCHEDULED/IN_PROGRESS/COMPLETED/CANCELLED |
| `notes` | text | Lesson notes |
| `title` | text | Lesson title |
| `google_event_id` | text | UNIQUE, Google Calendar sync |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update |

**Constraints:** UNIQUE(teacher_id, student_id, lesson_teacher_number)

### lesson_songs

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `lesson_id` | uuid | FK → lessons.id |
| `song_id` | uuid | FK → songs.id |
| `status` | lesson_song_status | to_learn/started/remembered/with_author/mastered |
| `notes` | text | Song-specific notes |
| `order_position` | integer | Display order |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update |

### assignments

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles.id (assigned to) |
| `assigned_by` | uuid | FK → profiles.id (teacher) |
| `lesson_id` | uuid | FK → lessons.id (optional) |
| `song_id` | uuid | FK → songs.id (optional) |
| `title` | text | Assignment title |
| `description` | text | Detailed instructions |
| `status` | assignment_status | not_started/in_progress/completed/overdue |
| `due_date` | date | Due date |
| `priority` | text | LOW/MEDIUM/HIGH/URGENT |
| `deleted_at` | timestamptz | Soft delete |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update |

---

## 📝 Enums

### user_role
```sql
'admin', 'teacher', 'student'
```

### lesson_status
```sql
'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'
```

### lesson_song_status
```sql
'to_learn', 'started', 'remembered', 'with_author', 'mastered'
```

### assignment_status
```sql
'not_started', 'in_progress', 'completed', 'overdue', 'cancelled'
```

### difficulty_level
```sql
'beginner', 'intermediate', 'advanced'
```

### music_key
```sql
'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
'Cm', 'C#m', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bbm', 'Bm'
```

---

## 📜 History Tracking

Changes are automatically tracked via database triggers.

### assignment_history

Tracks: created, status_changed, updated, deleted

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `assignment_id` | uuid | FK → assignments.id |
| `changed_by` | uuid | User who made change |
| `change_type` | text | created/status_changed/updated/deleted |
| `previous_data` | jsonb | Snapshot before change |
| `new_data` | jsonb | Snapshot after change |
| `changed_at` | timestamptz | When change occurred |
| `notes` | text | Optional notes |

### lesson_history

Tracks: created, rescheduled, status_changed, updated, cancelled, completed

Similar structure to assignment_history.

### song_status_history

Tracks student progress through song statuses.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `student_id` | uuid | FK → profiles.id |
| `song_id` | uuid | FK → songs.id |
| `previous_status` | lesson_song_status | Status before |
| `new_status` | lesson_song_status | Status after |
| `changed_at` | timestamptz | When change occurred |
| `notes` | text | Optional notes |

---

## 🔧 Common Operations

### Regenerate TypeScript Types

```bash
npx supabase gen types typescript --local > database.types.ts
```

### Reset Database

```bash
npx supabase db reset
```

### Apply Migrations

```bash
npx supabase db push
```

### Check Status

```bash
npx supabase status
```

---

## 📊 Song Database Health

### Current Statistics

| Metric | Count | % |
|--------|-------|---|
| Total Songs | 132 | 100% |
| With Author | 96 | 72.7% |
| With Spotify | 92 | 69.7% |
| With Cover Image | 92 | 69.7% |
| With Level | 96 | 72.7% |
| With Key | 29 | 22% ❌ |
| With Chords | 14 | 10.6% ❌ |
| With UG Link | 30 | 22.7% |

### Priority Actions

1. **Populate KEY field** - Only 22% have musical key
2. **Populate CHORDS field** - Only 10.6% have chord progressions
3. **Add Ultimate Guitar links** - Only 22.7% have links
4. **Complete Spotify matching** - 40 songs need matching

---

## ⚠️ Known Issues

### TypeScript Types

Two type files exist with discrepancies:
- `/database.types.ts` - Auto-generated, up-to-date
- `/types/database.types.ts` - Legacy, outdated

**Action:** Use root `database.types.ts` only.

### Missing Tables (Code References)

These tables are queried but don't exist in schema:
- `user_favorites` - Create migration or remove feature
- `lesson_templates` - Create migration or remove feature
- `teacher_availability` - Create migration or remove feature

### Soft Delete Not Used

`deleted_at` column exists for lessons/assignments but code uses hard delete.

**Action:** Update API handlers to use soft delete.

### Full-Text Search Not Used

`search_vector` column exists but queries use ILIKE.

**Action:** Update song search to use:
```typescript
dbQuery.textSearch('search_vector', search, { type: 'websearch' });
```

---

## 🗂️ Migration Files

Migrations are in `supabase/migrations/`:

| Migration | Purpose |
|-----------|---------|
| `*_create_profiles_table.sql` | Core profiles table |
| `*_create_songs_table.sql` | Song library |
| `*_create_lessons_table.sql` | Lesson management |
| `*_create_assignments_table.sql` | Assignment system |
| `*_create_history_tables.sql` | History tracking |
| `*_create_history_triggers.sql` | Automatic tracking |
| `*_add_soft_delete.sql` | Soft delete columns |
| `*_add_search_vector.sql` | Full-text search |

Total: 58 migration files (consider consolidation)

---

## 🔐 Row Level Security

All tables have RLS enabled with policies for:

- **Select**: Users see own data or data shared with them
- **Insert**: Admin/Teachers can create
- **Update**: Admin/Teachers can update (own students only for teachers)
- **Delete**: Admin/Teachers can delete

### Example Policy

```sql
CREATE POLICY "Teachers can read all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')
  )
);
```
