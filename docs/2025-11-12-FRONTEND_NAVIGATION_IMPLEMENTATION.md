# Frontend Navigation Implementation Guide

## Quick Start

This guide shows how to implement the interconnected navigation architecture using the shared components.

## Shared Components Available

All components are in `components/shared/`:

```tsx
import {
  EntityLink,      // Clickable entity links
  EntityCard,      // Card for displaying related items
  RelatedItemsSection, // Section with related items
  StatusBadge,     // Universal status badges
  Breadcrumbs,     // Navigation breadcrumbs
  getStatusVariant, // Helper for status colors
  formatStatus     // Helper for status text
} from '@/components/shared';
```

---

## 1. Making Table Rows Clickable

### Pattern: Entire row clickable with nested links

```tsx
// Example: components/songs/SongList/Row.tsx
import { EntityLink } from '@/components/shared';

function SongRow({ song }) {
  return (
    <tr
      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
      onClick={() => router.push(`/dashboard/songs/${song.id}`)}
    >
      <td>
        <EntityLink
          href={`/dashboard/songs/${song.id}`}
          onClick={(e) => e.stopPropagation()}
        >
          {song.title}
        </EntityLink>
      </td>
      <td>
        <EntityLink
          href={`/dashboard/users/${song.user_id}`}
          onClick={(e) => e.stopPropagation()}
          variant="subtle"
        >
          {song.author}
        </EntityLink>
      </td>
    </tr>
  );
}
```

**Key Points:**
- Add `cursor-pointer` to row
- Use `onClick` on row to navigate
- Use `stopPropagation()` on nested links
- Use `EntityLink` for consistent styling

---

## 2. Adding Related Items to Detail Pages

### Pattern: Show related entities in sections

```tsx
// Example: app/dashboard/songs/[id]/page.tsx
import { RelatedItemsSection, EntityLink, StatusBadge } from '@/components/shared';

export default async function SongDetailPage({ params }) {
  const { id } = await params;
  const song = await fetchSong(id);
  const lessons = await fetchLessonsUsingSong(id);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Song info here */}

      <RelatedItemsSection
        title="Lessons Using This Song"
        items={lessons.map(lesson => ({
          id: lesson.id,
          href: `/dashboard/lessons/${lesson.id}`,
          title: `Lesson #${lesson.lesson_teacher_number}`,
          subtitle: formatDate(lesson.scheduled_at),
          badge: <StatusBadge variant={getStatusVariant(lesson.status)}>
            {formatStatus(lesson.status)}
          </StatusBadge>,
          metadata: [
            {
              label: 'Student',
              value: <EntityLink href={`/dashboard/users/${lesson.student_id}`}>
                {lesson.student.full_name}
              </EntityLink>
            },
            {
              label: 'Teacher',
              value: <EntityLink href={`/dashboard/users/${lesson.teacher_id}`}>
                {lesson.teacher.full_name}
              </EntityLink>
            }
          ]
        }))}
        emptyMessage="This song hasn't been used in any lessons yet"
        createAction={{
          label: 'Add to Lesson',
          href: `/dashboard/lessons/new?song=${id}`
        }}
      />
    </div>
  );
}
```

---

## 3. Adding Breadcrumbs Navigation

```tsx
import { Breadcrumbs } from '@/components/shared';

export default function LessonDetailPage({ params }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Lessons', href: '/dashboard/lessons' },
        { label: `Lesson #${lessonNumber}` } // No href = current page
      ]} />

      {/* Rest of page */}
    </div>
  );
}
```

---

## 4. Using Status Badges Consistently

```tsx
import { StatusBadge, getStatusVariant, formatStatus } from '@/components/shared';

// Automatic variant selection
<StatusBadge variant={getStatusVariant(lesson.status)}>
  {formatStatus(lesson.status)}
</StatusBadge>

// Manual variant
<StatusBadge variant="success">Completed</StatusBadge>
<StatusBadge variant="warning">Pending</StatusBadge>
<StatusBadge variant="danger">Overdue</StatusBadge>
```

**Available Variants:**
- `default`, `gray` - Gray (default, to_learn)
- `success`, `green` - Green (completed, mastered, beginner)
- `warning`, `yellow` - Yellow (pending, remembered, intermediate)
- `danger`, `red` - Red (overdue, cancelled, advanced)
- `info`, `blue` - Blue (scheduled, started, in_progress)
- `purple` - Purple (with_author)

---

## 5. Entity Cards in Grids

```tsx
import { EntityCard, StatusBadge, EntityLink } from '@/components/shared';

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <EntityCard
      key={item.id}
      title={item.title}
      subtitle={item.subtitle}
      href={`/dashboard/items/${item.id}`}
      badge={<StatusBadge variant="success">Active</StatusBadge>}
      metadata={[
        { label: 'Created', value: formatDate(item.created_at) },
        { label: 'Owner', value: <EntityLink href={`/users/${item.owner_id}`}>
          {item.owner.name}
        </EntityLink> }
      ]}
    />
  ))}
</div>
```

---

## Implementation Checklist by Entity

### Songs Detail Page

- [ ] Create `/app/dashboard/songs/[id]/page.tsx`
- [ ] Add breadcrumbs navigation
- [ ] Create API endpoint: `GET /api/songs/[id]/lessons`
- [ ] Add `RelatedItemsSection` for lessons using this song
- [ ] Add `RelatedItemsSection` for students learning this song
- [ ] Make song list rows clickable

### Assignments List & Detail

- [ ] Create `/components/assignments/AssignmentList/Row.tsx` - clickable rows
- [ ] Create `/app/dashboard/assignments/[id]/page.tsx`
- [ ] Add breadcrumbs navigation
- [ ] Link to user in assignment detail
- [ ] Link to lesson in assignment detail (if exists)
- [ ] Link to song in assignment detail (if exists)
- [ ] Create API endpoints for assignments CRUD

### Lessons Detail - Add Assignments

- [ ] Create `/components/lessons/LessonAssignments.tsx`
- [ ] Create API endpoint: `GET /api/lessons/[id]/assignments`
- [ ] Add to lesson detail page below LessonSongs
- [ ] Link assignments to assignment detail page

### Users Detail - Enhance

- [ ] Refactor existing sections to use `RelatedItemsSection`
- [ ] Use `EntityCard` for lessons/assignments/songs
- [ ] Add breadcrumbs navigation
- [ ] Ensure all items are clickable

---

## API Endpoints to Create

```typescript
// Songs
GET /api/songs/[id]/lessons      // Lessons using this song
GET /api/songs/[id]/students     // Students learning this song
GET /api/songs/[id]/teachers     // Teachers teaching this song

// Lessons
GET /api/lessons/[id]/assignments // Assignments for this lesson

// Assignments
GET /api/assignments              // List all (with filters)
GET /api/assignments/[id]         // Single assignment
POST /api/assignments             // Create assignment
PATCH /api/assignments/[id]       // Update assignment
DELETE /api/assignments/[id]      // Delete assignment
```

---

## Testing Navigation

### Manual Test Flow

1. **Lessons → Users**
   - [ ] Click student name in lesson table → goes to user detail
   - [ ] Click teacher name in lesson table → goes to user detail
   - [ ] From user detail, click lesson → goes to lesson detail

2. **Lessons → Songs**
   - [ ] From lesson detail, click song → goes to song detail
   - [ ] From song detail, click lesson → goes back to lesson

3. **Songs → Users**
   - [ ] From song detail, click student name → goes to user detail
   - [ ] From song detail, click teacher name → goes to user detail

4. **Assignments**
   - [ ] From assignment list, click row → goes to assignment detail
   - [ ] From assignment detail, click user → goes to user detail
   - [ ] From assignment detail, click lesson → goes to lesson detail

5. **Breadcrumbs**
   - [ ] Click any breadcrumb link → navigates correctly
   - [ ] Current page shows in bold without link

---

## Example: Complete Song Detail Page

```tsx
// app/dashboard/songs/[id]/page.tsx
import {
  Breadcrumbs,
  RelatedItemsSection,
  EntityLink,
  StatusBadge,
  getStatusVariant,
  formatStatus
} from '@/components/shared';

export default async function SongDetailPage({ params }) {
  const { id } = await params;
  const song = await fetchSong(id);
  const lessons = await fetchLessonsUsingSong(id);
  const students = await fetchStudentsLearningSong(id);

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Songs', href: '/dashboard/songs' },
        { label: song.title }
      ]} />

      {/* Song Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">{song.title}</h1>
        <p className="text-gray-600 dark:text-gray-400">by {song.author}</p>
        <div className="flex gap-2 mt-4">
          <StatusBadge variant={getStatusVariant(song.level)}>
            {formatStatus(song.level)}
          </StatusBadge>
          <StatusBadge variant="gray">{song.key}</StatusBadge>
        </div>
      </div>

      {/* Lessons Using This Song */}
      <RelatedItemsSection
        title="Lessons Using This Song"
        items={lessons.map(lesson => ({
          id: lesson.id,
          href: `/dashboard/lessons/${lesson.id}`,
          title: `Lesson #${lesson.lesson_teacher_number}`,
          subtitle: formatDate(lesson.scheduled_at),
          badge: <StatusBadge variant={getStatusVariant(lesson.status)}>
            {formatStatus(lesson.status)}
          </StatusBadge>,
          metadata: [
            {
              label: 'Student',
              value: <EntityLink href={`/dashboard/users/${lesson.student_id}`}>
                {lesson.student.full_name}
              </EntityLink>
            },
            {
              label: 'Teacher',
              value: <EntityLink href={`/dashboard/users/${lesson.teacher_id}`}>
                {lesson.teacher.full_name}
              </EntityLink>
            },
            {
              label: 'Progress',
              value: <StatusBadge variant={getStatusVariant(lesson.song_status)}>
                {formatStatus(lesson.song_status)}
              </StatusBadge>
            }
          ]
        }))}
        emptyMessage="This song hasn't been used in any lessons yet"
        createAction={{
          label: 'Add to Lesson',
          href: `/dashboard/lessons/new?song=${id}`
        }}
      />

      {/* Students Learning This Song */}
      <RelatedItemsSection
        title="Students Learning This Song"
        items={students.map(student => ({
          id: student.id,
          href: `/dashboard/users/${student.id}`,
          title: student.full_name || student.email,
          subtitle: `${student.lessons_count} lessons`,
          badge: <StatusBadge variant={getStatusVariant(student.progress_status)}>
            {formatStatus(student.progress_status)}
          </StatusBadge>,
          metadata: [
            {
              label: 'Teacher',
              value: <EntityLink href={`/dashboard/users/${student.teacher_id}`}>
                {student.teacher.full_name}
              </EntityLink>
            },
            {
              label: 'Last Lesson',
              value: formatDate(student.last_lesson_date)
            }
          ]
        }))}
        emptyMessage="No students are learning this song yet"
      />
    </div>
  );
}
```

---

## Best Practices

### 1. Always Use EntityLink for Entity Navigation
❌ Bad:
```tsx
<Link href="/dashboard/users/123" className="text-blue-600 hover:underline">
  John Doe
</Link>
```

✅ Good:
```tsx
<EntityLink href="/dashboard/users/123">John Doe</EntityLink>
```

### 2. Use stopPropagation for Nested Clicks
❌ Bad:
```tsx
<tr onClick={() => navigate(href)}>
  <td><Link href="/other">Link</Link></td> {/* Navigates to both! */}
</tr>
```

✅ Good:
```tsx
<tr onClick={() => navigate(href)}>
  <td>
    <EntityLink href="/other" onClick={(e) => e.stopPropagation()}>
      Link
    </EntityLink>
  </td>
</tr>
```

### 3. Use Helpers for Status Display
❌ Bad:
```tsx
<span className="px-2 py-1 bg-green-100 text-green-800">
  {lesson.status}
</span>
```

✅ Good:
```tsx
<StatusBadge variant={getStatusVariant(lesson.status)}>
  {formatStatus(lesson.status)}
</StatusBadge>
```

### 4. Consistent Loading States
```tsx
<RelatedItemsSection
  title="Lessons"
  items={lessons}
  loading={isLoading}  // Shows skeleton loaders
/>
```

---

## Next Steps

1. ✅ Shared components created
2. 🔄 Refactor existing LessonSongs to use RelatedItemsSection
3. 🔄 Create song detail page with related lessons
4. 🔄 Create assignment CRUD with navigation
5. 🔄 Add breadcrumbs to all detail pages
6. 🔄 Make all table rows clickable
7. 🔄 Add tests for navigation flows
