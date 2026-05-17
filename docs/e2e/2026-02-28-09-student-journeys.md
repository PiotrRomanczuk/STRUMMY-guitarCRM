# Student Journeys

> Journeys #20-25 | Role: Student | Priority: P0 (Onboarding, Dashboard, Assignments), P1 (Repertoire, Song Request), P2 (SOTW)

---

## Journey 20: Student Onboarding Flow

**Priority**: P0
**Role**: Student (freshly registered)
**Pages**: `/onboarding`
**Existing coverage**: Skipped tests exist (complete-flow.spec.ts)

### Preconditions
- A freshly registered student account that has NOT completed onboarding
- Or the ability to reset onboarding status

### Happy Path

#### Step 1 — Redirect to onboarding
1. Log in as the fresh student
2. **Expect**: Automatic redirect to `/onboarding` (not `/dashboard`)
3. **Expect**: Welcome message / heading
4. **Expect**: Multi-step form (3 steps visible via progress indicator)

#### Step 2 — Step 1: Role & Goals
1. **Expect**: Goal selection options (e.g., "Learn a specific song", "Improve technique", "Play for fun")
2. Select 1-2 goals by clicking/toggling
3. Click "Next"
4. **Expect**: Progress indicator advances to step 2

#### Step 3 — Step 2: Skill Level
1. **Expect**: Skill level options (beginner, intermediate, advanced)
2. Select "Beginner"
3. **Expect**: Learning style options (visual, audio, reading, hands-on)
4. Select learning style(s)
5. Click "Next"
6. **Expect**: Progress indicator advances to step 3

#### Step 4 — Step 3: Preferences
1. **Expect**: Instrument preference (acoustic, electric, classical, bass)
2. Select instrument(s)
3. **Expect**: Any AI personalization badge/indicator
4. Click "Complete" / "Finish"
5. **Expect**: Loading state while saving
6. **Expect**: Redirect to `/dashboard`

#### Step 5 — Verify onboarding data saved
1. On dashboard, check for personalized welcome or recommendations
2. **Expect**: Onboarding preferences reflected (e.g., skill level shown, or tailored content)
3. Navigate away and back to `/onboarding`
4. **Expect**: Redirect to `/dashboard` (can't redo onboarding)

### Edge Cases

#### E1 — Navigate away mid-onboarding
1. On Step 2, close the browser or navigate to `/dashboard`
2. **Expect**: Redirect back to `/onboarding` (onboarding not yet complete)
3. **Expect**: Progress may or may not be saved (document behavior)

#### E2 — Skip optional fields
1. Proceed through steps clicking "Next" without selecting anything
2. **Expect**: Either validation errors (required fields) or defaults applied

#### E3 — Already onboarded user
1. Log in as a user who has already completed onboarding
2. Navigate to `/onboarding` directly
3. **Expect**: Redirect to `/dashboard`

### Cleanup
- Reset onboarding status in `user_preferences` if needed

---

## Journey 21: Student Dashboard & Navigation

**Priority**: P0
**Role**: Student
**Pages**: `/dashboard`, all sidebar links
**Existing coverage**: Partial (student-full-journey.spec.ts)

### Preconditions
- Logged in as student
- Student has some lessons, songs, and assignments

### Happy Path

#### Step 1 — Dashboard loads
1. Log in as student
2. **Expect**: `/dashboard` loads with student-specific view (NOT admin command center)
3. **Expect**: Stats cards visible (total lessons, songs learning, assignments)
4. **Expect**: Next lesson card (if upcoming lesson exists) with date/time
5. **Expect**: Last lesson summary (if a recent completed lesson exists)
6. **Expect**: Song of the Week widget (if SOTW is set)
7. **Expect**: Activity feed or recent activity section

#### Step 2 — Navigate through sidebar
1. Click "Songs" -> **Expect**: songs list showing ONLY songs assigned to this student
2. Click "Lessons" -> **Expect**: lessons list showing ONLY this student's lessons
3. Click "Assignments" -> **Expect**: assignments list for this student
4. Click "Stats" -> **Expect**: personal statistics page
5. Click "Calendar" -> **Expect**: calendar view
6. Click "Repertoire" -> **Expect**: personal repertoire page
7. Click "Profile" -> **Expect**: profile edit form
8. Click "Settings" -> **Expect**: settings page

#### Step 3 — Verify student-only navigation
1. **Expect**: Sidebar does NOT show: "Users" (full list), "Admin Stats", "Health Monitor", "Logs", "AI", "Skills"
2. **Expect**: No "New Song", "New Lesson" buttons visible anywhere

### Edge Cases

#### E1 — Student with no data
1. Log in as a student with no lessons, songs, or assignments
2. **Expect**: Dashboard shows empty states (not errors)
3. **Expect**: "No upcoming lessons" message
4. **Expect**: "No songs yet" or similar

#### E2 — Mobile navigation
1. View dashboard on mobile viewport (375px)
2. **Expect**: Bottom navigation bar (not sidebar)
3. **Expect**: All sections accessible from mobile nav
4. **Expect**: No horizontal overflow

### Cleanup
- None

---

## Journey 22: Student Repertoire & Self-Rating

**Priority**: P1
**Role**: Student
**Pages**: `/dashboard/repertoire`
**Existing coverage**: None

### Preconditions
- Logged in as student
- Student has songs in their repertoire (assigned via lessons or manually)

### Happy Path

#### Step 1 — View repertoire
1. Navigate to `/dashboard/repertoire`
2. **Expect**: List of songs in personal repertoire
3. **Expect**: Each song shows: title, author, current status, priority, self-rating (if set)
4. **Expect**: Statuses grouped or filterable (to_learn, started, remembered, with_author, mastered)

#### Step 2 — Self-rate a song
1. Find a song in the repertoire
2. Click on the rating control (stars 1-5)
3. Select 4 stars
4. **Expect**: Rating saves (optimistic update or confirmation)
5. **Expect**: `self_rating_updated_at` updates (if visible)
6. Refresh the page
7. **Expect**: Rating persists at 4 stars

#### Step 3 — Change self-rating
1. Change the same song's rating from 4 to 2
2. **Expect**: Rating updates
3. **Expect**: Visual indicator reflects lower confidence

#### Step 4 — View song detail from repertoire
1. Click on a song title in the repertoire
2. **Expect**: Navigate to song detail page
3. **Expect**: Song metadata visible (YouTube, Spotify links, chords, etc.)
4. Click back
5. **Expect**: Return to repertoire

### Edge Cases

#### E1 — Student cannot change song status
1. View a song with status "to_learn"
2. **Expect**: No status change control for students (only teachers update status via Live Mode)
3. **Expect**: Status is display-only

#### E2 — Empty repertoire
1. Student with no songs in repertoire
2. **Expect**: Empty state message ("No songs in your repertoire yet")

### Cleanup
- Reset any changed ratings

---

## Journey 23: Student Song Request

**Priority**: P1
**Role**: Student + Teacher (review)
**Pages**: Song request submission UI (student), Song request review UI (teacher)
**Existing coverage**: None

### Preconditions
- Logged in as student

### Happy Path — Student Submits Request

#### Step 1 — Submit a song request
1. Find the "Request a Song" button/link (from songs page or dashboard)
2. **Expect**: Form with fields: title, artist, URL (optional), notes (optional)
3. Fill in:
   - Title: `E2E Requested Song`
   - Artist: `E2E Artist`
   - URL: `https://youtube.com/watch?v=test`
   - Notes: `I heard this song and want to learn it!`
4. Click "Submit Request"
5. **Expect**: Success message "Song request submitted"
6. **Expect**: Request appears in student's request list with status "pending"

#### Step 2 — View own requests
1. Navigate to song requests list (student view)
2. **Expect**: `E2E Requested Song` visible with status "pending"
3. **Expect**: Student can only see THEIR OWN requests

### Happy Path — Teacher Reviews Request

#### Step 3 — Teacher views pending requests
1. Log out as student, log in as teacher
2. Navigate to song requests management
3. **Expect**: Pending requests list includes `E2E Requested Song`
4. **Expect**: Student name, song title, artist, URL, notes all visible

#### Step 4 — Approve the request
1. Click "Approve" on the request
2. **Expect**: Option to create the song immediately or just approve
3. **Expect**: Request status changes to "approved"
4. **Expect**: If song created, it links to the request

#### Step 5 — Student sees approved status
1. Log in as student
2. Check song requests
3. **Expect**: Request shows "approved" status

### Happy Path — Rejection Flow

#### Step 6 — Teacher rejects a request
1. Log in as teacher
2. On a different pending request, click "Reject"
3. Add review notes: `This song is too advanced for your current level`
4. **Expect**: Request status changes to "rejected"

#### Step 7 — Student sees rejection
1. Log in as student
2. **Expect**: Request shows "rejected" with teacher's notes

### Edge Cases

#### E1 — Duplicate song request
1. Submit a request for a song that already exists in the database
2. **Expect**: Warning about potential duplicate, or allowed with note

#### E2 — Empty required fields
1. Submit with empty title
2. **Expect**: Validation error

### Cleanup
- Delete test song requests

---

## Journey 24: Student Song of the Week Interaction

**Priority**: P2
**Role**: Student
**Pages**: `/dashboard` (SOTW widget)
**Existing coverage**: None

### Preconditions
- Logged in as student
- Admin has set an active Song of the Week

### Happy Path

#### Step 1 — View SOTW on dashboard
1. Navigate to `/dashboard`
2. **Expect**: Song of the Week widget/card visible
3. **Expect**: Song title, author, teacher message displayed
4. **Expect**: Links to YouTube, Spotify, UG (if available on the song)

#### Step 2 — Add SOTW to repertoire
1. Click "Add to My Repertoire" button on the SOTW widget
2. **Expect**: Success message "Song added to your repertoire"
3. **Expect**: Button changes to "Already in Repertoire" (disabled/different state)

#### Step 3 — Verify in repertoire
1. Navigate to `/dashboard/repertoire`
2. **Expect**: SOTW song appears in repertoire with status "to_learn"

#### Step 4 — Try adding again
1. Return to dashboard
2. **Expect**: "Add to Repertoire" button is disabled or shows "Already added"

### Edge Cases

#### E1 — No active SOTW
1. When no SOTW is set (admin deactivated)
2. **Expect**: SOTW widget is hidden or shows "No Song of the Week this week"

#### E2 — SOTW song already in repertoire from lesson
1. If the SOTW song was already assigned via a lesson
2. **Expect**: "Add to Repertoire" shows "Already in Repertoire" from the start

### Cleanup
- Remove SOTW from student's repertoire if needed

---

## Journey 25: Student Assignment Lifecycle

**Priority**: P0
**Role**: Student
**Pages**: `/dashboard/assignments`, `/dashboard/assignments/[id]`
**Existing coverage**: Partial (student-full-journey.spec.ts)

### Preconditions
- Logged in as student
- Teacher has created at least one assignment for this student

### Happy Path

#### Step 1 — View assignments list
1. Navigate to `/dashboard/assignments`
2. **Expect**: Student-specific assignment list (NOT all assignments)
3. **Expect**: Each assignment shows: title, status, due date
4. **Expect**: Status filter available (not_started, in_progress, completed, overdue)

#### Step 2 — View assignment detail
1. Click on an assignment
2. **Expect**: Full detail: title, description, due date, status, linked song (if any)
3. **Expect**: NO edit or delete buttons (student can only update status)
4. **Expect**: Status update controls visible

#### Step 3 — Start working on assignment
1. Click "Start" / "Mark as In Progress" on a "not_started" assignment
2. **Expect**: Status changes to "in_progress"
3. **Expect**: Visual indicator updates (color change, badge)

#### Step 4 — Complete assignment
1. Click "Mark as Complete" / "Complete"
2. **Expect**: Status changes to "completed"
3. **Expect**: Completion timestamp shown (if visible)
4. **Expect**: Assignment may move to "completed" filter section

#### Step 5 — View overdue assignment
1. Find an overdue assignment (if one exists)
2. **Expect**: Overdue indicator/badge clearly visible
3. **Expect**: Still actionable — can mark as "in_progress" or "completed"

### Edge Cases

#### E1 — Cannot revert completed assignment
1. Try to change a "completed" assignment back to "in_progress"
2. **Expect**: Not allowed (completed is terminal state) — document actual behavior

#### E2 — Assignment with linked song
1. View an assignment that has a linked song
2. **Expect**: Song title and link visible on the assignment detail
3. Click the song link
4. **Expect**: Navigate to song detail page

### Cleanup
- Reset assignment statuses to original values

---

## Testing Strategy

> Auto-generated by `/test-journey` on 2026-02-28

### Integration Tests (Jest)
| Test File | Scenarios | Status |
|-----------|-----------|--------|
| `app/actions/__tests__/repertoire.integration.test.ts` | 35 | Passing |
| `app/actions/__tests__/song-of-the-week.integration.test.ts` | 30 | Passing |

### E2E Tests (Playwright)
| Test File | Scenarios | Status |
|-----------|-----------|--------|
| N/A | 0 | All scenarios covered at integration layer |

### Skipped
| Scenario | Reason |
|----------|--------|
| Student Onboarding (Journey 20) | Auth flow; covered by pre-existing auth unit tests |
| Student Dashboard (Journey 21) | UI rendering; deferred to future E2E sprint |
