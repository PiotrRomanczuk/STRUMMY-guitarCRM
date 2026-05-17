# Frontend Navigation Architecture - Implementation TODO

**Created:** November 12, 2025
**Status:** Phase 1 - Shared Components Complete

## Overview

This TODO tracks the implementation of the interconnected navigation architecture where all entities (Users, Songs, Lessons, Assignments) link to each other seamlessly.

## ✅ Phase 1: Shared Components (COMPLETE)

- [x] Create `EntityLink` component - Consistent link styling
- [x] Create `EntityCard` component - Card for displaying related items
- [x] Create `RelatedItemsSection` component - Section for related entities
- [x] Create `StatusBadge` component - Universal status badges with helpers
- [x] Create `Breadcrumbs` component - Navigation breadcrumbs
- [x] Create `components/shared/index.ts` - Export all shared components
- [x] Create architecture documentation - `FRONTEND_NAVIGATION_2025-12-05-ARCHITECTURE.md`
- [x] Create implementation guide - `2025-11-12-FRONTEND_NAVIGATION_IMPLEMENTATION.md`

**Files Created:**

- `components/shared/EntityLink.tsx`
- `components/shared/EntityCard.tsx`
- `components/shared/RelatedItemsSection.tsx`
- `components/shared/StatusBadge.tsx`
- `components/shared/Breadcrumbs.tsx`
- `components/shared/index.ts`
- `docs/FRONTEND_NAVIGATION_2025-12-05-ARCHITECTURE.md`
- `docs/2025-11-12-FRONTEND_NAVIGATION_IMPLEMENTATION.md`

---

## 🔄 Phase 2: Refactor Existing Components

### 2.1 Lessons Components

- [ ] Refactor `LessonSongs.tsx` to use `RelatedItemsSection`
- [ ] Update status badges to use `StatusBadge` component
- [ ] Add `Breadcrumbs` to lesson detail page
- [ ] Update `LessonTable.Row.tsx` to use `EntityLink`

### 2.2 Users Components

- [ ] Refactor `UserLessons.tsx` to use `RelatedItemsSection` + `EntityCard`
- [ ] Refactor `UserAssignments.tsx` to use `RelatedItemsSection` + `EntityCard`
- [ ] Refactor `UserSongs.tsx` to use `RelatedItemsSection` + `EntityCard`
- [ ] Add `Breadcrumbs` to user detail page
- [ ] Use `StatusBadge` for all status displays

### 2.3 Songs Components

- [ ] Make song list rows clickable (like lessons)
- [ ] Add `Breadcrumbs` to song detail page
- [ ] Use `StatusBadge` for level badges

---

## 🆕 Phase 3: New Features - Songs Detail Page

### 3.1 Create Song Detail Page

- [ ] Create `/app/dashboard/songs/[id]/page.tsx`
- [ ] Add song information card
- [ ] Add breadcrumbs navigation
- [ ] Add edit/delete buttons (role-based)

### 3.2 API Endpoints

- [ ] `GET /api/songs/[id]/lessons` - Fetch lessons using this song
- [ ] `GET /api/songs/[id]/students` - Fetch students learning this song
- [ ] `GET /api/songs/[id]/teachers` - Fetch teachers teaching this song

### 3.3 Related Sections

- [ ] "Lessons Using This Song" section with `RelatedItemsSection`
  - Show: Lesson #, Date, Student (link), Teacher (link), Status badge
  - Empty state: "Add to Lesson" button
- [ ] "Students Learning This Song" section
  - Show: Student name (link), Progress status badge, # lessons
  - Empty state message
- [ ] "Teachers Teaching This Song" section
  - Show: Teacher name (link), # students, # lessons
  - Empty state message

### 3.4 Make Song List Interactive

- [ ] Create `components/songs/SongList/Row.tsx` - clickable rows
- [ ] Add `onClick` handler to navigate to song detail
- [ ] Use `EntityLink` for song title
- [ ] Add `stopPropagation` to nested links

---

## 🆕 Phase 4: Assignments Implementation

### 4.1 Create Assignment Components

- [ ] Create `components/assignments/` directory structure
- [ ] Create `AssignmentList/Row.tsx` - Clickable rows with user links
- [ ] Create `AssignmentList/Filters.tsx` - Status/user filters
- [ ] Create `AssignmentList/index.tsx` - Main list component
- [ ] Create `AssignmentDetail/index.tsx` - Detail page component

### 4.2 Assignment List Page

- [ ] Create `/app/dashboard/assignments/page.tsx`
- [ ] Fetch assignments with user/lesson relations
- [ ] Add filters (status, user, date range)
- [ ] Make rows clickable to assignment detail
- [ ] Add "Create Assignment" button

### 4.3 Assignment Detail Page

- [ ] Create `/app/dashboard/assignments/[id]/page.tsx`
- [ ] Add breadcrumbs navigation
- [ ] Show assignment info card
- [ ] Link to user (EntityLink)
- [ ] Link to related lesson (if exists)
- [ ] Link to related song (if exists)
- [ ] Add edit/delete buttons (role-based)
- [ ] Add "Mark Complete" action

### 4.4 API Endpoints

- [ ] `GET /api/assignments` - List with filters
- [ ] `GET /api/assignments/[id]` - Single with relations
- [ ] `POST /api/assignments` - Create
- [ ] `PATCH /api/assignments/[id]` - Update
- [ ] `DELETE /api/assignments/[id]` - Delete

---

## 🆕 Phase 5: Lesson Assignments Section

### 5.1 Create LessonAssignments Component

- [ ] Create `components/lessons/LessonAssignments.tsx`
- [ ] Use `RelatedItemsSection` pattern
- [ ] Show assignment cards with user links
- [ ] Add status badges
- [ ] Add "Create Assignment" button

### 5.2 API Endpoint

- [ ] `GET /api/lessons/[id]/assignments` - Fetch lesson's assignments

### 5.3 Integration

- [ ] Add to lesson detail page below `LessonSongs`
- [ ] Update `components/lessons/index.ts` exports

---

## 🎨 Phase 6: Polish & Enhancements

### 6.1 Loading States

- [ ] Add loading skeletons to all `RelatedItemsSection` uses
- [ ] Add loading spinners to API calls
- [ ] Add suspense boundaries where appropriate

### 6.2 Error Handling

- [ ] Add error boundaries to detail pages
- [ ] Add error states to `RelatedItemsSection`
- [ ] Add retry functionality for failed fetches

### 6.3 Empty States

- [ ] Review all empty states for consistency
- [ ] Add illustrations/icons to empty states
- [ ] Ensure all have appropriate CTA buttons

### 6.4 Mobile Optimization

- [ ] Test all clickable rows on mobile (44px touch targets)
- [ ] Test breadcrumbs on mobile (responsive)
- [ ] Test cards on mobile (single column stacking)
- [ ] Add swipe gestures where appropriate

### 6.5 Accessibility

- [ ] Add aria-labels to all interactive elements
- [ ] Test keyboard navigation (Tab, Enter)
- [ ] Test with screen readers
- [ ] Ensure focus states are visible
- [ ] Check color contrast (WCAG AA)

---

## 🧪 Phase 7: Testing

### 7.1 Component Tests

- [ ] Test `EntityLink` - variants, onClick, stopPropagation
- [ ] Test `EntityCard` - rendering, metadata, badges
- [ ] Test `RelatedItemsSection` - items, empty, loading states
- [ ] Test `StatusBadge` - all variants, helpers
- [ ] Test `Breadcrumbs` - navigation, current page

### 7.2 Integration Tests

- [ ] Test navigation flow: Lessons → Users → back
- [ ] Test navigation flow: Songs → Lessons → Users
- [ ] Test navigation flow: Assignments → Users → Lessons
- [ ] Test breadcrumb navigation on all pages
- [ ] Test nested link stopPropagation

### 7.3 E2E Tests

- [ ] Create Cypress test: Complete navigation cycle
- [ ] Test mobile navigation flows
- [ ] Test keyboard navigation
- [ ] Test loading/error states

---

## 📊 Progress Tracking

### Completed Features

- ✅ Lessons table - clickable rows and user links
- ✅ Lesson detail - show songs with links
- ✅ User detail - shows lessons, assignments, songs
- ✅ Shared components library

### In Progress

- 🔄 Documentation (architecture + implementation guide)

### Not Started

- ⏳ Song detail page with related items
- ⏳ Assignments CRUD implementation
- ⏳ Lesson assignments section
- ⏳ Refactoring existing components to use shared library

---

## 🎯 Next Actions (Priority Order)

1. **Commit current changes** (shared components + docs)
2. **Refactor LessonSongs** to use `RelatedItemsSection`
3. **Create song detail page** with related lessons
4. **Make song list rows clickable**
5. **Create assignment CRUD** with full navigation
6. **Add breadcrumbs** to all detail pages
7. **Add tests** for navigation flows

---

## 📝 Notes

- All shared components support dark mode
- Mobile-first design with responsive breakpoints
- Consistent 44px touch targets for mobile
- StatusBadge covers all entity status types
- EntityLink has 3 variants for different use cases
- RelatedItemsSection includes loading and empty states

---

## 🔗 Related Documentation

- `docs/FRONTEND_NAVIGATION_2025-12-05-ARCHITECTURE.md` - Complete architecture overview
- `docs/2025-11-12-FRONTEND_NAVIGATION_IMPLEMENTATION.md` - Step-by-step implementation guide
- `components/lessons/LessonTable.Row.tsx` - Example of clickable rows
- `components/lessons/LessonSongs.tsx` - Example of related items (to be refactored)
