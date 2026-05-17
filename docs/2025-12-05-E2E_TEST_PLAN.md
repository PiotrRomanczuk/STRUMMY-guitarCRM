# Comprehensive E2E Test Plan

This document outlines the strategy for End-to-End (E2E) testing of the Guitar CRM application, focusing on Role-Based Access Control (RBAC) and entity management for Admins, Teachers, and Students.

## 📂 Proposed Directory Structure

We will organize tests by User Role to clearly separate concerns and permissions.

```text
cypress/e2e/
├── admin/
│   ├── users.cy.ts          # User management (Teachers, Students)
│   ├── lessons.cy.ts        # Global lesson management
│   ├── songs.cy.ts          # Global song library
│   └── system.cy.ts         # System config & analytics
├── teacher/
│   ├── students.cy.ts       # My Students management
│   ├── lessons.cy.ts        # Lesson CRUD & Calendar Import
│   ├── songs.cy.ts          # Song Library (My Songs vs Public)
│   └── assignments.cy.ts    # Assignment creation & tracking
├── student/
│   ├── dashboard.cy.ts      # Dashboard overview & stats
│   ├── lessons.cy.ts        # Viewing assigned lessons
│   ├── songs.cy.ts          # Viewing assigned songs
│   └── assignments.cy.ts    # Tracking & completing assignments
├── auth/
│   ├── login.cy.ts          # Login flows
│   ├── reset-password.cy.ts # Password recovery
│   └── rbac.cy.ts           # Global permission checks (redirects)
└── shared/
    └── shadow-users.cy.ts   # Shadow user lifecycle (Import -> Claim)
```

---

## 🧪 Detailed Test Scenarios

### 1. 👮 Admin Role
*Admins have full system access. Tests must verify they can manage ALL data regardless of ownership.*

#### **Users (`admin/users.cy.ts`)**
- [x] **Create Teacher**: Create a new teacher profile, verify email invite.
- [x] **Create Student**: Create a new student, assign to a specific teacher.
- [x] **Edit User**: Change a user's role or details.
- [x] **Soft Delete**: Delete a user, verify they disappear from lists but remain in DB (via API).
- [x] **Hard Delete**: (If implemented) Permanently remove a user.

#### **Lessons (`admin/lessons.cy.ts`)**
- [x] **View All**: Verify Admin sees lessons from Teacher A AND Teacher B.
- [x] **Override**: Edit a lesson created by a Teacher.
- [x] **Delete**: Delete any lesson in the system.

#### **Songs (`admin/songs.cy.ts`)**
- [x] **Global Library**: View all songs (Public + Private Teacher songs).
- [x] **Manage**: Edit or delete any song.

---

### 2. 🧑‍🏫 Teacher Role
*Teachers manage their own ecosystem. Tests must verify isolation (cannot see others' data).*

#### **Students (`teacher/students.cy.ts`)**
- [x] **Create Student**: Add a new student to their roster.
- [x] **View Roster**: Verify ONLY their own students are listed.
- [x] **Isolation**: Ensure Student X (belonging to Teacher B) is NOT visible.
- [x] **Edit Student**: Update notes or details for their student.

#### **Lessons (`teacher/lessons.cy.ts`)**
- [x] **Create Lesson**: Create a lesson for one of their students.
- [x] **Google Import**:
    - Connect Google Calendar (mocked).
    - Import an event -> Verify Lesson creation.
    - **Shadow User**: Import event with new email -> Verify Shadow User creation.
- [x] **Edit Lesson**: Update notes, change date/time.
- [x] **Delete Lesson**: Remove a lesson.
- [x] **Isolation**: Try to access a lesson ID belonging to another teacher (expect 403/404).

#### **Songs (`teacher/songs.cy.ts`)**
- [x] **Create Song**: Add a new song to library.
- [x] **Edit Own Song**: Modify a song they created.
- [x] **View Public**: View songs marked as "Public" (system songs).
- [x] **Restriction**: Try to edit a "Public" song (expect disabled/hidden).
- [x] **Restriction**: Try to view/edit a private song from another teacher.

#### **Assignments (`teacher/assignments.cy.ts`)**
- [x] **Assign**: Create a task for a student (e.g., "Practice Scale X").
- [x] **Link Content**: Attach a Song or Lesson to the assignment.
- [x] **Track**: View completion status of assigned tasks.

---

### 3. 👨‍🎓 Student Role
*Students have read-only access to their own data and limited interaction capabilities.*

#### **Lessons (`student/lessons.cy.ts`)**
- [x] **View List**: See list of past and upcoming lessons.
- [x] **View Details**: Open a lesson, read teacher's notes.
- [x] **No Edit**: Verify NO "Edit" or "Delete" buttons exist.
- [x] **Isolation**: Try to view a lesson ID not assigned to them (expect 403).

#### **Songs (`student/songs.cy.ts`)**
- [x] **View Assigned**: See songs assigned by their teacher.
- [x] **View Details**: View lyrics/tabs/attachments.
- [x] **No Library Access**: Verify they cannot browse the entire song library (only assigned).

#### **Assignments (`student/assignments.cy.ts`)**
- [x] **View Tasks**: See list of pending assignments.
- [x] **Interact**: Mark an assignment as "In Progress" or "Complete" (if feature exists).
- [x] **Filter**: Filter assignments by status (Pending vs Completed).

---

### 4. 🔄 Shared & Advanced Flows

#### **Shadow Users (`shared/shadow-users.cy.ts`)**
- [x] **Creation**: Teacher imports lesson for `new@email.com` -> Shadow User created.
- [x] **Block Login**: Try to login as `new@email.com` (expect failure/not allowed).
- [x] **Promotion**: Admin/Teacher "invites" Shadow User -> Becomes real User.

#### **Authentication & RBAC (`auth/rbac.cy.ts`)**
- [x] **Redirects**:
    - Student visits `/dashboard/admin` -> Redirect to `/dashboard/student`.
    - Teacher visits `/dashboard/admin` -> Redirect to `/dashboard/teacher`.
- [x] **Unauthenticated**: Visit any `/dashboard/*` route -> Redirect to `/login`.

#### **Soft Delete Verification**
- [x] **Entity Disappearance**:
  - Teacher deletes a Song.
  - Verify Song is gone from UI list.
  - (API Check) Verify Song exists in DB with `deleted_at` timestamp.

---

### 5. 🔗 Integration & Filtering Scenarios
*Tests focusing on the relationships between entities and advanced filtering capabilities.*

#### **Admin: Deep Filtering**
- [x] **Student History**: Select a Student -> View ALL their lessons (across time).
- [x] **Teacher Audit**: Select a Teacher -> View ALL lessons they have taught.
- [x] **Song Usage (Global)**: Select a Song -> View list of ALL lessons where this song was used (across all teachers).
- [x] **Orphaned Data**: View students who have no assigned teacher (if applicable).

#### **Teacher: Student & Content Insights**
- [x] **Student Drill-down**:
  - Click Student X from Roster.
  - Verify view shows ONLY Lesson history for Student X.
  - Verify view shows ONLY Assignments for Student X.
- [x] **Song Usage (Local)**:
  - Select a Song from Library.
  - View "Used In" list: See which of *my* lessons/students used this song.
- [x] **Assignment Cross-Ref**:
  - View an Assignment.
  - Click linked Song -> Navigates to Song Details.
  - Click linked Lesson -> Navigates to Lesson Details.

#### **Student: Contextual Navigation**

- [x] **Lesson -> Song**: Open a Lesson -> Click assigned Song -> View Song Details.
- [x] **Assignment -> Context**: Open Assignment -> Click "View Lesson" -> Navigates to the specific lesson where it was assigned.

#### **Cross-Filtered Detail Views**

- [ ] **Assignment Detail**:
  - Verify presence of Student, Teacher, and Lesson context cards.
  - Verify "Related Songs" list is derived from the parent Lesson.
  - Click links to navigate to respective detail pages.
- [ ] **Song Detail**:
  - Verify "Related Assignments" section lists assignments from lessons using this song.
  - Verify "Active Students" list links to User Detail pages.
- [ ] **User Detail**:
  - Verify "Assignments" section has filters (Active/Past) and lists correct items.
  - Verify "Repertoire" section shows songs with correct status (e.g., "Mastered").
- [ ] **Lesson Detail**:
  - Verify Assignments list items link to the new Assignment Detail page.
