# Frontend Navigation Architecture

## Overview

This document defines the interconnected navigation architecture for Guitar CRM, where all entities (Users, Songs, Lessons, Assignments) are clickable and link to each other, creating a seamless, interconnected user experience.

## Entity Relationship Map

```
┌─────────────────────────────────────────────────────────────┐
│                     Navigation Graph                        │
└─────────────────────────────────────────────────────────────┘

    USERS                LESSONS              SONGS
    ┌─────┐              ┌─────┐              ┌─────┐
    │User │◄────────────►│Lesson│◄────────────►│Song │
    │     │  teacher/    │      │  lesson_    │     │
    │     │  student     │      │  songs      │     │
    └─────┘              └─────┘              └─────┘
       │                    │                    │
       │                    │                    │
       │                    ▼                    │
       │              ┌──────────┐               │
       └─────────────►│Assignment│◄──────────────┘
                      │          │
                      └──────────┘
```

## Navigation Patterns by Entity

### 1. Users (Profiles)

**List View (`/dashboard/users`):**

- Click user name/row → `/dashboard/users/[id]`
- Role badges (Admin, Teacher, Student) - visual only

**Detail View (`/dashboard/users/[id]`):**

- **Outgoing Links:**
  - Lessons section: Click lesson → `/dashboard/lessons/[id]`
  - Assignments section: Click assignment → `/dashboard/assignments/[id]`
  - Songs section: Click song → `/dashboard/songs/[id]`
  - If teacher: "View as Teacher" → `/dashboard/lessons?teacher=[id]`
  - If student: "View as Student" → `/dashboard/lessons?student=[id]`

**Components Needed:**

```
components/users/
├── UserList/
│   ├── Row.tsx              // Clickable user rows
│   └── RoleBadge.tsx        // Admin/Teacher/Student badges
├── UserDetail/
│   ├── Header.tsx           // User info + quick links
│   ├── LessonsSection.tsx   // Related lessons (clickable)
│   ├── AssignmentsSection.tsx // Related assignments (clickable)
│   └── SongsSection.tsx     // Related songs (clickable)
```

---

### 2. Lessons

**List View (`/dashboard/lessons`):**

- ✅ Click student name → `/dashboard/users/[student_id]`
- ✅ Click teacher name → `/dashboard/users/[teacher_id]`
- ✅ Click row → `/dashboard/lessons/[id]`
- ✅ Filter by status

**Detail View (`/dashboard/lessons/[id]`):**

- **Outgoing Links:**
  - ✅ Student name → `/dashboard/users/[student_id]`
  - ✅ Teacher name → `/dashboard/users/[teacher_id]`
  - ✅ Each song → `/dashboard/songs/[song_id]`
  - 🔄 Each assignment → `/dashboard/assignments/[id]` (TODO)
  - Action: "Add Song" → Modal/inline form
  - Action: "Create Assignment" → `/dashboard/assignments/new?lesson=[id]`

**Components Status:**

```
components/lessons/
├── ✅ LessonList/           // IMPLEMENTED
├── ✅ LessonTable.Row.tsx   // IMPLEMENTED - clickable
├── ✅ LessonSongs.tsx       // IMPLEMENTED - shows songs
├── 🔄 LessonAssignments.tsx // TODO - show assignments
└── 🔄 LessonQuickActions.tsx // TODO - add song/assignment buttons
```

---

### 3. Songs

**List View (`/dashboard/songs`):**

- Click song title/row → `/dashboard/songs/[id]`
- Filter by level, key
- Search by title/author

**Detail View (`/dashboard/songs/[id]`):**

- **Outgoing Links:**
  - **NEW**: "Used in Lessons" section
    - Click lesson → `/dashboard/lessons/[id]`
    - Show: Date, Student name (clickable), Teacher name (clickable), Status
  - **NEW**: "Learned by Students" section
    - Click student → `/dashboard/users/[student_id]`
    - Show: Student name, Progress status, Last lesson date
  - **NEW**: "Taught by Teachers" section
    - Click teacher → `/dashboard/users/[teacher_id]`
    - Show: Teacher name, # of students learning this song
  - Action: "Add to Lesson" → Select lesson dropdown

**Components Needed:**

```
components/songs/
├── SongList/
│   ├── Row.tsx              // TODO - make clickable
│   └── Filters.tsx          // Existing
├── SongDetail/
│   ├── Header.tsx           // Song info
│   ├── LessonsSection.tsx   // NEW - lessons using this song
│   ├── StudentsSection.tsx  // NEW - students learning this
│   └── TeachersSection.tsx  // NEW - teachers teaching this
└── SongQuickActions.tsx     // NEW - add to lesson button
```

---

### 4. Assignments

**List View (`/dashboard/assignments`):**

- Click assignment title/row → `/dashboard/assignments/[id]`
- Click user name → `/dashboard/users/[user_id]`
- Filter by status (pending, completed, overdue)
- Filter by user

**Detail View (`/dashboard/assignments/[id]`):**

- **Outgoing Links:**
  - User name → `/dashboard/users/[user_id]`
  - Related lesson (if any) → `/dashboard/lessons/[lesson_id]`
  - Related song (if any) → `/dashboard/songs/[song_id]`
  - Action: "Mark Complete" → Update status
  - Action: "Link to Lesson" → Select lesson dropdown

**Components Needed:**

```
components/assignments/
├── AssignmentList/
│   ├── Row.tsx              // TODO - clickable rows
│   ├── Filters.tsx          // TODO - status/user filters
│   └── StatusBadge.tsx      // TODO - pending/complete/overdue
├── AssignmentDetail/
│   ├── Header.tsx           // TODO - assignment info
│   ├── UserSection.tsx      // TODO - assigned user (clickable)
│   ├── LessonSection.tsx    // TODO - related lesson (clickable)
│   └── SongSection.tsx      // TODO - related song (clickable)
└── AssignmentQuickActions.tsx // TODO - complete/link actions
```

---

## Reusable Navigation Components

### EntityLink Component

**Purpose:** Consistent styling for all entity links across the app

```tsx
// components/shared/EntityLink.tsx
interface EntityLinkProps {
  href: string;
  children: React.ReactNode;
  variant?: 'default' | 'subtle' | 'bold';
  icon?: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
}

// Usage:
<EntityLink href="/dashboard/users/123" icon={<UserIcon />}>
  John Doe
</EntityLink>
```

**Styling:**

- Default: `text-blue-600 dark:text-blue-400 hover:underline font-medium`
- Subtle: `text-gray-700 dark:text-gray-300 hover:text-blue-600`
- Bold: `text-lg font-semibold text-blue-600 hover:underline`

---

### EntityCard Component

**Purpose:** Display related entities in sections (e.g., "Lessons using this song")

```tsx
// components/shared/EntityCard.tsx
interface EntityCardProps {
  title: string;
  subtitle?: string;
  href: string;
  badge?: React.ReactNode;
  metadata?: Array<{ label: string; value: string | React.ReactNode }>;
  actions?: React.ReactNode;
}

// Usage:
<EntityCard
  title="Lesson #5"
  subtitle="Oct 25, 2025"
  href="/dashboard/lessons/123"
  badge={<StatusBadge status="completed" />}
  metadata={[
    { label: 'Student', value: <EntityLink href="/users/1">John</EntityLink> },
    { label: 'Teacher', value: <EntityLink href="/users/2">Sarah</EntityLink> }
  ]}
/>
```

---

### RelatedItemsSection Component

**Purpose:** Standardized section for showing related entities

```tsx
// components/shared/RelatedItemsSection.tsx
interface RelatedItemsSectionProps {
  title: string;
  icon?: React.ReactNode;
  items: Array<{
    id: string;
    href: string;
    title: string;
    subtitle?: string;
    badge?: React.ReactNode;
    metadata?: Record<string, React.ReactNode>;
  }>;
  emptyMessage?: string;
  createAction?: {
    label: string;
    href: string;
  };
}

// Usage:
<RelatedItemsSection
  title="Lessons Using This Song"
  icon={<MusicIcon />}
  items={lessons}
  emptyMessage="This song hasn't been used in any lessons yet"
  createAction={{ label: 'Add to Lesson', href: '/dashboard/lessons/new' }}
/>
```

---

## Detail Page Layout Standard

All entity detail pages follow this structure:

```tsx
<div className="container mx-auto px-4 py-8">
  {/* Breadcrumbs */}
  <Breadcrumbs items={[
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Lessons', href: '/dashboard/lessons' },
    { label: `Lesson #${id}`, href: `/dashboard/lessons/${id}` }
  ]} />

  {/* Header Section */}
  <EntityHeader
    title="Lesson #5"
    subtitle="October 25, 2025"
    badge={<StatusBadge status="completed" />}
    actions={<EditButton />}
  />

  {/* Main Content Grid */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
    {/* Primary Info (2/3 width on desktop) */}
    <div className="lg:col-span-2 space-y-6">
      <InfoCard title="Details">
        {/* Entity-specific details */}
      </InfoCard>

      <RelatedItemsSection title="Songs" items={songs} />
      <RelatedItemsSection title="Assignments" items={assignments} />
    </div>

    {/* Sidebar (1/3 width on desktop) */}
    <div className="space-y-6">
      <QuickLinksCard>
        <EntityLink href="/dashboard/users/1">View Student</EntityLink>
        <EntityLink href="/dashboard/users/2">View Teacher</EntityLink>
      </QuickLinksCard>

      <ActionsCard>
        <Button>Add Song</Button>
        <Button>Create Assignment</Button>
      </ActionsCard>
    </div>
  </div>
</div>
```

---

## Click Behavior Standards

### 1. Table Rows

**Pattern:** Entire row clickable, nested links use `stopPropagation()`

```tsx
<tr
  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
  onClick={() => router.push(`/dashboard/entity/${id}`)}
>
  <td>
    <EntityLink
      href="/dashboard/users/123"
      onClick={(e) => e.stopPropagation()}
    >
      John Doe
    </EntityLink>
  </td>
</tr>
```

### 2. Cards

**Pattern:** Click anywhere on card, explicit action buttons

```tsx
<div
  className="border rounded-lg p-4 hover:border-blue-500 cursor-pointer"
  onClick={() => router.push(`/dashboard/entity/${id}`)}
>
  <h3 className="font-semibold">{title}</h3>
  <button onClick={(e) => { e.stopPropagation(); handleAction(); }}>
    Action
  </button>
</div>
```

### 3. Lists

**Pattern:** Each list item is a link with hover state

```tsx
<Link
  href={`/dashboard/entity/${id}`}
  className="block p-4 border-b hover:bg-gray-50 dark:hover:bg-gray-800"
>
  <div className="flex items-center justify-between">
    <span>{title}</span>
    <ChevronRightIcon />
  </div>
</Link>
```

---

## Visual Feedback Standards

### Hover States

```css
/* Links */
.entity-link:hover {
  @apply underline text-blue-700 dark:text-blue-300;
}

/* Rows */
.clickable-row:hover {
  @apply bg-gray-50 dark:bg-gray-700 scale-[1.01] transition-transform;
}

/* Cards */
.entity-card:hover {
  @apply border-blue-500 shadow-md;
}
```

### Active States

```css
/* Currently viewing */
.entity-link.active {
  @apply font-bold text-blue-600 dark:text-blue-400;
}

/* Selected row */
.clickable-row.selected {
  @apply bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600;
}
```

### Loading States

```tsx
<EntityCard
  loading={true}
  skeleton={<SkeletonLoader />}
/>
```

---

## Mobile Considerations

### Touch Targets

- Minimum 44x44px for all clickable areas
- Increase padding on mobile: `py-3 sm:py-2`
- Stack metadata vertically on mobile

### Navigation

- Use bottom sheet for quick actions on mobile
- Breadcrumbs collapse to back button on mobile
- Card grids become single column: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

---

## API Endpoints Needed

### Songs

```
GET /api/songs/[id]/lessons      - Lessons using this song
GET /api/songs/[id]/students     - Students learning this song
GET /api/songs/[id]/teachers     - Teachers teaching this song
```

### Assignments

```
GET /api/assignments             - List assignments (with filters)
GET /api/assignments/[id]        - Single assignment with relations
POST /api/assignments            - Create assignment
PATCH /api/assignments/[id]      - Update assignment
DELETE /api/assignments/[id]     - Delete assignment
```

### Users

```
GET /api/users/[id]/lessons      - Already exists
GET /api/users/[id]/assignments  - Already exists
GET /api/users/[id]/songs        - Already exists
```

### Lessons

```
GET /api/lessons/[id]/songs        - ✅ Already exists
GET /api/lessons/[id]/assignments  - TODO: Needed
```

---

## Implementation Priority

### Phase 1: Core Navigation (Current Sprint)

1. ✅ Lessons table - clickable rows and user links
2. ✅ Lesson detail - show songs
3. 🔄 Song detail - show related lessons
4. 🔄 Assignment list - clickable rows

### Phase 2: Reusable Components

1. Create `EntityLink` component
2. Create `EntityCard` component
3. Create `RelatedItemsSection` component
4. Create `Breadcrumbs` component

### Phase 3: Full Interconnection

1. Song detail with lessons/students/teachers
2. Assignment detail with user/lesson/song links
3. User detail with all related entities (already exists, enhance)
4. Add quick action buttons everywhere

### Phase 4: Polish

1. Add loading skeletons
2. Add error boundaries
3. Add empty states
4. Add keyboard navigation
5. Add accessibility labels

---

## File Structure

```
components/
├── shared/
│   ├── EntityLink.tsx           // NEW - reusable link component
│   ├── EntityCard.tsx           // NEW - reusable card component
│   ├── RelatedItemsSection.tsx  // NEW - related items display
│   ├── Breadcrumbs.tsx          // NEW - navigation breadcrumbs
│   ├── StatusBadge.tsx          // NEW - universal status badges
│   └── QuickActions.tsx         // NEW - action buttons
│
├── users/
│   └── UserDetail/
│       ├── LessonsSection.tsx   // Shows user's lessons
│       ├── AssignmentsSection.tsx // Shows user's assignments
│       └── SongsSection.tsx     // Shows user's songs
│
├── lessons/
│   ├── ✅ LessonTable.Row.tsx   // DONE
│   ├── ✅ LessonSongs.tsx       // DONE
│   └── LessonAssignments.tsx    // TODO
│
├── songs/
│   └── SongDetail/
│       ├── LessonsSection.tsx   // NEW - lessons using song
│       ├── StudentsSection.tsx  // NEW - students learning
│       └── TeachersSection.tsx  // NEW - teachers teaching
│
└── assignments/
    ├── AssignmentList/
    │   └── Row.tsx              // TODO - clickable rows
    └── AssignmentDetail/
        ├── UserSection.tsx      // TODO - assigned user
        ├── LessonSection.tsx    // TODO - related lesson
        └── SongSection.tsx      // TODO - related song
```

---

## Testing Checklist

### Navigation Tests

- [ ] Click user name in lesson table → navigates to user detail
- [ ] Click teacher name in lesson table → navigates to teacher detail
- [ ] Click lesson row → navigates to lesson detail
- [ ] Click song in lesson detail → navigates to song detail
- [ ] Click lesson in song detail → navigates to lesson detail
- [ ] Click student in song detail → navigates to student detail
- [ ] Click assignment in user detail → navigates to assignment detail
- [ ] Nested links don't trigger parent click handlers

### Mobile Tests

- [ ] All touch targets are 44x44px minimum
- [ ] Tables are horizontally scrollable on mobile
- [ ] Cards stack properly on mobile
- [ ] Bottom sheets work for quick actions

### Accessibility Tests

- [ ] All links have descriptive text
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] Screen readers announce link destinations
- [ ] Focus states are visible
- [ ] Color contrast meets WCAG AA standards

---

## Example Implementations

See:

- ✅ `components/lessons/LessonTable.Row.tsx` - Clickable rows with nested links
- ✅ `components/lessons/LessonSongs.tsx` - Related items section
- ✅ `app/dashboard/users/[id]/page.tsx` - Entity detail with multiple relations
