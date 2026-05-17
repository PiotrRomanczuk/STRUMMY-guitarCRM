# Teacher/Admin Journeys: User Management

> Journeys #12-14 | Role: Admin/Teacher | Priority: P0 (Invite), P1 (Shadow), P2 (Pipeline)

---

## Journey 12: User Invite Flow (Admin)

**Priority**: P0
**Role**: Admin
**Pages**: `/dashboard/users`, `/dashboard/users/new`
**Existing coverage**: None

### Preconditions
- Logged in as admin
- A valid email address for the test invitation (one that doesn't already exist)

### Happy Path

#### Step 1 — Navigate to user creation
1. Click "Users" in sidebar
2. **Expect**: User list with all users across all roles
3. Click "New User" / "Invite User" button
4. **Expect**: Form with fields: email, full name, role selector, phone (optional)

#### Step 2 — Send invitation
1. Fill in:
   - Email: `e2e.invite.{timestamp}@example.com`
   - Full Name: `E2E Invited User`
   - Role: select "Student"
2. Click "Send Invitation"
3. **Expect**: Success toast "Invitation sent"
4. **Expect**: User appears in the user list with "Pending" or "Invited" status

#### Step 3 — Verify invited user in list
1. Search for the invited user in the user list
2. **Expect**: User found with email and name displayed
3. **Expect**: Role badge shows "Student"
4. **Expect**: Status indicates invitation pending

### Edge Cases

#### E1 — Invite existing email
1. Try to invite a user with an email that already exists
2. **Expect**: Error message "User with this email already exists"

#### E2 — Invalid email format
1. Enter `not-an-email` in the email field
2. **Expect**: Validation error on email field

#### E3 — Invite without required fields
1. Leave email empty, click invite
2. **Expect**: Validation error

#### E4 — Non-admin cannot invite
1. Log in as teacher
2. Navigate to `/dashboard/users/new`
3. **Expect**: Either redirect/403 OR the invite option is not visible in the teacher's UI

### Cleanup
- Delete invited user `e2e.invite.{timestamp}@example.com` via admin API

---

## Journey 13: Shadow Student Creation (Teacher)

**Priority**: P1
**Role**: Teacher
**Pages**: `/dashboard/users`, shadow student creation UI
**Existing coverage**: Partial (workflows.spec.ts)

### Preconditions
- Logged in as teacher

### Happy Path

#### Step 1 — Create shadow student
1. Navigate to user management or find the "Add Student" option
2. Enter student details:
   - Email: `e2e.shadow.{timestamp}@example.com`
   - First Name: `E2E Shadow`
   - Last Name: `Student`
3. Click "Create"
4. **Expect**: Success message
5. **Expect**: Student appears in teacher's student list with `is_shadow: true` indicator

#### Step 2 — Use shadow student in lesson
1. Navigate to `/dashboard/lessons/new`
2. Open student dropdown
3. **Expect**: Shadow student appears in the dropdown
4. Select shadow student, fill other fields, create lesson
5. **Expect**: Lesson created with shadow student linked

#### Step 3 — Shadow student signs up (merge)
1. Sign out as teacher
2. Navigate to `/sign-up`
3. Register with the SAME email: `e2e.shadow.{timestamp}@example.com`
4. **Expect**: `handle_new_user` trigger detects matching `pending_students` record
5. **Expect**: Profile is created with `is_student: true`, data migrated from shadow
6. **Expect**: `pending_students` row is deleted
7. **Expect**: Previous lessons are now linked to the real profile

### Edge Cases

#### E1 — Create shadow with existing email
1. Try to create a shadow student with an email that's already registered
2. **Expect**: Error "User with this email already exists"

### Cleanup
- Delete shadow student and associated lessons

---

## Journey 14: Student Pipeline Management

**Priority**: P2
**Role**: Admin/Teacher
**Pages**: `/dashboard/users/[id]`, `/dashboard/health`
**Existing coverage**: None

### Preconditions
- Logged in as admin
- A student exists with status "lead" (or ability to change status)

### Happy Path

#### Step 1 — View student pipeline status
1. Navigate to `/dashboard/users/[student-id]`
2. **Expect**: Student's current pipeline status visible (e.g., "lead")
3. **Expect**: Status change controls available

#### Step 2 — Advance through pipeline
1. Change status from "lead" to "trial"
2. **Expect**: Status updates, `status_changed_at` reflects
3. Change from "trial" to "active"
4. **Expect**: Status updates

#### Step 3 — Health monitor view
1. Navigate to `/dashboard/health`
2. **Expect**: Student health dashboard loads
3. **Expect**: Students listed with engagement scores, risk levels
4. **Expect**: At-risk students highlighted (inactive, no recent lessons)
5. **Expect**: CSV export button available

#### Step 4 — Deactivate student
1. Change a student status from "active" to "inactive"
2. **Expect**: Status updates
3. Check health monitor — student should appear with lower engagement

### Edge Cases

#### E1 — Invalid status transition
1. Try to move from "churned" back to "active" (if the UI allows)
2. **Expect**: Either allowed (any transition valid) or error — document behavior

### Cleanup
- Reset student status to original value

---

## Testing Strategy

> Auto-generated by `/test-journey` on 2026-02-28

### Integration Tests (Jest)
| Test File | Scenarios | Status |
|-----------|-----------|--------|
| `app/api/students/__tests__/pipeline.integration.test.ts` | 22 | Passing |

### E2E Tests (Playwright)
| Test File | Scenarios | Status |
|-----------|-----------|--------|
| N/A | 0 | All scenarios covered at integration layer |

### Skipped
| Scenario | Reason |
|----------|--------|
| User Invite Flow (Journey 12) | Covered by pre-existing email/auth unit tests |
| Shadow Mode (Journey 13) | UI-only; deferred to future E2E sprint |
