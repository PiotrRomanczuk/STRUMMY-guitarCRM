# BMS-44 Fix Verification Checklist

## Pre-Deployment Verification

### 1. Code Review
- [x] Migration 030 syntax is valid SQL
- [x] Migration 031 updates trigger function correctly
- [x] `prepareLessonForDb()` filters all auto-generated fields
- [x] `allowedUpdateFields` only includes updateable columns
- [x] E2E test skip removed and tests re-enabled
- [x] Documentation updated (2026-02-12-PLAYWRIGHT-MIGRATION.md)

### 2. Database Schema
- [ ] Verify migrations apply without errors
- [ ] Confirm column renamed: `lesson_number` → `lesson_teacher_number`
- [ ] Verify constraint renamed: `uq_lessons_number` → `uq_lessons_teacher_number`
- [ ] Check trigger function uses new column name
- [ ] Test trigger auto-sets lesson_teacher_number on INSERT

### 3. Application Testing
- [ ] Lesson CREATE works (POST /api/lessons)
- [ ] Lesson UPDATE works (PUT /api/lessons/:id)
- [ ] Lesson DELETE works (DELETE /api/lessons/:id)
- [ ] Lesson GET single works (GET /api/lessons/:id)
- [ ] Lesson GET list works (GET /api/lessons)

### 4. E2E Testing
- [ ] Run full lesson CRUD test suite
- [ ] Verify test "3. EDIT: should update the lesson" passes
- [ ] Verify test "4. VERIFY EDIT: should find edited lesson in list" passes
- [ ] Check no PostgREST errors in console

### 5. Manual Testing Scenarios

#### Scenario 1: Basic Lesson Edit
1. Login as teacher
2. Navigate to /dashboard/lessons
3. Click on any lesson
4. Click "Edit"
5. Change title and notes
6. Save
7. **Expected**: Changes saved successfully, no errors

#### Scenario 2: Partial Update
1. Edit a lesson
2. Only change the title (leave other fields)
3. Save
4. **Expected**: Only title updated, other fields unchanged

#### Scenario 3: Status Change
1. Edit a lesson
2. Change status from SCHEDULED to COMPLETED
3. Save
4. **Expected**: Status updated, email sent to student

#### Scenario 4: Date Change
1. Edit a lesson
2. Change scheduled_at date/time
3. Save
4. **Expected**: Google Calendar event updated (if integration enabled)

### 6. Error Handling
- [ ] Invalid lesson ID returns 404
- [ ] Non-teacher/admin returns 403
- [ ] Invalid data returns 400 with validation errors
- [ ] Database errors return 500 with message

### 7. Performance Checks
- [ ] No N+1 queries in lesson list
- [ ] Update operation completes in <200ms
- [ ] No unnecessary fields in UPDATE payload

## Post-Deployment Monitoring

### Metrics to Watch
- [ ] Lesson update error rate (should be 0%)
- [ ] API response times for PUT /api/lessons/:id
- [ ] Database query performance
- [ ] PostgREST error logs

### Rollback Triggers
If any of these occur, consider rollback:
- Lesson updates failing with errors
- Data integrity issues (incorrect lesson numbers)
- Performance degradation
- Constraint violations

### Rollback Procedure
```sql
-- 1. Revert column rename
ALTER TABLE lessons RENAME COLUMN lesson_teacher_number TO lesson_number;

-- 2. Revert constraint
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS uq_lessons_teacher_number;
ALTER TABLE lessons ADD CONSTRAINT uq_lessons_number
  UNIQUE (teacher_id, student_id, lesson_number);

-- 3. Revert trigger function
CREATE OR REPLACE FUNCTION set_lesson_number()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
BEGIN
    SELECT COALESCE(MAX(lesson_number), 0) + 1 INTO next_number
    FROM lessons
    WHERE teacher_id = NEW.teacher_id
    AND student_id = NEW.student_id;

    NEW.lesson_number := next_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Then revert code changes:
```bash
git revert <commit-hash>
git push
```

## Success Criteria

✅ All E2E tests passing
✅ Zero PostgREST errors in logs
✅ Lesson CRUD operations working smoothly
✅ No data integrity issues
✅ Performance metrics within acceptable range

## Notes
- Test on staging environment first
- Monitor logs closely for first 24 hours after deployment
- Notify QA team to run regression tests
- Update Linear issue BMS-44 with results
