# Strummy E2E Test Coverage Analysis & 100% Coverage Plan

**Generated**: 2026-02-02
**Purpose**: Comprehensive E2E testing strategy to achieve 100% coverage
**Current Framework**: Cypress (33 test files)
**Status**: ~40% coverage of critical paths

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [⚠️ CRITICAL: Implementation Verification Required](#️-critical-implementation-verification-required)
3. [Current Test Coverage](#current-test-coverage)
4. [Application Inventory](#application-inventory)
5. [Critical User Flows](#critical-user-flows)
6. [API Coverage Analysis](#api-coverage-analysis)
7. [Feature Coverage Analysis](#feature-coverage-analysis)
8. [Security & Auth Analysis](#security--auth-analysis)
9. [Coverage Gaps](#coverage-gaps)
10. [100% Coverage Plan](#100-coverage-plan)
11. [Implementation Roadmap](#implementation-roadmap)

---

## Executive Summary

### Current State
- **Total Test Files**: 33 Cypress E2E tests
- **Coverage Estimate**: ~40% of critical user flows
- **Strengths**: Strong CRUD coverage, excellent RBAC testing, good smoke tests
- **Weaknesses**: Missing integration features (Google Calendar, Spotify), incomplete user workflows (sign-up, onboarding, favorites)

### Key Findings
- ✅ **Excellent**: Admin/Teacher CRUD operations (songs, lessons, assignments, users)
- ✅ **Good**: Student access control and isolation testing
- ✅ **Good**: Role-based dashboard testing
- ⚠️ **Partial**: Integration features (Spotify matching UI exists but flow incomplete)
- ❌ **Missing**: User onboarding, sign-up flow, favorites, settings, teacher isolation
- 🔴 **Critical Security Gap**: `inviteUser()` server action has no authorization check

### To Achieve 100% Coverage
**Additional Tests Needed**: ~42 new test files
**Estimated Effort**: 3-4 weeks
**Priority Areas**: Security vulnerabilities, integration features, user workflows

---

## ⚠️ CRITICAL: Implementation Verification Required

### ALWAYS Verify Implementation Before Writing Tests

**IMPORTANT**: This document identifies features and workflows that SHOULD be tested for 100% coverage. However, **NOT ALL features listed may be fully implemented or even exist yet**.

**Before writing ANY test**:

1. ✅ **Check if the feature exists** - Verify the page/component/API route actually exists in the codebase
2. ✅ **Check if the feature is complete** - Implementation may be partial, stubbed, or work-in-progress
3. ✅ **Check the current state** - Read the actual implementation code to understand what it does
4. ✅ **Test what exists, not what's planned** - Only write tests for actually implemented features
5. ✅ **Document incomplete features** - Flag features that are mentioned in this doc but don't exist yet

### How to Verify Implementation

```bash
# Example: Before writing song favorites test

# 1. Check if the component exists
find . -name "*favorite*" -o -name "*Favorite*"

# 2. Check if the API endpoint exists
ls app/api/song/favorites/

# 3. Read the implementation
cat app/api/song/favorites/route.ts

# 4. Verify the UI exists
grep -r "favorite" components/songs/

# 5. Only then write the test
```

### Features That May Not Be Fully Implemented

Based on the analysis, these features are **mentioned in code or docs but may be incomplete**:

**High Risk (Likely Incomplete)**:
- ⚠️ **Song Favorites** - API exists, UI may be incomplete
- ⚠️ **Assignment Templates** - Routes exist, full CRUD may be incomplete
- ⚠️ **Practice Timer** - Component may exist, integration incomplete
- ⚠️ **Lesson Templates** - Mentioned but implementation uncertain
- ⚠️ **AI Assistant** - Page exists, functionality may be partial
- ⚠️ **Calendar View** - Page exists, rendering may be incomplete
- ⚠️ **Skills Management** - Page exists, feature may be stubbed

**Medium Risk (Check Implementation)**:
- ⚠️ **Email Notifications** - May be planned but not implemented
- ⚠️ **Webhook Handling** - Routes exist, handler completion uncertain
- ⚠️ **Bulk Operations** - Some endpoints exist, UI may be missing
- ⚠️ **Teacher Dashboard** - Currently shows admin view, dedicated view may not exist
- ⚠️ **Parent Accounts** - Mentioned in analysis, may not be implemented

**Low Risk (Likely Complete)**:
- ✅ **Song CRUD** - Fully implemented
- ✅ **Lesson CRUD** - Fully implemented
- ✅ **Assignment CRUD** - Fully implemented
- ✅ **User CRUD** - Fully implemented
- ✅ **Authentication** - Core flows implemented
- ✅ **RBAC** - Access control implemented
- ✅ **Google Calendar OAuth** - Implementation exists

### Test Writing Protocol

**DO**:
- ✅ Verify component/page file exists before writing test
- ✅ Read the implementation to understand actual behavior
- ✅ Test current state, not desired state
- ✅ Mark tests as `.skip()` with TODO if feature incomplete
- ✅ Document missing features separately from bugs

**DON'T**:
- ❌ Write tests based solely on this document without verification
- ❌ Assume features exist because they're listed here
- ❌ Test features that are planned but not implemented
- ❌ Write tests that will always fail due to missing implementation

### Example: Verifying Song Favorites

```typescript
// ❌ WRONG: Write test without checking implementation
describe('Song Favorites', () => {
  it('should add song to favorites', () => {
    cy.visit('/dashboard/songs/123');
    cy.get('[data-testid="favorite-button"]').click(); // May not exist!
  });
});

// ✅ CORRECT: Check implementation first
/*
1. Check if API exists:
   $ ls app/api/song/favorites/
   ✅ route.ts exists

2. Read the API:
   $ cat app/api/song/favorites/route.ts
   ✅ POST and DELETE handlers implemented

3. Check if UI exists:
   $ grep -r "favorite" components/songs/
   ❌ No favorite button found!

4. Decision: API exists but UI incomplete
   → Skip UI test, only test API directly
   → Add TODO for UI test when implemented
*/

describe('Song Favorites', () => {
  it('should add song to favorites via API', () => {
    cy.request({
      method: 'POST',
      url: '/api/song/favorites',
      body: { song_id: testSongId }
    }).should('have.property', 'status', 200);
  });

  it.skip('should add song to favorites via UI', () => {
    // TODO: Implement this test when UI is complete
    // Currently no favorite button exists in components/songs/
  });
});
```

---

## Current Test Coverage

### Test Files Inventory (33 files)

#### Smoke Tests (2 files)
- `smoke/critical-path.cy.ts` - App loading, auth, navigation, API health
- `smoke/api-endpoints.cy.ts` - REST API CRUD validation

#### Authentication (3 files)
- `auth-test.cy.ts` - Sign-in success/failure
- `integration/auth-password-reset.cy.ts` - Complete password reset flow
- `integration/auth-role-access.cy.ts` - RBAC enforcement (admin/teacher/student)

#### Admin Dashboard (5 files)
- `admin/admin-navigation.cy.ts` - Dashboard navigation
- `admin/admin-dashboard-stats.cy.ts` - Metrics and stats display
- `admin/admin-health-monitoring.cy.ts` - Student health tracking
- `profile-user-management.cy.ts` - Profile editing, role assignment
- `student/student-dashboard.cy.ts` - Student view verification

#### Songs (4 files)
- `admin/admin-song-crud.cy.ts` - Song CRUD operations
- `admin/admin-songs-workflow.cy.ts` - Create → Edit → Delete workflow
- `admin/admin-songs-enhanced.cy.ts` - Search, filter, media, export
- `admin/admin-spotify-integration.cy.ts` - Spotify match review UI

#### Lessons (4 files)
- `admin/admin-lessons-enhanced.cy.ts` - Filters, calendar, history
- `admin/admin-lessons-workflow.cy.ts` - Create → Edit → Delete workflow
- `integration/lesson-search-filter.cy.ts` - Search and filter functionality
- `student/student-lessons.cy.ts` - Student lesson viewing

#### Assignments (5 files)
- `admin/admin-assignments-crud.cy.ts` - Complete CRUD with filters
- `admin/admin-assignments-workflow.cy.ts` - Create → Edit → Delete workflow
- `features/student-assignment-completion.cy.ts` - Student completion flow
- `student/student-assignments.cy.ts` - Student view and filtering
- `integration/workflows.cy.ts` - Multi-entity integration

#### Users (3 files)
- `admin/admin-users-crud.cy.ts` - User CRUD with search/filters
- `admin/admin-users-workflow.cy.ts` - Shadow user creation workflow
- `integration/concurrent-users.cy.ts` - Multi-user data isolation

#### Student Experience (4 files)
- `student-learning-journey.cy.ts` - Complete student journey
- `student/student-profile.cy.ts` - Profile management
- `student/student-songs.cy.ts` - Song viewing and progress
- `student/student-access-control.cy.ts` - Access restriction enforcement

#### Integration & Data (3 files)
- `integration/song-search-filter.cy.ts` - Advanced filtering
- `integration/data-relationships.cy.ts` - Relational data integrity
- `error-handling/error-scenarios.cy.ts` - Error handling edge cases

### Coverage Summary by Feature

| Feature | Coverage | Files | Status |
|---------|----------|-------|--------|
| Songs (Admin) | 85% | 4 | ✅ Excellent |
| Lessons (Admin) | 75% | 4 | ✅ Good |
| Assignments (Admin) | 70% | 5 | ✅ Good |
| Users (Admin) | 80% | 3 | ✅ Good |
| Student Dashboard | 70% | 4 | ✅ Good |
| Authentication | 60% | 3 | ⚠️ Partial |
| RBAC | 75% | 3 | ✅ Good |
| Integration Features | 20% | 1 | ❌ Poor |
| Settings & Config | 10% | 0 | ❌ Minimal |
| User Workflows | 30% | 1 | ❌ Poor |

---

## Application Inventory

### Total Pages: 44 page.tsx files
### Total API Routes: 71 route.ts files

### Public Pages (5)

| Route | Purpose | Tested |
|-------|---------|--------|
| `/` | Landing page | ✅ Smoke |
| `/sign-in` | Login | ✅ Yes |
| `/sign-up` | Registration | ❌ No |
| `/forgot-password` | Reset request | ✅ Yes |
| `/reset-password` | Reset form | ⚠️ Partial |

### Protected Dashboard Pages (39)

#### Core Dashboards (3)
- `/dashboard` - Main dashboard (role-aware) ✅ Tested
- `/dashboard/stats` - Student stats ❌ Not tested
- `/dashboard/health` - Student health monitoring ✅ Tested

#### Users Management (4)
- `/dashboard/users` - User list ✅ Tested
- `/dashboard/users/new` - Create user ✅ Tested
- `/dashboard/users/[id]` - User detail ✅ Tested
- `/dashboard/users/[id]/edit` - Edit user ✅ Tested

#### Lessons Management (5)
- `/dashboard/lessons` - Lesson list ✅ Tested
- `/dashboard/lessons/new` - Create lesson ✅ Tested
- `/dashboard/lessons/import` - Google Calendar import ❌ Not tested
- `/dashboard/lessons/[id]` - Lesson detail ✅ Tested
- `/dashboard/lessons/[id]/edit` - Edit lesson ⚠️ Partial

#### Songs Management (4)
- `/dashboard/songs` - Song list ✅ Tested
- `/dashboard/songs/new` - Create song ✅ Tested
- `/dashboard/songs/[id]` - Song detail ✅ Tested
- `/dashboard/songs/[id]/edit` - Edit song ⚠️ Partial

#### Assignments Management (5)
- `/dashboard/assignments` - Assignment list ✅ Tested
- `/dashboard/assignments/new` - Create assignment ✅ Tested
- `/dashboard/assignments/[id]` - Assignment detail ✅ Tested
- `/dashboard/assignments/templates` - Template list ❌ Not tested
- `/dashboard/assignments/templates/new` - Create template ❌ Not tested
- `/dashboard/assignments/templates/[id]` - Edit template ❌ Not tested

#### Admin Features (4)
- `/dashboard/admin/spotify-matches` - Spotify review ⚠️ UI only
- `/dashboard/admin/stats/lessons` - Lesson analytics ❌ Not tested
- `/dashboard/admin/stats/songs` - Song analytics ❌ Not tested
- `/dashboard/admin/documentation` - API docs ❌ Not tested

#### User Features (8)
- `/dashboard/profile` - User profile ⚠️ Partial
- `/dashboard/settings` - User settings ❌ Not tested
- `/dashboard/calendar` - Calendar view ❌ Not tested
- `/dashboard/ai` - AI assistant ❌ Not tested
- `/dashboard/skills` - Skills management ❌ Not tested
- `/dashboard/logs` - System logs ❌ Not tested

#### Onboarding (3)
- `/onboarding` - Onboarding start ❌ Not tested
- `/onboarding/goals` - Learning goals ❌ Not tested
- `/onboarding/skill-level` - Skill level selection ❌ Not tested

### API Routes Coverage (71 total)

#### Authentication (3 routes)
- `/api/auth/google` ❌ Not tested
- `/api/auth/callback` ❌ Not tested
- `/api/oauth2/callback` ❌ Not tested

#### Users (7 routes)
- `/api/users` ✅ Tested
- `/api/users/[id]` ✅ Tested
- `/api/admin/users` ✅ Tested
- `/api/admin/set-passwords` ❌ Not tested
- `/api/profiles` ⚠️ Partial
- `/api/teacher/students` ❌ Not tested

#### Lessons (15 routes)
- `/api/lessons` ✅ Tested
- `/api/lessons/[id]` ✅ Tested
- `/api/lessons/[id]/songs` ⚠️ Partial
- `/api/lessons/create` ✅ Tested
- `/api/lessons/search` ⚠️ Partial
- `/api/lessons/schedule` ❌ Not tested
- `/api/lessons/export` ❌ Not tested
- `/api/lessons/bulk` ❌ Not tested
- `/api/lessons/analytics` ❌ Not tested
- `/api/admin/lessons` ⚠️ Partial
- `/api/teacher/lessons` ❌ Not tested
- `/api/student/lessons` ✅ Tested

#### Songs (14 routes)
- `/api/song` ✅ Tested
- `/api/song/[id]` ✅ Tested
- `/api/song/[id]/assignments` ❌ Not tested
- `/api/song/[id]/lessons` ❌ Not tested
- `/api/song/create` ✅ Tested
- `/api/song/search` ⚠️ Partial
- `/api/song/bulk` ❌ Not tested
- `/api/song/update` ⚠️ Partial
- `/api/song/export` ❌ Not tested
- `/api/song/stats` ❌ Not tested
- `/api/song/favorites` ❌ Not tested
- `/api/song/admin-favorites` ❌ Not tested
- `/api/song/user-songs` ⚠️ Partial
- `/api/song/student-songs` ⚠️ Partial

#### Spotify Integration (11 routes)
- `/api/spotify/search` ❌ Not tested
- `/api/spotify/features` ❌ Not tested
- `/api/spotify/sync` ❌ Not tested
- `/api/spotify/sync/stream` ❌ Not tested
- `/api/spotify/matches` ⚠️ UI only
- `/api/spotify/matches/[songId]` ❌ Not tested
- `/api/spotify/matches/count` ❌ Not tested
- `/api/spotify/matches/approve` ❌ Not tested
- `/api/spotify/matches/action` ❌ Not tested
- `/api/spotify/matches/reject` ❌ Not tested

#### Assignments (2 routes)
- `/api/assignments` ✅ Tested
- `/api/assignments/[id]` ✅ Tested

#### Student Progress (3 routes)
- `/api/student/song-status` ❌ Not tested
- `/api/student/song-status-history` ❌ Not tested

#### System & Stats (9 routes)
- `/api/dashboard/stats` ⚠️ Partial
- `/api/stats/weekly` ❌ Not tested
- `/api/students/health` ⚠️ Partial
- `/api/students/needs-attention` ❌ Not tested
- `/api/students/pipeline` ❌ Not tested
- `/api/database/status` ✅ Tested
- `/api/external/database/status` ❌ Not tested

#### API Keys (3 routes)
- `/api/api-keys` ❌ Not tested
- `/api/api-keys/[id]` ❌ Not tested

#### Exports (1 route)
- `/api/exports/student/[id]` ❌ Not tested

#### Webhooks (2 routes)
- `/api/webhooks/google-calendar` ❌ Not tested
- `/api/cron/daily-report` ❌ Not tested

---

## Critical User Flows

### Priority 0 - Production Blocking

#### 1. Complete Authentication Journey
```
Landing → Sign Up → Email Verification → Onboarding → Dashboard
```
- **Current Coverage**: 30%
- **Tested**: Sign-in, password reset
- **Missing**: Sign-up form, email verification, onboarding flow
- **Impact**: Users cannot complete registration without manual intervention

#### 2. Student Learning Journey
```
Student Login → View Lessons → View Song → Update Progress → View Stats
```
- **Current Coverage**: 70%
- **Tested**: Dashboard, lessons view, song view, access control
- **Missing**: Song status progression (5 states), progress history, stats calculations
- **Impact**: Core learning workflow incomplete

#### 3. Teacher Lesson Management
```
Create Lesson → Add Songs → Assign to Student → Track Progress → Generate Report
```
- **Current Coverage**: 60%
- **Tested**: Create lesson, add songs, view progress
- **Missing**: Song status updates within lesson, report generation, bulk operations
- **Impact**: Teacher workflow partially validated

#### 4. Assignment Lifecycle
```
Create Assignment → Student Views → Marks In Progress → Completes → Teacher Reviews
```
- **Current Coverage**: 75%
- **Tested**: Create, view, mark complete
- **Missing**: Status transition validation, due date enforcement, bulk assignments
- **Impact**: Assignment workflow mostly covered

#### 5. Role-Based Access Control
```
Admin/Teacher/Student Login → Verify Dashboard Access → Verify Feature Access → Verify API Access
```
- **Current Coverage**: 75%
- **Tested**: Dashboard access, admin pages, student restrictions
- **Missing**: Teacher isolation, teacher-specific features, API-level permissions
- **Impact**: Security mostly validated but gaps exist

### Priority 1 - High Value Features

#### 6. Google Calendar Integration
```
Connect Calendar → Create Lesson → Sync to Calendar → Update Lesson → Calendar Updates
```
- **Current Coverage**: 0%
- **Missing**: Complete OAuth flow, sync creation, sync updates, webhook handling
- **Impact**: High-value feature completely untested

#### 7. Spotify Integration Workflow
```
Search Song → Match with Spotify → Approve Match → Song Synced → Audio Features Displayed
```
- **Current Coverage**: 20%
- **Tested**: UI exists
- **Missing**: Search flow, approval flow, rejection flow, bulk sync, audio feature display
- **Impact**: Differentiation feature incomplete

#### 8. Favorites Management
```
Browse Songs → Add to Favorites → Filter by Favorites → Remove from Favorites
```
- **Current Coverage**: 0%
- **Missing**: Complete favorites CRUD
- **Impact**: User personalization feature untested

#### 9. Assignment Templates
```
Create Template → Save → Use Template for Assignment → Verify Pre-fill
```
- **Current Coverage**: 0%
- **Missing**: Template CRUD, template application
- **Impact**: Teacher efficiency feature untested

#### 10. User Settings & Configuration
```
Settings → Update Profile → Connect Integrations → Manage API Keys → Verify Changes
```
- **Current Coverage**: 10%
- **Tested**: Profile edit (partial)
- **Missing**: Settings page, calendar connection, API key management
- **Impact**: Core user management incomplete

### Priority 2 - Edge Cases & Polish

#### 11. Error Handling
- Network failures ⚠️ Partial
- Server 500 errors ⚠️ Partial
- Validation errors ✅ Good
- Permission errors ✅ Good
- Resource not found ⚠️ Partial

#### 12. Performance & Scalability
- Large datasets (100+ records) ❌ Not tested
- Pagination under load ❌ Not tested
- Concurrent users ⚠️ Minimal
- Real-time updates ❌ Not tested

#### 13. Mobile & Responsive
- Mobile viewport (375px) ⚠️ Partial
- Tablet viewport (768px) ⚠️ Partial
- Touch interactions ❌ Not tested
- Mobile navigation ❌ Not tested

#### 14. Accessibility
- Keyboard navigation ❌ Not tested
- Screen reader compatibility ❌ Not tested
- ARIA labels ❌ Not tested
- Focus management ❌ Not tested

---

## API Coverage Analysis

### API Mutations (40 endpoints)

#### Fully Tested (15)
- Songs: Create, basic update
- Lessons: Create, delete
- Assignments: Create, delete
- Users: Create, update, delete

#### Partially Tested (8)
- Songs: Update (edit flow incomplete)
- Lessons: Update (edit flow incomplete)
- Song favorites: Add/remove untested
- Student progress: Status updates untested

#### Not Tested (17)
- Spotify: Approve/reject matches (0/3)
- Google Calendar: Sync operations (0/2)
- Bulk operations: Songs, lessons, assignments (0/3)
- API keys: Create, revoke (0/2)
- Admin operations: Set passwords, backup (0/2)
- Exports: Student data, CSV (0/2)
- Templates: Assignment templates (0/3)

### API Queries (31 endpoints)

#### Fully Tested (12)
- Basic lists: Songs, lessons, assignments, users
- API health checks
- Role-based filtering

#### Partially Tested (9)
- Search endpoints (basic testing only)
- Analytics (dashboard stats partial)
- Student data (health monitoring partial)

#### Not Tested (10)
- Advanced analytics (0/4)
- External APIs (0/3)
- Webhook endpoints (0/2)
- Export endpoints (0/1)

---

## Feature Coverage Analysis

### Songs Feature - 70% Coverage

#### ✅ Tested
- Admin song CRUD
- Song search and filtering
- Difficulty level management
- Student song viewing
- Basic Spotify UI

#### ❌ Missing
- **Favorites workflow**: Add/remove/filter by favorites
- **Song status progression**: 5-state workflow (to_learn → learning → practicing → improving → mastered)
- **Progress history**: View song status history over time
- **Spotify integration**: Complete match approval/rejection flow
- **Bulk operations**: Batch song creation, updates
- **Export**: CSV/JSON song library export
- **Media management**: Image upload, audio file associations
- **Advanced filtering**: Combined filters (level + key + category)

### Lessons Feature - 65% Coverage

#### ✅ Tested
- Admin/Teacher lesson CRUD
- Lesson-song associations
- Student lesson viewing
- Search and filtering
- Status management (basic)

#### ❌ Missing
- **Google Calendar sync**: Complete OAuth → Sync → Update → Delete flow
- **Lesson templates**: Reusable lesson structures
- **Bulk import**: CSV/calendar bulk import
- **AI lesson notes**: Auto-generated notes and summaries
- **Lesson analytics**: Completion rates, average duration
- **Recurring lessons**: Weekly lesson scheduling
- **Lesson reminders**: Email/SMS notifications
- **Cancellation flow**: Reschedule vs cancel handling

### Assignments Feature - 70% Coverage

#### ✅ Tested
- Admin/Teacher assignment CRUD
- Student assignment viewing
- Assignment completion workflow
- Status filtering

#### ❌ Missing
- **Templates**: Create/edit/use assignment templates
- **Bulk assignment**: Assign to multiple students at once
- **Due date reminders**: Email notifications before due date
- **Late submission**: Overdue assignment handling
- **Assignment attachments**: File uploads for assignments
- **Grading system**: Score/grade assignments
- **Feedback loop**: Teacher comments on assignments

### Users & Students - 75% Coverage

#### ✅ Tested
- Admin user CRUD
- Shadow user creation
- Role assignment
- Profile editing
- Student health monitoring
- Access control

#### ❌ Missing
- **User onboarding**: Complete onboarding flow (goals, skill level)
- **User invitations**: Email invitation workflow
- **Bulk user import**: CSV import of students
- **Teacher assignment**: Assign students to teachers
- **Student pipeline**: Lifecycle stage tracking
- **Parent accounts**: Parent/guardian access (if planned)
- **User deactivation**: Soft delete vs hard delete

### Dashboard Features - 60% Coverage

#### ✅ Tested
- Admin dashboard stats
- Student dashboard display
- Navigation by role
- Health monitoring

#### ❌ Missing
- **Teacher dashboard**: Dedicated teacher view (currently shows admin view)
- **Recent activity**: Activity feed real-time updates
- **Quick actions**: Quick action button workflows
- **Practice timer**: Integrated practice tracking
- **Progress charts**: Chart rendering and accuracy
- **Notifications center**: In-app notification display
- **Weekly summary**: Auto-generated weekly reports

### Settings & Configuration - 10% Coverage

#### ✅ Tested
- Profile edit (partial)

#### ❌ Missing
- **Settings page**: Complete settings UI testing
- **Google Calendar connection**: OAuth flow
- **Calendar disconnect**: Revoke integration
- **API key management**: Generate/view/revoke keys
- **Notification preferences**: Email/SMS settings
- **Theme preferences**: Light/dark mode toggle
- **Language settings**: i18n support (if planned)
- **Privacy settings**: Data visibility controls

---

## Security & Auth Analysis

### Authentication Mechanisms

#### Supabase Auth (Primary)
- Email/password authentication ✅ Tested
- Google OAuth ❌ Not tested
- Session management (JWT) ✅ Tested
- Password reset ✅ Tested
- Email verification ❌ Not tested

#### Bearer Token Auth (API Keys)
- Token generation ❌ Not tested
- Token usage in API calls ❌ Not tested
- Token revocation ❌ Not tested
- Token last_used_at tracking ❌ Not tested

### Role-Based Access Control (RBAC)

#### Three Roles Implemented
1. **Admin**: Full system access
2. **Teacher**: Manage own lessons, students, songs
3. **Student**: View own data, update progress

#### Enforcement Layers

**Layer 1: Middleware** (`middleware.ts`)
- Dashboard route protection ✅ Tested
- Admin route gating ✅ Tested
- Role header injection ✅ Tested
- Session validation ✅ Tested

**Layer 2: Database RLS** (16 tables)
- Profiles RLS ✅ Implemented
- Songs RLS ✅ Implemented
- Lessons RLS ✅ Implemented
- Assignments RLS ✅ Implemented
- All tables enabled ✅ Verified

**Layer 3: API Authorization**
- Role checks in handlers ⚠️ Inconsistent
- Profile-based filtering ✅ Implemented
- Permission helpers ✅ Implemented

### 🔴 Critical Security Vulnerabilities

#### 1. inviteUser() Authorization Bypass (P0)
**File**: `app/dashboard/actions.ts:120`

**Issue**: No authorization check - ANY authenticated user can create admin accounts

```typescript
export async function inviteUser(email, fullName, role = 'student', phone) {
  const supabaseAdmin = createAdminClient();
  // ❌ MISSING: Admin role verification
  // Any user can call this and create admins!
}
```

**Risk**: Privilege escalation, unauthorized admin creation
**Test Needed**: Verify non-admin cannot invoke this action
**Fix**: Add admin role check before proceeding

#### 2. createShadowUser() Missing Gating (P1)
**File**: `app/dashboard/actions.ts:170`

**Issue**: Only checks authentication, not role

```typescript
export async function createShadowUser(studentEmail: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  // ❌ MISSING: Role check (should be admin/teacher only)
}
```

**Risk**: Students could create accounts
**Test Needed**: Verify only teachers/admins can create shadow users
**Fix**: Add is_admin_or_teacher check

#### 3. Teacher Student Isolation Unclear (P1)
**File**: `app/api/teacher/students/route.ts:27`

**Issue**: May return ALL students instead of teacher's students

```typescript
const { data: students } = await supabase
  .from('profiles')
  .select('id, full_name, user_roles!inner(role)')
  .eq('user_roles.role', 'student'); // No teacher_id filter!
```

**Risk**: Information disclosure across teachers
**Test Needed**: Verify teacher A cannot see teacher B's students
**Fix**: Filter by lessons.teacher_id

### RLS Policy Coverage

| Table | SELECT | INSERT | UPDATE | DELETE | Status |
|-------|--------|--------|--------|--------|--------|
| profiles | ✅ | ❌ | ✅ | ✅ | Admin/Own |
| songs | ✅ | ✅ | ✅ | ✅ | Staff Only |
| lessons | ✅ | ✅ | ✅ | ✅ | Role-Based |
| assignments | ✅ | ✅ | ✅ | ✅ | Role-Based |
| lesson_songs | ✅ | ✅ | ✅ | ✅ | Cascading |
| student_songs | ✅ | ✅ | ✅ | ❌ | Dual Access |
| practice_sessions | ✅ | ✅ | ✅ | ❌ | Own/Staff |
| api_keys | ✅ | ✅ | ✅ | ✅ | Own Only |
| user_integrations | ✅ | ✅ | ✅ | ✅ | Own Only |
| ai_conversations | ✅ | ✅ | ✅ | ✅ | Own Only |
| audit_log | ⚠️ | ⚠️ | ❌ | ❌ | Admin/Actor |

**Legend**: ✅ Policy exists | ❌ No policy/restricted | ⚠️ Limited access

---

## Coverage Gaps

### Critical Gaps (Production Blocking)

#### Authentication & Onboarding
1. **Sign-up flow** - Complete registration + email verification
2. **Email verification** - Click verification link, verify can login
3. **Google OAuth** - Complete OAuth flow from start to dashboard
4. **Onboarding flow** - All three role paths (student/teacher/admin)
5. **Session persistence** - Verify session survives page reload
6. **Session expiry** - Auto-logout after timeout

#### Security Vulnerabilities
7. **inviteUser() exploit** - Verify student cannot create admins
8. **createShadowUser() exploit** - Verify student cannot create users
9. **Teacher isolation** - Teacher A cannot access Teacher B's students
10. **API permission enforcement** - All 71 routes properly gate by role

#### Core Features
11. **Song favorites** - Complete add/remove/filter workflow
12. **Song status progression** - All 5 status states with history
13. **Google Calendar sync** - Complete OAuth → Sync → Update → Webhook
14. **Spotify integration** - Search → Match → Approve → Sync
15. **Assignment templates** - Create → Edit → Use → Delete

### High Priority Gaps

#### Integration Features
16. **API key management** - Generate → Use → Revoke workflow
17. **Webhook handling** - Google Calendar webhook processing
18. **Email notifications** - Assignment reminders, lesson notifications
19. **Export functionality** - Student data, lesson CSV, song library
20. **Bulk operations** - Batch user import, bulk assignments

#### Teacher Workflows
21. **Teacher dashboard** - Dedicated teacher view (not admin view)
22. **Student assignment** - Assign students to teacher
23. **Lesson analytics** - Completion rates, trends
24. **Student progress review** - Aggregate student performance
25. **Lesson templates** - Reusable lesson structures

#### Student Features
26. **Practice timer** - Start/stop/track practice sessions
27. **Progress stats** - Detailed learning analytics
28. **Song practice logging** - Log practice time per song
29. **Assignment submission** - Submit completed assignments
30. **Feedback viewing** - View teacher feedback on assignments

### Medium Priority Gaps

#### UI & UX
31. **Mobile navigation** - Hamburger menu, touch interactions
32. **Responsive layouts** - All breakpoints (mobile/tablet/desktop)
33. **Dark mode** - Theme toggle and persistence
34. **Loading states** - Skeleton screens, spinners
35. **Toast notifications** - Success/error message display

#### Advanced Features
36. **Skills tracking** - Skill management page
37. **System logs** - Admin log viewer
38. **AI assistant** - AI chat interface
39. **Calendar view** - Calendar display and interactions
40. **Weekly reports** - Auto-generated summaries

#### Data & Performance
41. **Large datasets** - Pagination with 100+ records
42. **Search performance** - Search response time <2s
43. **Concurrent operations** - Multiple users editing simultaneously
44. **Cache invalidation** - Real-time updates across sessions
45. **Database performance** - Query optimization validation

---

## 100% Coverage Plan

### Test Categories Overview

To achieve 100% E2E coverage, we need **75 total test files** (33 existing + 42 new).

| Category | Existing | Needed | Total | Coverage Goal |
|----------|----------|--------|-------|---------------|
| **Authentication** | 3 | 5 | 8 | 100% auth flows |
| **Admin Features** | 13 | 8 | 21 | 100% admin operations |
| **Teacher Features** | 4 | 12 | 16 | 100% teacher workflows |
| **Student Features** | 8 | 6 | 14 | 100% student experience |
| **Integration** | 3 | 8 | 11 | 100% third-party integrations |
| **Security** | 2 | 5 | 7 | 100% security validation |
| **Performance** | 0 | 3 | 3 | Key performance metrics |
| **Mobile/A11y** | 0 | 4 | 4 | Responsive + accessibility |
| **TOTAL** | **33** | **42** | **75** | **100%** |

---

## Detailed Test Plan

### Phase 1: Critical Security (Week 1)

#### Test 1: `security/auth-server-actions.cy.ts`
**Purpose**: Validate server action authorization

**Scenarios**:
```typescript
describe('Server Action Security', () => {
  it('should block student from invoking inviteUser', () => {
    cy.loginAs('student');
    cy.task('callServerAction', {
      action: 'inviteUser',
      args: ['hacker@test.com', 'Hacker', 'admin']
    }).should('throw', /Unauthorized|Forbidden/);
  });

  it('should block teacher from creating admin via inviteUser', () => {
    cy.loginAs('teacher');
    // Should fail or only allow student/teacher creation
  });

  it('should allow admin to invoke inviteUser', () => {
    cy.loginAs('admin');
    cy.task('callServerAction', {
      action: 'inviteUser',
      args: ['newteacher@test.com', 'New Teacher', 'teacher']
    }).should('succeed');
  });

  it('should block student from createShadowUser', () => {
    cy.loginAs('student');
    cy.task('callServerAction', {
      action: 'createShadowUser',
      args: ['fake@test.com']
    }).should('throw', /Unauthorized/);
  });
});
```

#### Test 2: `security/teacher-isolation.cy.ts`
**Purpose**: Verify teacher data isolation

**Scenarios**:
```typescript
describe('Teacher Student Isolation', () => {
  it('should NOT show other teachers\' students', () => {
    // Setup: Create Teacher A with Student S1, Teacher B with Student S2
    cy.loginAs('teacher-a');
    cy.visit('/dashboard/users');

    cy.contains(STUDENT_S1_NAME).should('exist');
    cy.contains(STUDENT_S2_NAME).should('not.exist');
  });

  it('should NOT allow editing other teachers\' lessons', () => {
    cy.loginAs('teacher-a');
    cy.request({
      method: 'PUT',
      url: `/api/lessons/${TEACHER_B_LESSON_ID}`,
      body: { title: 'Hacked' },
      failOnStatusCode: false
    }).should('have.property', 'status', 403);
  });
});
```

#### Test 3: `security/rls-enforcement.cy.ts`
**Purpose**: Validate database-level access control

**Scenarios**:
```typescript
describe('RLS Policy Enforcement', () => {
  it('should block student from querying unassigned songs', () => {
    cy.loginAs('student');
    cy.request({
      method: 'GET',
      url: `/api/song/${UNASSIGNED_SONG_ID}`,
      failOnStatusCode: false
    }).should('have.property', 'status').and('be.oneOf', [403, 404]);
  });

  it('should block student from viewing other students\' lessons', () => {
    cy.loginAs('student-a');
    cy.request({
      method: 'GET',
      url: `/api/lessons/${STUDENT_B_LESSON_ID}`,
      failOnStatusCode: false
    }).should('have.property', 'status', 403);
  });

  it('should enforce cascading RLS on lesson_songs', () => {
    // Verify student cannot access lesson_songs for lessons they're not in
  });
});
```

#### Test 4: `security/api-authentication.cy.ts`
**Purpose**: Validate API endpoint authentication

**Scenarios**:
```typescript
describe('API Authentication', () => {
  it('should reject unauthenticated requests', () => {
    cy.clearCookies();
    cy.request({
      method: 'GET',
      url: '/api/lessons',
      failOnStatusCode: false
    }).should('have.property', 'status', 401);
  });

  it('should accept bearer token authentication', () => {
    cy.createApiKey().then(apiKey => {
      cy.request({
        method: 'GET',
        url: '/api/songs',
        headers: { Authorization: `Bearer ${apiKey}` }
      }).should('have.property', 'status', 200);
    });
  });

  it('should reject invalid bearer tokens', () => {
    cy.request({
      method: 'GET',
      url: '/api/songs',
      headers: { Authorization: 'Bearer invalid-token' },
      failOnStatusCode: false
    }).should('have.property', 'status', 401);
  });
});
```

#### Test 5: `security/session-management.cy.ts`
**Purpose**: Validate session lifecycle

**Scenarios**:
```typescript
describe('Session Management', () => {
  it('should persist session across page reloads', () => {
    cy.loginAs('admin');
    cy.visit('/dashboard');
    cy.reload();
    cy.url().should('include', '/dashboard');
    cy.contains('Welcome').should('exist');
  });

  it('should expire session after timeout', () => {
    // May require mocking time or waiting
  });

  it('should allow concurrent sessions', () => {
    // Login from two different browsers
  });
});
```

---

### Phase 2: Core User Workflows (Week 2-3)

#### Test 6: `auth/sign-up-complete.cy.ts`
**Purpose**: Complete registration flow

**Scenarios**:
- Sign up form validation (all fields)
- Password strength meter
- Email uniqueness validation
- Email verification sent
- Verification link click
- Can login after verification
- Redirect to onboarding

#### Test 7: `auth/google-oauth.cy.ts`
**Purpose**: Google OAuth complete flow

**Scenarios**:
- Click "Sign in with Google"
- Google consent screen
- Callback handling
- Profile creation
- Dashboard redirect
- Session persistence

#### Test 8: `onboarding/complete-flow.cy.ts`
**Purpose**: User onboarding journey

**Scenarios**:
- Student path: Goals → Skill level → Dashboard
- Teacher path: Studio setup → Dashboard
- Admin path: System config → Dashboard
- Skip if already onboarded
- Cannot access without authentication

#### Test 9: `features/song-favorites.cy.ts`
**Purpose**: Favorites management

**Scenarios**:
- Add song to favorites (heart icon)
- Verify appears in favorites filter
- Remove from favorites
- Filter songs by favorites
- Favorite count updates

#### Test 10: `features/song-status-progression.cy.ts`
**Purpose**: Student song progress tracking

**Scenarios**:
- Song starts as "to_learn"
- Update to "learning"
- Update to "practicing"
- Update to "improving"
- Update to "mastered"
- View status history
- Status persists across sessions

#### Test 11: `integration/google-calendar-sync.cy.ts`
**Purpose**: Google Calendar integration

**Scenarios**:
- Connect Google Calendar (OAuth)
- Import lessons from calendar
- Create lesson → syncs to calendar
- Update lesson → calendar updates
- Delete lesson → calendar event removed
- Disconnect calendar
- Webhook handling (if possible)

#### Test 12: `integration/spotify-workflow.cy.ts`
**Purpose**: Spotify integration complete flow

**Scenarios**:
- Search song on Spotify
- Review match suggestions
- Approve match (high confidence)
- Reject match (low confidence)
- Manual Spotify link input
- Audio features display
- Sync audio features to song
- Bulk sync operation

#### Test 13: `features/assignment-templates.cy.ts`
**Purpose**: Assignment template workflow

**Scenarios**:
- Create assignment template
- Save template with default values
- View template list
- Edit template
- Use template to create assignment
- Verify pre-filled values
- Delete template

#### Test 14: `features/api-key-management.cy.ts`
**Purpose**: Bearer token lifecycle

**Scenarios**:
- Navigate to Settings → API Keys
- Generate new API key
- Copy key (shown once)
- View API key list (without secrets)
- Use API key in request
- Verify last_used_at updates
- Revoke API key
- Verify revoked key rejected

#### Test 15: `teacher/teacher-dashboard.cy.ts`
**Purpose**: Teacher-specific dashboard

**Scenarios**:
- Login as teacher
- Verify teacher dashboard (NOT admin dashboard)
- See assigned students
- See upcoming lessons
- See recent activity
- Quick action buttons work

---

### Phase 3: Advanced Features (Week 4-5)

#### Test 16: `features/lesson-calendar-view.cy.ts`
**Purpose**: Calendar interface testing

**Scenarios**:
- View calendar with lessons
- Month/week/day views
- Click date to create lesson
- Drag lesson to reschedule
- Click lesson to view details

#### Test 17: `features/student-health-monitoring.cy.ts`
**Purpose**: Student health tracking (expanded)

**Scenarios**:
- Navigate to Health page
- Filter by health status (excellent/good/at-risk/critical)
- Export health data to CSV
- View student detail from health page
- Health alerts display
- Recommended actions shown

#### Test 18: `features/bulk-operations.cy.ts`
**Purpose**: Batch operations

**Scenarios**:
- Bulk user import from CSV
- Bulk assignment creation
- Bulk song operations
- Verify all items created
- Error handling for partial failures

#### Test 19: `features/export-functionality.cy.ts`
**Purpose**: Data export workflows

**Scenarios**:
- Export student progress report (PDF)
- Export lesson history (CSV)
- Export song library (JSON)
- Export assignment list (Excel)
- Verify file downloads
- Verify data accuracy in exports

#### Test 20: `teacher/student-assignment.cy.ts`
**Purpose**: Teacher-student relationship management

**Scenarios**:
- Assign student to teacher
- View assigned students list
- Unassign student
- Transfer student to another teacher

#### Test 21: `features/lesson-templates.cy.ts`
**Purpose**: Reusable lesson structures

**Scenarios**:
- Create lesson template
- Save with default songs
- Use template for new lesson
- Verify songs pre-populated
- Edit template
- Delete template

#### Test 22: `features/practice-timer.cy.ts`
**Purpose**: Student practice tracking

**Scenarios**:
- Start practice timer
- Timer counts up
- Stop timer
- Save practice session
- View practice history
- Practice stats on dashboard

#### Test 23: `student/student-stats.cy.ts`
**Purpose**: Student statistics page

**Scenarios**:
- Navigate to /dashboard/stats
- View total practice time
- View song completion stats
- View lesson attendance
- Charts render correctly
- Export stats

#### Test 24: `admin/admin-analytics.cy.ts`
**Purpose**: Admin analytics pages

**Scenarios**:
- Navigate to /dashboard/admin/stats/lessons
- View lesson completion rates
- View teacher performance
- Navigate to /dashboard/admin/stats/songs
- View song popularity
- View difficulty distribution

#### Test 25: `features/ai-assistant.cy.ts`
**Purpose**: AI chat interface

**Scenarios**:
- Navigate to /dashboard/ai
- Start new conversation
- Send message
- Receive AI response
- View conversation history
- Delete conversation

---

### Phase 4: Edge Cases & Polish (Week 6)

#### Test 26: `error-handling/network-failures.cy.ts`
**Purpose**: Network error resilience (expanded)

**Scenarios**:
- Simulate offline mode
- Form submission failure
- Retry mechanism
- Offline queue
- Resume on reconnect

#### Test 27: `error-handling/validation-errors.cy.ts`
**Purpose**: Comprehensive validation testing

**Scenarios**:
- All required field validation (lessons, songs, assignments, users)
- Email format validation
- Date validation (past dates, invalid formats)
- Number validation (negative, out of range)
- Text length limits
- Special character handling

#### Test 28: `performance/large-datasets.cy.ts`
**Purpose**: Performance under load

**Scenarios**:
- Load page with 100+ songs
- Load page with 100+ lessons
- Search with large dataset
- Pagination performance
- Verify <3s load time

#### Test 29: `performance/concurrent-operations.cy.ts`
**Purpose**: Multi-user scenarios

**Scenarios**:
- Two users edit same lesson
- Last write wins
- Optimistic locking
- Stale data detection

#### Test 30: `performance/real-time-updates.cy.ts`
**Purpose**: Cache invalidation

**Scenarios**:
- User A creates lesson
- User B refreshes list
- Lesson appears for User B
- Real-time indicator shows update

#### Test 31: `mobile/mobile-navigation.cy.ts`
**Purpose**: Mobile-specific interactions

**Scenarios**:
- Viewport 375px (mobile)
- Hamburger menu opens/closes
- Touch-friendly buttons (44x44px)
- Swipe gestures (if applicable)
- Mobile form inputs

#### Test 32: `mobile/responsive-layouts.cy.ts`
**Purpose**: Responsive design validation

**Scenarios**:
- Test 375px (mobile)
- Test 768px (tablet)
- Test 1200px (desktop)
- Verify layout breakpoints
- Verify no horizontal scroll

#### Test 33: `accessibility/keyboard-navigation.cy.ts`
**Purpose**: Keyboard accessibility

**Scenarios**:
- Tab through forms
- Enter to submit
- Escape to cancel
- Arrow keys for navigation
- Skip to content link

#### Test 34: `accessibility/screen-reader.cy.ts`
**Purpose**: Screen reader compatibility

**Scenarios**:
- ARIA labels present
- Semantic HTML
- Form labels associated
- Error announcements
- Status updates announced

#### Test 35: `features/settings-complete.cy.ts`
**Purpose**: Settings page coverage

**Scenarios**:
- Navigate to /dashboard/settings
- Update profile information
- Connect Google Calendar
- Manage API keys
- Change notification preferences
- Toggle theme (light/dark)
- Verify all changes persist

---

### Phase 5: Integration & Teacher Features (Week 7-8)

#### Test 36: `teacher/teacher-lesson-management.cy.ts`
**Purpose**: Complete teacher lesson workflow

**Scenarios**:
- Create lesson for assigned student
- Cannot create for non-assigned student
- Edit own lesson
- Cannot edit other teacher's lesson
- View lesson analytics
- Export lesson data

#### Test 37: `teacher/teacher-student-progress.cy.ts`
**Purpose**: Teacher progress tracking

**Scenarios**:
- View student progress summary
- See song completion by student
- View assignment completion rates
- Track practice time per student
- Identify at-risk students

#### Test 38: `integration/lesson-song-workflow.cy.ts`
**Purpose**: Complete lesson-song management

**Scenarios**:
- Create lesson
- Add multiple songs to lesson
- Update song order in lesson
- Update song status in lesson context
- Remove song from lesson
- Verify lesson_songs relationships

#### Test 39: `integration/calendar-webhook.cy.ts`
**Purpose**: Google Calendar webhook handling

**Scenarios**:
- Create lesson (syncs to calendar)
- External calendar update → webhook → lesson updates
- Calendar event deleted → lesson marked cancelled
- Verify sync status indicators

#### Test 40: `integration/email-notifications.cy.ts`
**Purpose**: Email notification system

**Scenarios**:
- Assignment created → student receives email
- Lesson scheduled → student receives email
- Assignment due soon → reminder email
- Password reset → email with link

#### Test 41: `features/lesson-import.cy.ts`
**Purpose**: Bulk lesson import

**Scenarios**:
- Navigate to /dashboard/lessons/import
- Upload CSV file
- Map CSV columns to fields
- Validate import preview
- Execute import
- Verify all lessons created

#### Test 42: `features/user-invitation.cy.ts`
**Purpose**: User invitation workflow

**Scenarios**:
- Admin invites new teacher via email
- Teacher receives invitation email
- Teacher clicks invitation link
- Teacher sets password
- Teacher can login
- Profile created with correct role

---

### Phase 6: Student Features & Analytics (Week 9)

#### Test 43: `student/practice-logging.cy.ts`
**Purpose**: Practice session tracking

**Scenarios**:
- Start practice timer for song
- Timer runs accurately
- Pause/resume timer
- Stop and save practice session
- View practice history
- Practice time adds to total

#### Test 44: `student/assignment-submission.cy.ts`
**Purpose**: Assignment submission (if file upload supported)

**Scenarios**:
- View assignment
- Upload submission file
- Add submission notes
- Mark as submitted
- Teacher sees submission
- Teacher provides feedback

#### Test 45: `admin/lesson-analytics.cy.ts`
**Purpose**: Detailed lesson analytics

**Scenarios**:
- Navigate to /dashboard/admin/stats/lessons
- View lesson completion rates
- View average lesson duration
- Filter by date range
- Filter by teacher
- Export analytics report

#### Test 46: `admin/song-analytics.cy.ts`
**Purpose**: Song library analytics

**Scenarios**:
- Navigate to /dashboard/admin/stats/songs
- View song popularity
- View difficulty distribution
- View Spotify sync status
- Identify missing metadata
- Export song library

#### Test 47: `admin/system-logs.cy.ts`
**Purpose**: Admin log viewer

**Scenarios**:
- Navigate to /dashboard/logs
- View audit logs
- Filter by user
- Filter by action type
- Search logs
- Export logs

---

### Phase 7: Polish & Edge Cases (Week 10)

#### Test 48-52: Additional Tests
- `error-handling/permission-errors.cy.ts` - 403/401 scenarios
- `error-handling/not-found.cy.ts` - 404 handling
- `error-handling/server-errors.cy.ts` - 500 error recovery
- `features/notification-center.cy.ts` - In-app notifications
- `features/theme-toggle.cy.ts` - Dark mode persistence

#### Test 53-58: Advanced Workflows
- `workflows/complete-teacher-workflow.cy.ts` - Teacher end-to-end
- `workflows/complete-student-workflow.cy.ts` - Student end-to-end
- `workflows/lesson-lifecycle.cy.ts` - Lesson from creation to completion
- `workflows/song-lifecycle.cy.ts` - Song from creation to mastery
- `workflows/multi-student-assignment.cy.ts` - Assign to multiple students
- `workflows/student-progress-report.cy.ts` - Generate and export report

#### Test 59-63: Data Integrity
- `data/referential-integrity.cy.ts` - Foreign key enforcement
- `data/cascade-deletes.cy.ts` - Cascade behavior verification
- `data/orphan-prevention.cy.ts` - No orphaned records
- `data/transaction-atomicity.cy.ts` - All-or-nothing operations
- `data/concurrent-edits.cy.ts` - Race condition handling

#### Test 64-69: Performance & Optimization
- `performance/dashboard-load-time.cy.ts` - <2s load requirement
- `performance/search-performance.cy.ts` - Search <500ms
- `performance/pagination.cy.ts` - Large dataset handling
- `performance/api-response-time.cy.ts` - API <1s response
- `performance/memory-leaks.cy.ts` - No memory growth
- `performance/bundle-size.cy.ts` - JS bundle validation

#### Test 70-75: Mobile & Accessibility
- `mobile/touch-interactions.cy.ts` - Touch gestures
- `mobile/mobile-forms.cy.ts` - Mobile input handling
- `mobile/mobile-navigation.cy.ts` - Mobile menu
- `accessibility/focus-management.cy.ts` - Focus indicators
- `accessibility/color-contrast.cy.ts` - WCAG AA compliance
- `accessibility/aria-live-regions.cy.ts` - Dynamic content announcements

---

## Implementation Roadmap

### Week 1: Critical Security
- [ ] Fix inviteUser() authorization (CODE FIX)
- [ ] Fix createShadowUser() gating (CODE FIX)
- [ ] Fix teacher student isolation (CODE FIX)
- [ ] Test 1-5: Security test suite

### Week 2-3: Core Workflows
- [ ] Test 6-8: Auth completion flows
- [ ] Test 9-11: Song features (favorites, status, Spotify)
- [ ] Test 12-15: Integration features (calendar, templates, API keys)

### Week 4-5: Advanced Features
- [ ] Test 16-20: Teacher features (dashboard, analytics, workflows)
- [ ] Test 21-25: Student features (practice, stats, submissions)

### Week 6: Integration Features
- [ ] Test 26-35: Calendar, webhooks, emails, imports

### Week 7-8: Student & Analytics
- [ ] Test 36-47: Complete student experience, analytics, logs

### Week 9-10: Polish & Edge Cases
- [ ] Test 48-63: Error handling, data integrity, workflows
- [ ] Test 64-75: Performance, mobile, accessibility

---

## Success Metrics

### Coverage Goals

| Metric | Current | Target | Strategy |
|--------|---------|--------|----------|
| **Critical Paths** | 40% | 100% | Focus on P0 flows first |
| **API Endpoints** | 35% | 90% | Test all mutations, sample queries |
| **User Workflows** | 45% | 100% | End-to-end journeys |
| **Security Tests** | 30% | 100% | All RBAC scenarios |
| **Integration Features** | 10% | 80% | External services (Spotify, Google) |
| **Error Handling** | 25% | 90% | Network, validation, permission errors |
| **Mobile/Responsive** | 15% | 80% | Key viewports and interactions |
| **Accessibility** | 5% | 70% | Keyboard, ARIA, contrast |

### Definition of 100% Coverage

**Not**: Every possible test scenario (infinite)
**Is**: All critical paths + all features + reasonable edge cases

**Criteria**:
1. ✅ All authentication flows tested
2. ✅ All CRUD operations tested for each entity
3. ✅ All user roles tested (admin/teacher/student)
4. ✅ All integration features tested (Spotify, Google Calendar)
5. ✅ All security vulnerabilities validated as fixed
6. ✅ All critical user workflows tested end-to-end
7. ✅ Key performance metrics validated
8. ✅ Mobile responsiveness verified for critical paths
9. ✅ Accessibility basics validated
10. ✅ Error handling tested for major failure modes

---

## Test Prioritization Matrix

### P0 - Critical (Must Have Before Production)

**Security**:
- [ ] inviteUser() authorization fix + test
- [ ] createShadowUser() gating + test
- [ ] Teacher isolation fix + test
- [ ] RLS enforcement validation
- [ ] API authentication on all endpoints

**Core Flows**:
- [ ] Sign-up + email verification
- [ ] Complete onboarding flow
- [ ] Song status progression (5 states)
- [ ] Assignment templates
- [ ] Lesson edit complete flow
- [ ] Song edit complete flow

**Estimated Tests**: 15 files
**Timeline**: Week 1-3

---

### P1 - High Value (Should Have)

**Integration**:
- [ ] Google Calendar complete sync
- [ ] Spotify search → approve → sync
- [ ] Email notifications
- [ ] Webhook handling

**Features**:
- [ ] Song favorites workflow
- [ ] API key management
- [ ] Settings page complete
- [ ] Teacher dashboard
- [ ] Student stats page
- [ ] Practice timer

**Data Operations**:
- [ ] Bulk user import
- [ ] Bulk assignment creation
- [ ] Export workflows (CSV, PDF)
- [ ] Lesson/song analytics

**Estimated Tests**: 18 files
**Timeline**: Week 4-6

---

### P2 - Nice to Have (Post-Launch)

**Polish**:
- [ ] Mobile touch gestures
- [ ] Accessibility keyboard nav
- [ ] Theme toggle persistence
- [ ] Notification center
- [ ] Advanced search combinations
- [ ] Calendar view interactions
- [ ] AI assistant chat

**Performance**:
- [ ] Large dataset handling
- [ ] Concurrent user operations
- [ ] Real-time updates
- [ ] Memory leak prevention

**Edge Cases**:
- [ ] Referential integrity
- [ ] Cascade delete verification
- [ ] Orphan prevention
- [ ] Transaction atomicity

**Estimated Tests**: 20 files
**Timeline**: Week 7-10

---

## Test Implementation Template

### ⚠️ BEFORE USING THIS TEMPLATE: Verify Implementation Exists

**Critical Reminder**: The examples below assume the feature is fully implemented. Before writing any test:

1. **Verify the API route exists**: `ls app/api/song/favorites/route.ts`
2. **Read the implementation**: `cat app/api/song/favorites/route.ts`
3. **Check the UI component**: `grep -r "favorite" components/songs/`
4. **Verify data-testid exists**: Search for `data-testid="favorite-button"` in codebase
5. **Test in browser manually**: Visit the page and verify the feature works

**If implementation is incomplete**:
- Write tests for what EXISTS (e.g., API-only tests if UI missing)
- Use `.skip()` for tests that require missing features
- Document gaps in test comments
- Create separate tasks to implement missing features

---

### Example: Song Favorites Test

**Implementation Verification Checklist**:
```bash
# 1. Check API exists
✅ app/api/song/favorites/route.ts exists (verified)

# 2. Check UI exists
⚠️ Search for favorite button component
$ grep -r "data-testid=\"favorite-button\"" components/

# 3. If UI missing, test API only
# 4. Add .skip() for UI tests until implemented
```

```typescript
// cypress/e2e/features/song-favorites.cy.ts

describe('Song Favorites Management', () => {
  const ADMIN_EMAIL = 'p.romanczuk@gmail.com';
  const ADMIN_PASSWORD = 'test123_admin';
  const STUDENT_EMAIL = 'student@example.com';
  const STUDENT_PASSWORD = 'test123_student';

  let testSongId: string;

  before(() => {
    // Create test song
    cy.loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);
    cy.createSong({
      title: 'Favorite Test Song',
      author: 'Test Artist',
      level: 'beginner'
    }).then(song => {
      testSongId = song.id;
    });
    cy.logout();
  });

  after(() => {
    // Cleanup
    cy.loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);
    cy.deleteSong(testSongId);
    cy.logout();
  });

  describe('Add to Favorites', () => {
    it('should add song to favorites from song detail page', () => {
      cy.loginAs(STUDENT_EMAIL, STUDENT_PASSWORD);
      cy.visit(`/dashboard/songs/${testSongId}`);

      // Click heart icon
      cy.get('[data-testid="favorite-button"]').should('exist');
      cy.get('[data-testid="favorite-button"]').click();

      // Verify heart filled
      cy.get('[data-testid="favorite-button"]')
        .should('have.attr', 'aria-pressed', 'true');

      // Verify appears in API response
      cy.request('/api/song/favorites').then(res => {
        const favoriteIds = res.body.map(s => s.id);
        expect(favoriteIds).to.include(testSongId);
      });
    });

    it('should add song to favorites from song list', () => {
      cy.loginAs(STUDENT_EMAIL, STUDENT_PASSWORD);
      cy.visit('/dashboard/songs');

describe('Song Favorites Management', () => {
  const ADMIN_EMAIL = 'p.romanczuk@gmail.com';
  const ADMIN_PASSWORD = 'test123_admin';
  const STUDENT_EMAIL = 'student@example.com';
  const STUDENT_PASSWORD = 'test123_student';

  let testSongId: string;

  before(() => {
    // Create test song
    cy.loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);
    cy.createSong({
      title: 'Favorite Test Song',
      author: 'Test Artist',
      level: 'beginner'
    }).then(song => {
      testSongId = song.id;
    });
    cy.logout();
  });

  after(() => {
    // Cleanup
    cy.loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);
    cy.deleteSong(testSongId);
    cy.logout();
  });

  describe('Add to Favorites', () => {
    it('should add song to favorites from song detail page', () => {
      cy.loginAs(STUDENT_EMAIL, STUDENT_PASSWORD);
      cy.visit(`/dashboard/songs/${testSongId}`);

      // Click heart icon
      cy.get('[data-testid="favorite-button"]').should('exist');
      cy.get('[data-testid="favorite-button"]').click();

      // Verify heart filled
      cy.get('[data-testid="favorite-button"]')
        .should('have.attr', 'aria-pressed', 'true');

      // Verify appears in API response
      cy.request('/api/song/favorites').then(res => {
        const favoriteIds = res.body.map(s => s.id);
        expect(favoriteIds).to.include(testSongId);
      });
    });

    it('should add song to favorites from song list', () => {
      cy.loginAs(STUDENT_EMAIL, STUDENT_PASSWORD);
      cy.visit('/dashboard/songs');

      // Find song card and click heart
      cy.contains('[data-testid="song-card"]', 'Favorite Test Song')
        .find('[data-testid="favorite-button"]')
        .click();

      // Verify visual feedback
      cy.contains('[data-testid="song-card"]', 'Favorite Test Song')
        .find('[data-testid="favorite-button"]')
        .should('have.class', 'text-red-500');
    });
  });

  describe('Filter by Favorites', () => {
    it('should show only favorited songs when filter applied', () => {
      cy.loginAs(STUDENT_EMAIL, STUDENT_PASSWORD);
      cy.visit('/dashboard/songs');

      // Apply favorites filter
      cy.get('[data-testid="filter-favorites"]').click();

      // Verify only favorites shown
      cy.contains('Favorite Test Song').should('exist');

      // Verify non-favorites hidden
      cy.contains('Non-Favorite Song').should('not.exist');
    });
  });

  describe('Remove from Favorites', () => {
    it('should remove song from favorites', () => {
      cy.loginAs(STUDENT_EMAIL, STUDENT_PASSWORD);
      cy.visit(`/dashboard/songs/${testSongId}`);

      // Click heart to unfavorite
      cy.get('[data-testid="favorite-button"]').click();

      // Verify heart unfilled
      cy.get('[data-testid="favorite-button"]')
        .should('have.attr', 'aria-pressed', 'false');

      // Verify removed from API
      cy.request('/api/song/favorites').then(res => {
        const favoriteIds = res.body.map(s => s.id);
        expect(favoriteIds).to.not.include(testSongId);
      });
    });
  });

  describe('Favorites Persistence', () => {
    it('should persist favorites across sessions', () => {
      cy.loginAs(STUDENT_EMAIL, STUDENT_PASSWORD);
      cy.visit(`/dashboard/songs/${testSongId}`);
      cy.get('[data-testid="favorite-button"]').click();
      cy.logout();

      // Re-login
      cy.loginAs(STUDENT_EMAIL, STUDENT_PASSWORD);
      cy.visit(`/dashboard/songs/${testSongId}`);

      // Verify still favorited
      cy.get('[data-testid="favorite-button"]')
        .should('have.attr', 'aria-pressed', 'true');
    });
  });
});
```

---

## Critical Code Fixes Required

### 🔴 Fix 1: inviteUser() Authorization (BLOCKING)

**File**: `app/dashboard/actions.ts:120`

**Current Code**:
```typescript
export async function inviteUser(
  email: string,
  fullName: string,
  role: 'student' | 'teacher' | 'admin' = 'student',
  phone?: string
) {
  const supabaseAdmin = createAdminClient();
  // ❌ NO AUTHORIZATION CHECK
}
```

**Required Fix**:
```typescript
export async function inviteUser(
  email: string,
  fullName: string,
  role: 'student' | 'teacher' | 'admin' = 'student',
  phone?: string
) {
  // ✅ ADD AUTHORIZATION CHECK
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    throw new Error('Admin access required');
  }

  const supabaseAdmin = createAdminClient();
  // Continue with invitation logic
}
```

**Test**: `security/auth-server-actions.cy.ts`

---

### 🔴 Fix 2: createShadowUser() Gating

**File**: `app/dashboard/actions.ts:170`

**Current Code**:
```typescript
export async function createShadowUser(studentEmail: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  // ❌ NO ROLE CHECK
}
```

**Required Fix**:
```typescript
export async function createShadowUser(studentEmail: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // ✅ ADD ROLE CHECK
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, is_teacher')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin && !profile?.is_teacher) {
    throw new Error('Admin or Teacher access required');
  }

  const supabaseAdmin = createAdminClient();
  // Continue with shadow user creation
}
```

**Test**: `security/auth-server-actions.cy.ts`

---

### 🟡 Fix 3: Teacher Student Isolation

**File**: `app/api/teacher/students/route.ts:27`

**Current Code**:
```typescript
const { data: students } = await supabase
  .from('profiles')
  .select('id, full_name, user_roles!inner(role)')
  .eq('user_roles.role', 'student')
  .order('full_name');
// ⚠️ Returns ALL students, not filtered to teacher's students
```

**Required Fix**:
```typescript
// Option A: Filter by lessons.teacher_id
const { data: students } = await supabase
  .from('profiles')
  .select(`
    id,
    full_name,
    user_roles!inner(role),
    lessons_as_student!inner(teacher_id)
  `)
  .eq('user_roles.role', 'student')
  .eq('lessons_as_student.teacher_id', user.id)
  .order('full_name');

// Option B: Subquery approach
const { data: lessons } = await supabase
  .from('lessons')
  .select('student_id')
  .eq('teacher_id', user.id);

const studentIds = [...new Set(lessons.map(l => l.student_id))];

const { data: students } = await supabase
  .from('profiles')
  .select('id, full_name')
  .in('id', studentIds)
  .order('full_name');
```

**Test**: `security/teacher-isolation.cy.ts`

---

## Tooling Recommendations

### Cypress Custom Commands Needed

```typescript
// cypress/support/commands.ts

Cypress.Commands.add('loginAs', (email: string, password?: string) => {
  // Existing
});

Cypress.Commands.add('createSong', (songData) => {
  // New: Helper to create test song
});

Cypress.Commands.add('createLesson', (lessonData) => {
  // New: Helper to create test lesson
});

Cypress.Commands.add('createAssignment', (assignmentData) => {
  // New: Helper to create test assignment
});

Cypress.Commands.add('createApiKey', () => {
  // New: Generate API key for testing
});

Cypress.Commands.add('addToFavorites', (songId) => {
  // New: Favorite song via API
});

Cypress.Commands.add('updateSongStatus', (songId, status) => {
  // New: Update song learning status
});

Cypress.Commands.add('callServerAction', (action, args) => {
  // New: Invoke server actions for security testing
});
```

### Test Data Fixtures

```typescript
// cypress/fixtures/test-data.ts

export const TEST_USERS = {
  admin: {
    email: 'p.romanczuk@gmail.com',
    password: 'test123_admin'
  },
  teacher: {
    email: 'teacher@example.com',
    password: 'test123_teacher'
  },
  teacherB: {
    email: 'teacher2@example.com',
    password: 'test123_teacher2'
  },
  student: {
    email: 'student@example.com',
    password: 'test123_student'
  },
  studentB: {
    email: 'teststudent1@example.com',
    password: 'test123_student'
  }
};

export const TEST_SONGS = [
  { title: 'Wonderwall', author: 'Oasis', level: 'beginner' },
  { title: 'Hotel California', author: 'Eagles', level: 'intermediate' },
  { title: 'Eruption', author: 'Van Halen', level: 'advanced' }
];

export const TEST_LESSONS = [
  {
    title: 'First Guitar Lesson',
    scheduled_at: '2026-03-01T10:00:00Z',
    notes: 'Introduction to guitar basics'
  }
];
```

---

## Continuous Testing Strategy

### Pre-Commit
- Run smoke tests (critical-path.cy.ts)
- Run changed feature tests only

### Pre-Deploy (Staging)
- Run full test suite (all 75 tests)
- Generate coverage report
- Verify no regressions

### Production Monitoring
- Synthetic user testing (Datadog, New Relic)
- Error tracking (Sentry)
- Performance monitoring (Vercel Analytics)
- User session recordings (LogRocket, FullStory)

---

## Appendix: Test File Naming Convention

```
cypress/e2e/
├── smoke/                      # Smoke tests (2)
│   ├── critical-path.cy.ts
│   └── api-endpoints.cy.ts
├── auth/                       # Authentication (8)
│   ├── sign-in.cy.ts
│   ├── sign-up-complete.cy.ts
│   ├── email-verification.cy.ts
│   ├── google-oauth.cy.ts
│   ├── password-reset-complete.cy.ts
│   └── session-management.cy.ts
├── security/                   # Security tests (7)
│   ├── auth-server-actions.cy.ts
│   ├── teacher-isolation.cy.ts
│   ├── rls-enforcement.cy.ts
│   ├── api-authentication.cy.ts
│   ├── session-management.cy.ts
│   ├── permission-errors.cy.ts
│   └── role-escalation.cy.ts
├── admin/                      # Admin features (14)
│   ├── admin-dashboard-stats.cy.ts
│   ├── admin-navigation.cy.ts
│   ├── admin-users-crud.cy.ts
│   ├── admin-users-workflow.cy.ts
│   ├── admin-lessons-workflow.cy.ts
│   ├── admin-lessons-enhanced.cy.ts
│   ├── admin-songs-workflow.cy.ts
│   ├── admin-songs-enhanced.cy.ts
│   ├── admin-assignments-crud.cy.ts
│   ├── admin-assignments-workflow.cy.ts
│   ├── admin-spotify-integration.cy.ts
│   ├── admin-health-monitoring.cy.ts
│   ├── admin-analytics.cy.ts
│   └── admin-system-logs.cy.ts
├── teacher/                    # Teacher features (12)
│   ├── teacher-dashboard.cy.ts
│   ├── teacher-lesson-management.cy.ts
│   ├── teacher-student-assignment.cy.ts
│   ├── teacher-student-progress.cy.ts
│   ├── teacher-lesson-analytics.cy.ts
│   └── ...
├── student/                    # Student features (14)
│   ├── student-dashboard.cy.ts
│   ├── student-learning-journey.cy.ts
│   ├── student-lessons.cy.ts
│   ├── student-songs.cy.ts
│   ├── student-assignments.cy.ts
│   ├── student-profile.cy.ts
│   ├── student-access-control.cy.ts
│   ├── student-stats.cy.ts
│   ├── student-practice-timer.cy.ts
│   └── ...
├── features/                   # Feature workflows (15)
│   ├── song-favorites.cy.ts
│   ├── song-status-progression.cy.ts
│   ├── assignment-templates.cy.ts
│   ├── api-key-management.cy.ts
│   ├── settings-complete.cy.ts
│   ├── bulk-operations.cy.ts
│   ├── export-functionality.cy.ts
│   └── ...
├── integration/                # Integration tests (11)
│   ├── google-calendar-sync.cy.ts
│   ├── spotify-workflow.cy.ts
│   ├── email-notifications.cy.ts
│   ├── calendar-webhook.cy.ts
│   ├── lesson-song-workflow.cy.ts
│   ├── data-relationships.cy.ts
│   ├── concurrent-users.cy.ts
│   └── ...
├── onboarding/                 # Onboarding (3)
│   ├── complete-flow.cy.ts
│   ├── student-path.cy.ts
│   └── teacher-path.cy.ts
├── error-handling/             # Error scenarios (5)
│   ├── network-failures.cy.ts
│   ├── validation-errors.cy.ts
│   ├── permission-errors.cy.ts
│   ├── not-found.cy.ts
│   └── server-errors.cy.ts
├── performance/                # Performance (6)
│   ├── large-datasets.cy.ts
│   ├── concurrent-operations.cy.ts
│   ├── real-time-updates.cy.ts
│   ├── dashboard-load-time.cy.ts
│   ├── search-performance.cy.ts
│   └── api-response-time.cy.ts
├── mobile/                     # Mobile tests (3)
│   ├── mobile-navigation.cy.ts
│   ├── responsive-layouts.cy.ts
│   └── touch-interactions.cy.ts
├── accessibility/              # A11y tests (4)
│   ├── keyboard-navigation.cy.ts
│   ├── screen-reader.cy.ts
│   ├── focus-management.cy.ts
│   └── color-contrast.cy.ts
└── workflows/                  # End-to-end workflows (6)
    ├── complete-teacher-workflow.cy.ts
    ├── complete-student-workflow.cy.ts
    ├── lesson-lifecycle.cy.ts
    ├── song-lifecycle.cy.ts
    └── ...
```

**Total**: 75 test files = 100% coverage

---

## Summary & Next Steps

### Current Achievement
✅ Strong foundation with 33 high-quality Cypress tests
✅ Excellent CRUD coverage for core entities
✅ Good role-based access control testing
✅ Comprehensive API endpoint smoke testing

### Immediate Actions Required

1. **Security Fixes** (Week 1)
   - Fix inviteUser() authorization
   - Fix createShadowUser() gating
   - Fix teacher student isolation
   - Write security test suite

2. **Critical Workflow Tests** (Week 2-3)
   - Sign-up + email verification
   - Complete onboarding
   - Song favorites
   - Song status progression
   - Assignment templates

3. **Integration Tests** (Week 4-6)
   - Google Calendar complete flow
   - Spotify integration workflow
   - Email notifications
   - API key management

4. **Polish & Edge Cases** (Week 7-10)
   - Performance testing
   - Mobile responsive
   - Accessibility
   - Error handling expansion

### Success Definition

**100% E2E Coverage Achieved When**:
- ✅ All 75 test files implemented (for features that exist)
- ✅ All P0 security vulnerabilities fixed and tested
- ✅ All critical user workflows tested end-to-end
- ✅ All integration features validated
- ✅ Performance benchmarks met
- ✅ Mobile responsiveness verified
- ✅ Accessibility basics validated

**Estimated Completion**: 10 weeks (2.5 months)
**Team Size**: 1-2 QA engineers + 1 developer for fixes
**Maintenance**: ~4 hours/week to maintain test suite

---

## 🚨 CRITICAL IMPLEMENTATION REMINDER

### Before Implementing ANY Test from This Plan

This document was generated through deep codebase analysis by AI agents. While comprehensive, it may include:

1. **Features that don't exist yet** - Mentioned in comments/docs but not implemented
2. **Partially implemented features** - API exists but UI incomplete (or vice versa)
3. **Planned features** - In roadmap but not yet started
4. **Deprecated features** - Removed but still referenced in old docs

### Mandatory Pre-Test Checklist

**For EVERY test you write, you MUST**:

```bash
# 1. Verify the page/component exists
$ ls app/dashboard/[feature]/page.tsx
# If missing → Feature not implemented → Skip or implement feature first

# 2. Verify the API route exists
$ ls app/api/[feature]/route.ts
# If missing → Backend not ready → Skip or implement API first

# 3. Read the actual implementation
$ cat app/api/[feature]/route.ts
$ cat components/[feature]/Component.tsx
# Understand what it ACTUALLY does, not what it should do

# 4. Check for data-testid attributes
$ grep -r "data-testid" components/[feature]/
# If missing → Add test IDs to implementation first

# 5. Test manually in browser
$ npm run dev
# Visit page, click buttons, verify feature works
# If broken → Fix implementation before writing test

# 6. ONLY THEN write the test
```

### Test Status Labels

When writing tests, use these labels to indicate implementation status:

```typescript
// ✅ VERIFIED: Implementation complete and working
it('should add song to favorites', () => { ... });

// ⚠️ PARTIAL: Feature exists but incomplete (e.g., API exists, UI missing)
it.skip('should add song to favorites via UI', () => {
  // TODO: UI not implemented yet
  // API endpoint verified at app/api/song/favorites/route.ts
  // Waiting for favorite button in components/songs/details/
});

// ❌ NOT IMPLEMENTED: Feature doesn't exist yet
it.skip('should create assignment template', () => {
  // TODO: Templates feature not implemented
  // No route found at app/api/assignments/templates/
  // No component found at components/assignments/templates/
  // BLOCKED: Implement feature before test
});

// 🐛 BUG: Implementation exists but broken
it('should update lesson notes', () => {
  // KNOWN BUG: Notes field not saving (issue #123)
  // Test will fail until bug is fixed
});
```

### Avoiding Wasted Effort

**DON'T**:
- ❌ Write tests based solely on this document
- ❌ Assume features exist because they're in the plan
- ❌ Write tests that will always fail due to missing features
- ❌ Spend time debugging tests when the feature isn't implemented

**DO**:
- ✅ Verify implementation exists first
- ✅ Read actual code to understand behavior
- ✅ Test incrementally (API first, then UI)
- ✅ Use `.skip()` generously for planned features
- ✅ Update this document when you discover features don't exist

### Discovery Process

When you find a feature doesn't exist:

1. **Mark in this document** - Add ❌ NOT IMPLEMENTED label
2. **Create implementation task** - Separate ticket for building the feature
3. **Skip the test** - Use `.skip()` with TODO comment
4. **Move to next test** - Focus on features that do exist
5. **Revisit later** - Return when feature is implemented

---

**Document Version**: 1.0
**Last Updated**: 2026-02-02
**Next Review**: After Phase 1 completion (Week 1)

**⚠️ IMPORTANT**: This is a comprehensive TEST PLAN, not a list of implemented features. Always verify implementation before writing tests.
