# UI Migration Plan (Guitar Mastery Hub -> Guitar CRM)

## Dependencies

- [x] Install `recharts`

## Dashboard Components

- [x] Port `StatCard` component
- [x] Port `RecentActivity` component
- [x] Port `ProgressChart` component
- [x] Port `StudentList` component (Teacher Dashboard)

## Feature Components

- [x] Port `AssignmentList` component
- [x] Port `SongLibrary` component

## Pages

- [x] Update Student Dashboard (`app/student/page.tsx`)
- [x] Create Songs List Page (`app/student/songs/page.tsx`)
- [x] Create Song Detail Page (`app/student/songs/[id]/page.tsx`)
- [x] Create Lessons List Page (`app/student/lessons/page.tsx`)

## Verification & Testing

- [ ] Fix E2E Tests (Connection refused / Auth issues)
- [ ] Verify `DashboardSidebar` logic is fully covered by `RoleBasedNav`
- [ ] Manual verification of Student Portal
