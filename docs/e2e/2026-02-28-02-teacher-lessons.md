# Teacher Journeys: Lessons

> Journeys #3-4 | Role: Teacher | Priority: P0

## Test Strategy

**Split approach**: Bulk coverage as integration tests (Vitest, fast, mocked Supabase). 3 thin E2E tests (Playwright) for flows that need a real browser.

| Layer | Count | Status | What it covers |
|-------|-------|--------|----------------|
| Integration | 21 tests | **Done** | CRUD handlers, validation, access control, utils, recap email |
| E2E | 3 tests | Planned | (1) Create lesson happy path, (2) Live Mode song status, (3) Delete with confirm |

**AI notes coverage**: Excluded — already covered in `lesson-notes-ai.spec.ts` (5 tests).
**Out of scope**: Lesson import, Google Calendar integration, pagination.

---

## Part A: Integration Tests — IMPLEMENTED

**File**: `app/api/lessons/__tests__/route.integration.test.ts`
**Run**: `npm run test:integration -- --testPathPatterns="lessons/__tests__/route.integration"`
**Pattern**: Call handlers directly with mocked Supabase via `createMockQueryBuilder` / `createMockAuthContext` from `@/lib/testing/integration-helpers`.
**Status**: 21 tests, all passing.

### A1 — Lesson Creation (5 tests)

#### T1: Teacher creates lesson with valid data — 201 ✅
```
- Call createLessonHandler with valid input (student_id, teacher_id, scheduled_at, title, notes)
- Mock: profiles (teacher then student), lessons insert
- Assert: status 201, lesson returned, insert called
```

#### T2: Missing student_id returns 400 ✅
```
- Call createLessonHandler with empty student_id
- Assert: status 400, error matches /student/i
```

#### T3: Missing teacher_id returns 400 ✅
```
- Call createLessonHandler with empty teacher_id
- Assert: status 400, error matches /teacher/i
```

#### T4: Missing scheduled_at returns 400 ✅
```
- Call createLessonHandler with empty scheduled_at
- Assert: status 400, error matches /scheduled/i
```

#### T5: Student cannot create lesson — 403 ✅
```
- Call createLessonHandler with student auth context
- Assert: status 403, error matches /only admins and teachers/i
```

### A2 — Lesson Update (4 tests)

#### T6: Teacher updates lesson — 200 ✅
```
- Call updateLessonHandler with changed notes + status
- Assert: status 200, lesson returned, update called
```

#### T7: handleLessonSongsUpdate inserts with status to_learn ✅
```
- Call handleLessonSongsUpdate with existing + new songIds
- Assert: insert called with records containing status: 'to_learn'
```

#### T8: RESCHEDULED status rejected by Zod ✅
```
- Parse { status: 'RESCHEDULED' } through LessonInputSchema.safeParse
- Assert: success is false, status field error exists
```

#### T9: LessonFormActions renders correct button labels ✅
```
- Render <LessonFormActions isEditing={true} /> → assert "Save Changes"
- Render <LessonFormActions isEditing={false} /> → assert "Create Lesson"
```

### A3 — Lesson Deletion (3 tests)

#### T10: Soft delete sets deleted_at (not hard delete) ✅
```
- Call deleteLessonHandler with teacher auth
- Assert: status 200, update called with { deleted_at: expect.any(String) }
- Assert: delete NOT called
```

#### T11: Student cannot delete — 403 ✅
```
- Call deleteLessonHandler with student auth context
- Assert: status 403
```

#### T12: Unauthenticated returns 401 ✅
```
- Call deleteLessonHandler with null user
- Assert: status 401
```

### A4 — Access Control (3 tests)

#### T13: Teacher scoped to own lessons via student lookup ✅
```
- Call getLessonsHandler with teacher auth
- Assert: .in() called (student_id scoping)
```

#### T14: Admin sees all lessons (no teacher_id filter) ✅
```
- Call getLessonsHandler with admin auth
- Assert: no .in('student_id', ...) call made
```

#### T15: Unauthenticated list returns 401 ✅
```
- Call getLessonsHandler with null user
- Assert: status 401
```

### A5 — Utils (4 tests)

#### T16: prepareLessonForDb merges date+time into scheduled_at ✅
```
- Call with { date: '2026-03-01', start_time: '15:00' }
- Assert: scheduled_at is valid ISO string
- Assert: date, start_time, song_ids, lesson_teacher_number removed
```

#### T17: prepareLessonForDb strips undefined values ✅
```
- Call with { student_id: 'x', title: undefined }
- Assert: student_id present, 'title' key not in result
```

#### T18: transformLessonData splits scheduled_at into date+start_time ✅
```
- Call with { scheduled_at: '2026-03-01T15:00:00.000Z' }
- Assert: date matches YYYY-MM-DD, start_time matches HH:MM
```

#### T19: transformLessonData preserves existing date/start_time ✅
```
- Call with scheduled_at + date + start_time all set
- Assert: original date/start_time values preserved (not overwritten)
```

### A6 — Recap Email (2 tests)

#### T20: sendLessonSummaryEmail sends and cancels queue ✅
```
- Mock Supabase to return lesson with joins (student, teacher, lesson_songs)
- Assert: sendNotification called with type: 'lesson_recap'
- Assert: cancelPendingQueueEntries called with ('lesson', lessonId, 'lesson_recap')
```

#### T21: sendLessonSummaryEmail returns error for missing lesson ✅
```
- Mock Supabase to return null
- Assert: { success: false }, error matches /not found/i
```

---

## Part B: E2E Tests (Playwright)

**File**: Extend `tests/e2e/teacher-full-journey.spec.ts`
**Run**: `npx playwright test teacher-full-journey`

### E2E Test 1: Create Lesson Happy Path

```
Login as teacher
→ Navigate to /dashboard/lessons
→ Assert "Create New Lesson" button visible (data-testid="create-lesson-button")
→ Click it
→ Assert /dashboard/lessons/new loads
→ Fill teacher dropdown (data-testid="lesson-teacher_id")
→ Fill student dropdown (data-testid="lesson-student_id")
→ Fill scheduled_at (data-testid="lesson-scheduled-at") with tomorrow 15:00
→ Fill title (data-testid="lesson-title"): "E2E Lesson {timestamp}"
→ Fill notes (data-testid="lesson-notes"): "E2E test notes"
→ Select 2 songs via SongSelect checkboxes
→ Click "Create Lesson" (data-testid="lesson-submit")
→ Assert redirect to /dashboard/lessons?created=true
→ Assert success toast visible
→ Find created lesson in list, click to open detail
→ Assert title, student, notes, songs visible
→ Assert "Lesson #" field shows a number (lesson_teacher_number)
→ Assert Assignments section visible (empty)
→ Click Edit (data-testid="lesson-edit-button")
→ Assert form pre-filled
→ Assert submit button says "Save Changes" (not "Create Lesson")
→ Change notes to "UPDATED"
→ Click "Save Changes"
→ Assert redirect to detail page
→ Assert updated notes visible
```

### E2E Test 2: Live Mode Song Status Flow

```
Login as teacher
→ Navigate to a pre-seeded lesson with 3 songs (status SCHEDULED)
→ Click "Start Lesson" (data-testid="lesson-live-button")
→ Assert /dashboard/lessons/[id]/live loads
→ Assert student name visible in top bar
→ Assert 3 song cards visible, all showing "To Learn"
→ Click "started" on Song 1's StatusStepper
→ Assert Song 1 badge updates to "Started" (blue)
→ Click "mastered" on Song 1 (skip intermediate steps)
→ Assert Song 1 badge updates to "Mastered" (green)
→ Click "mastered" directly on Song 2 (skip from to_learn)
→ Assert Song 2 badge updates to "Mastered"
→ Type notes in LiveLessonNotes area
→ Wait 2500ms (debounce is 2000ms)
→ Assert "Notes saved" toast appears
→ Click "End Lesson" in top bar
→ Assert navigates to detail page (no status change — Live Mode doesn't complete lessons)
```

### E2E Test 3: Delete Lesson with Confirm

```
Login as teacher
→ Navigate to a test lesson's detail page
→ Click "Delete" (data-testid="lesson-delete-button")
→ Accept browser confirm() dialog
→ Assert redirect to /dashboard/lessons
→ Assert deleted lesson no longer in list
```

---

## Known Gaps (not yet tested or implemented)

| Gap | Status | Notes |
|-----|--------|-------|
| Student scoping in lesson form | **Not implemented** | Form shows ALL students. List page correctly scopes. Needs `useLessonForm` to filter by teacher. |
| Date range filter | **Not implemented** | Only text search, status, student, teacher (admin) filters exist. |
| Duplicate lesson detection | **Not implemented** | No scheduling conflict check. |
| Teacher auto-fill in form | **Not implemented** | Teacher must manually select themselves. |
| "Complete Lesson" in Live Mode | **Not implemented** | Live Mode only updates songs/notes. Status change via edit page. |
| Recap email confirmation | **Not implemented** | SendEmailButton fires immediately, no confirm dialog. |
| RESCHEDULED status in form | **Tested** (T8) | Exists in DB enum but rejected by Zod schema. Not in form dropdown. |
| updateLessonSongStatus | **Not tested** | Server action in `actions.ts` — could add integration test. |
| Repertoire forward-only sync | **Not tested** | DB trigger `fn_sync_lesson_song_to_repertoire` — needs local Supabase. |
