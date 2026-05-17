# Cross-Role Journeys

> Journeys #26-28 | Role: Multiple | Priority: P0 (Lifecycle, RBAC), P1 (MFA)

---

## Journey 26: Full User Lifecycle (Invite -> Signup -> Onboarding)

**Priority**: P0
**Role**: Admin (invite) -> Student (signup + onboard)
**Pages**: Admin user creation, sign-up, accept-invitation, onboarding, dashboard
**Existing coverage**: None

### Preconditions
- Logged in as admin

### Happy Path

#### Step 1 — Admin invites student
1. As admin, navigate to `/dashboard/users/new`
2. Enter email: `e2e.lifecycle.{timestamp}@example.com`
3. Enter name: `E2E Lifecycle Student`
4. Select role: Student
5. Click "Send Invitation"
6. **Expect**: Success message
7. **Expect**: Invitation email sent (Supabase magic link)
8. Note the invitation link from Supabase logs or test email inbox

#### Step 2 — Student accepts invitation
1. Open the invitation link (or navigate to `/accept-invitation` with token)
2. **Expect**: Password setup form
3. Set password: `testPassword123!`
4. Confirm password
5. Click "Set Password" / "Accept"
6. **Expect**: Account activated
7. **Expect**: Redirect to sign-in or directly to onboarding

#### Step 3 — Student completes onboarding
1. Log in with the new credentials
2. **Expect**: Redirect to `/onboarding` (not dashboard)
3. Complete all 3 onboarding steps (goals, skill level, preferences)
4. **Expect**: Redirect to `/dashboard`

#### Step 4 — Verify full profile
1. On dashboard, verify personalized content
2. Navigate to `/dashboard/profile`
3. **Expect**: Name matches what admin entered
4. **Expect**: Role is "Student"
5. Navigate to `/dashboard/settings`
6. **Expect**: Default settings applied

#### Step 5 — Admin verifies student in user list
1. Log in as admin
2. Navigate to `/dashboard/users`
3. Search for the new student
4. **Expect**: Student appears with "Active" status
5. Click on student detail
6. **Expect**: Onboarding preferences visible (goals, skill level, etc.)

### Edge Cases

#### E1 — Expired invitation link
1. Wait for invitation to expire (or use an expired token)
2. **Expect**: Error page "Invitation expired"
3. **Expect**: Option to request a new invitation

#### E2 — Signup with mismatched password confirmation
1. On accept-invitation, type different passwords
2. **Expect**: Validation error "Passwords don't match"

### Cleanup
- Delete `e2e.lifecycle.{timestamp}@example.com` user and associated data

---

## Journey 27: MFA Enrollment & Login

**Priority**: P1
**Role**: Any authenticated user (test with teacher)
**Pages**: Settings/Security page, sign-in page
**Existing coverage**: None

### Preconditions
- Logged in as teacher
- MFA NOT yet enrolled
- Test needs a TOTP library (e.g., `otplib`) to generate codes from the secret

### Happy Path

#### Step 1 — Navigate to MFA settings
1. Navigate to security settings (within `/dashboard/settings` or profile)
2. **Expect**: "Enable Two-Factor Authentication" option visible
3. **Expect**: Current status: "Not enabled"

#### Step 2 — Enroll MFA
1. Click "Enable 2FA" / "Set up MFA"
2. **Expect**: QR code displayed (TOTP setup)
3. **Expect**: Secret key displayed (text, for manual entry)
4. Copy the secret key
5. Use TOTP library to generate a 6-digit code from the secret
6. Enter the code in the verification input
7. Click "Verify" / "Activate"
8. **Expect**: Success message "Two-factor authentication enabled"
9. **Expect**: Recovery codes displayed (save these!)
10. **Expect**: MFA status now shows "Enabled"

#### Step 3 — Sign out and sign in with MFA
1. Sign out
2. Navigate to `/sign-in`
3. Enter email and password
4. Click "Sign In"
5. **Expect**: MFA challenge screen appears (instead of going straight to dashboard)
6. **Expect**: Input for 6-digit TOTP code
7. Generate a fresh code with the same secret
8. Enter the code
9. Click "Verify"
10. **Expect**: Redirect to `/dashboard` (successful login with MFA)

#### Step 4 — Failed MFA attempt
1. Sign out again
2. Sign in with email + password
3. On MFA challenge, enter `000000` (wrong code)
4. **Expect**: Error "Invalid code"
5. **Expect**: Can retry (not locked out after 1 failure)

#### Step 5 — Unenroll MFA
1. Navigate back to security settings
2. Click "Disable 2FA" / "Remove MFA"
3. **Expect**: Confirmation prompt
4. May require current TOTP code for unenrollment
5. Enter valid code, confirm
6. **Expect**: MFA disabled
7. Sign out and sign in
8. **Expect**: No MFA challenge (straight to dashboard)

### Edge Cases

#### E1 — Expired TOTP code
1. Generate a code, wait 31+ seconds (TOTP window passes)
2. Enter the expired code
3. **Expect**: Error "Invalid or expired code"

#### E2 — Multiple failed attempts
1. Enter wrong codes 5 times
2. **Expect**: Temporary lockout or rate limiting message

### Cleanup
- Unenroll MFA from test account

---

## Journey 28: Role-Based Access Control Boundaries

**Priority**: P0
**Role**: Admin, Teacher, Student (all three, testing boundaries)
**Pages**: All restricted pages
**Existing coverage**: Partial (workflows.spec.ts)

### Admin Exclusive Pages

#### Step 1 — Admin can access admin-only pages
1. Log in as admin
2. Navigate to each admin page:
   - `/dashboard/admin/debug` -> **Expect**: loads
   - `/dashboard/admin/notifications` -> **Expect**: loads
   - `/dashboard/users/new` (invite) -> **Expect**: loads
3. **Expect**: All pages accessible without errors

#### Step 2 — Teacher CANNOT access admin-only pages
1. Log in as teacher
2. Navigate to `/dashboard/admin/debug`
3. **Expect**: Redirect to dashboard OR 403/access denied
4. Navigate to `/dashboard/admin/notifications`
5. **Expect**: Redirect or 403

#### Step 3 — Student CANNOT access admin/teacher pages
1. Log in as student
2. Try each restricted URL by direct navigation:
   - `/dashboard/users` -> **Expect**: shows only own profile, no user list
   - `/dashboard/admin/stats/songs` -> **Expect**: redirect or 403
   - `/dashboard/admin/stats/lessons` -> **Expect**: redirect or 403
   - `/dashboard/health` -> **Expect**: redirect or 403
   - `/dashboard/logs` -> **Expect**: redirect or 403
   - `/dashboard/lessons/new` -> **Expect**: redirect or no create form
   - `/dashboard/songs/new` -> **Expect**: redirect or no create form
   - `/dashboard/assignments/new` -> **Expect**: redirect or no create form
   - `/dashboard/ai` -> **Expect**: redirect or 403

### Data Isolation

#### Step 4 — Teacher can only see own students
1. Log in as Teacher A
2. Navigate to `/dashboard/users`
3. **Expect**: Only Teacher A's students listed
4. **Expect**: Teacher B's students NOT visible

#### Step 5 — Student can only see own data
1. Log in as Student A
2. Navigate to `/dashboard/lessons`
3. **Expect**: Only Student A's lessons
4. Navigate to `/dashboard/assignments`
5. **Expect**: Only Student A's assignments
6. Navigate to `/dashboard/songs`
7. **Expect**: Only songs from Student A's lessons/repertoire

#### Step 6 — Direct URL access to other user's data
1. As Student A, try navigating to a lesson that belongs to Student B:
   - `/dashboard/lessons/[student-b-lesson-id]`
2. **Expect**: 403/404 or redirect (RLS blocks access)
3. Try `/dashboard/users/[other-student-id]`
4. **Expect**: 403/404 or redirect

### CRUD Permission Boundaries

#### Step 7 — Student cannot create content
1. As student, check that "New" buttons are NOT visible on:
   - Songs list (no "New Song")
   - Lessons list (no "New Lesson")
   - Assignments list (no "New Assignment")
2. As student, try POSTing directly to `/api/lessons` (via fetch in console or test)
3. **Expect**: 403 Forbidden

#### Step 8 — Student cannot delete content
1. As student, view a song detail page
2. **Expect**: No "Delete" button
3. View a lesson detail page
4. **Expect**: No "Delete" button

### Edge Cases

#### E1 — Unauthenticated access to dashboard
1. Clear all cookies/session
2. Navigate to `/dashboard`
3. **Expect**: Redirect to `/sign-in`
4. Navigate to `/dashboard/songs`
5. **Expect**: Redirect to `/sign-in`

#### E2 — API routes without auth
1. Make unauthenticated request to `/api/lessons`
2. **Expect**: 401 Unauthorized
3. Make unauthenticated request to `/api/song`
4. **Expect**: 401 Unauthorized

### Cleanup
- None needed

---

## Testing Strategy

> Auto-generated by `/test-journey` on 2026-02-28

### Integration Tests (Jest)
| Test File | Scenarios | Status |
|-----------|-----------|--------|
| `lib/__tests__/role-access-control.integration.test.ts` | 12 | Passing (pre-existing) |
| `app/api/__tests__/teacher-isolation.integration.test.ts` | 8 | Passing (pre-existing) |
| `app/api/__tests__/multi-role-visibility.integration.test.ts` | 6 | Passing (pre-existing) |

### E2E Tests (Playwright)
| Test File | Scenarios | Status |
|-----------|-----------|--------|
| N/A | 0 | All scenarios covered at integration layer |

### Skipped
| Scenario | Reason |
|----------|--------|
| MFA Setup (Journey 27) | Auth flow; requires real Supabase auth stack |
