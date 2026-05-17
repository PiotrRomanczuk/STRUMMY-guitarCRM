# API Routes Implementation Status

**Generated:** December 12, 2025

This document tracks which API routes are implemented on the frontend and provides recommendations for next implementation priorities.

## Summary

- **Total API Routes:** 48
- **Fully Implemented:** ~18 (38%)
- **Partially Implemented:** ~8 (17%)
- **Not Implemented:** ~22 (45%)

## Implementation Status by Category

### ✅ Fully Implemented Routes

These routes have complete frontend implementation with proper hooks/components:

#### Assignments
- ✅ `GET /api/assignments` - Used in `AssignmentsList.tsx`, `useAssignmentList.ts`
- ✅ `POST /api/assignments` - Used in `useAssignmentMutations.ts`
- ✅ `GET /api/assignments/[id]` - Used in `useAssignment.ts`
- ✅ `PATCH /api/assignments/[id]` - Used in `useAssignmentMutations.ts`
- ✅ `DELETE /api/assignments/[id]` - Used in `useAssignmentMutations.ts`

#### Lessons (Core)
- ✅ `GET /api/lessons` - Used in `useLessonList.ts`
- ✅ `POST /api/lessons` - Used in `useLessonForm.ts`
- ✅ `GET /api/lessons/[id]` - Used in lesson detail pages
- ✅ `PUT /api/lessons/[id]` - Used in `useLessonForm.ts`
- ✅ `DELETE /api/lessons/[id]` - Used in `LessonDeleteButton.tsx`
- ✅ `GET /api/lessons/[id]/songs` - Used in `LessonSongs.tsx`

#### Songs (Core)
- ✅ `GET /api/song/admin-songs` - Used in `useSongList.ts`, `useSongs.ts`
- ✅ `GET /api/song/student-songs` - Used in `useSongList.ts`
- ✅ `POST /api/song` - Used in `useSongMutation.ts`
- ✅ `PUT /api/song` - Used in `useSongMutation.ts`
- ✅ `DELETE /api/song` - Used in `useSong.ts`
- ✅ `GET /api/songs/[id]` - Used in song detail pages
- ✅ `DELETE /api/songs/[id]` - Used in `SongDetail/Actions.tsx`

#### Songs (Related)
- ✅ `GET /api/songs/[id]/lessons` - Used in `SongLessons.tsx`
- ✅ `GET /api/songs/[id]/assignments` - Used in `SongAssignments.tsx`

#### Users
- ✅ `GET /api/users` - Used in `useUsersList.ts`, filter dropdowns
- ✅ `POST /api/users` - Used in `useUserFormState.ts`
- ✅ `PUT /api/users/[id]` - Used in `useUserFormState.ts`
- ✅ `DELETE /api/users/[id]` - Used in `UserDetail.tsx`

#### API Keys
- ✅ `GET /api/api-keys` - Used in `ApiKeyManager.tsx`, `BearerTokenDisplay.tsx`
- ✅ `POST /api/api-keys` - Used in `ApiKeyManager.tsx`, `BearerTokenDisplay.tsx`
- ✅ `DELETE /api/api-keys/[id]` - Used in `ApiKeyManager.tsx`

#### Profiles
- ✅ `GET /api/profiles` - Used in `useProfiles.ts`

### ⚠️ Partially Implemented Routes

These routes exist but lack complete frontend integration:

#### Admin Routes
- ⚠️ `GET /api/admin/lessons` - Backend ready, but frontend uses `/api/lessons` directly
- ⚠️ `POST /api/admin/lessons` - Backend ready, but frontend uses `/api/lessons` directly
- ⚠️ `GET /api/admin/users` - Backend ready, but frontend uses `/api/users` directly
- ⚠️ `POST /api/admin/set-passwords` - Admin utility, likely used via scripts

#### Teacher/Student Routes
- ⚠️ `GET /api/teacher/lessons` - Backend ready, but frontend uses `/api/lessons` directly
- ⚠️ `POST /api/teacher/lessons` - Backend ready, but frontend uses `/api/lessons` directly
- ⚠️ `GET /api/student/lessons` - Backend ready, but frontend uses `/api/lessons` directly
- ⚠️ `POST /api/student/lessons` - Backend ready, but frontend uses `/api/lessons` directly

### ❌ Not Implemented Routes

These routes have no frontend implementation:

#### Lessons (Advanced)
- ❌ `GET /api/lessons/analytics` - Analytics/reporting endpoint
  - **Purpose:** Lesson statistics by teacher/student/period
  - **Priority:** HIGH for dashboards/reports
  
- ❌ `POST /api/lessons/bulk` - Bulk lesson creation
  - **Purpose:** Import/create multiple lessons at once
  - **Priority:** MEDIUM for admin efficiency
  
- ❌ `GET /api/lessons/export` - Export lessons to JSON/CSV
  - **Purpose:** Data export for backups/reporting
  - **Priority:** MEDIUM for data management
  
- ❌ `GET /api/lessons/search` - Advanced lesson search
  - **Purpose:** Text search across lessons with filters
  - **Priority:** HIGH for UX improvement
  
- ❌ `GET /api/lessons/schedule` - Teacher schedule view
  - **Purpose:** Calendar/availability management
  - **Priority:** HIGH for teacher dashboard
  
- ❌ `GET /api/lessons/stats` - Quick lesson statistics
  - **Purpose:** Dashboard metrics
  - **Priority:** HIGH for dashboards
  
- ❌ `GET /api/lessons/templates` - Lesson templates
  - **Purpose:** Reusable lesson formats
  - **Priority:** MEDIUM for teacher efficiency

#### Songs (Advanced)
- ❌ `POST /api/song/bulk` - Bulk song import
  - **Purpose:** Import multiple songs at once
  - **Priority:** MEDIUM for content management
  
- ❌ `GET /api/song/export` - Export songs to JSON/CSV/PDF
  - **Purpose:** Data export for backups/sharing
  - **Priority:** LOW for now
  
- ❌ `GET /api/song/search` - Advanced song search
  - **Purpose:** Full-text search with pagination
  - **Priority:** HIGH for UX improvement
  
- ❌ `GET /api/song/stats` - Song statistics
  - **Purpose:** Song library analytics
  - **Priority:** MEDIUM for admin dashboard
  
- ❌ `PUT /api/song/update` - Alternative update endpoint
  - **Purpose:** Duplicate of PUT /api/song?id=
  - **Priority:** LOW (cleanup candidate)
  
- ❌ `GET /api/song/favorites` - User favorites
  - **Purpose:** Student favorite songs
  - **Priority:** MEDIUM for student UX
  
- ❌ `GET /api/song/admin-favorites` - Admin view of favorites
  - **Purpose:** See all students' favorites
  - **Priority:** LOW for analytics
  
- ❌ `GET /api/song/user-songs` - User-specific songs
  - **Purpose:** Custom endpoint (unclear purpose)
  - **Priority:** LOW (needs clarification)
  
- ❌ `GET /api/song/user-test-song` - Testing endpoint
  - **Purpose:** Likely for development/testing
  - **Priority:** N/A (cleanup candidate)

#### Teacher
- ❌ `GET /api/teacher/students` - Teacher's student list
  - **Purpose:** Get students assigned to teacher
  - **Priority:** HIGH for teacher dashboard

#### Dashboard
- ❌ `GET /api/dashboard/stats` - General dashboard stats
  - **Purpose:** Homepage/dashboard metrics
  - **Priority:** HIGH for dashboard implementation

#### Widget
- ❌ `GET /api/widget/admin` - iOS widget admin data
  - **Purpose:** Admin widget on iOS
  - **Priority:** LOW (mobile-specific)
  
- ❌ `GET /api/widget/dashboard` - iOS widget dashboard
  - **Purpose:** User widget on iOS
  - **Priority:** LOW (mobile-specific)

#### Auth
- ❌ `GET /api/auth/google` - Google OAuth
  - **Purpose:** Social login
  - **Priority:** LOW (if Supabase auth handles this)
  
- ❌ `GET /api/oauth2/callback` - OAuth callback
  - **Purpose:** OAuth flow completion
  - **Priority:** LOW (if Supabase auth handles this)

## Priority Recommendations

### 🔥 HIGH Priority (Focus Next)

These routes would provide the most value for users:

1. **Dashboard & Stats**
   - `GET /api/dashboard/stats` - Core dashboard functionality
   - `GET /api/lessons/stats` - Lesson metrics for dashboards
   - **Impact:** Enables meaningful dashboard pages for all roles
   - **Effort:** Medium (2-3 days)
   - **Components Needed:** Dashboard widgets, stat cards, charts

2. **Search Improvements**
   - `GET /api/lessons/search` - Advanced lesson search
   - `GET /api/song/search` - Advanced song search
   - **Impact:** Drastically improves UX for finding content
   - **Effort:** Medium (3-4 days)
   - **Components Needed:** Enhanced search bars, filter panels, result views

3. **Teacher Features**
   - `GET /api/teacher/students` - Student management
   - `GET /api/lessons/schedule` - Schedule/calendar view
   - **Impact:** Essential for teacher workflow
   - **Effort:** Medium-High (4-5 days)
   - **Components Needed:** Student list, calendar component, availability manager

4. **Analytics & Insights**
   - `GET /api/lessons/analytics` - Lesson analytics
   - **Impact:** Provides valuable insights for teachers/admins
   - **Effort:** Medium (3-4 days)
   - **Components Needed:** Charts, date range pickers, analytics dashboard

### 📊 MEDIUM Priority (Next Sprint)

These routes improve efficiency and admin capabilities:

5. **Bulk Operations**
   - `POST /api/lessons/bulk` - Bulk lesson creation
   - `POST /api/song/bulk` - Bulk song import
   - **Impact:** Saves time for admin/teacher setup
   - **Effort:** Medium (3-4 days)
   - **Components Needed:** File upload, CSV parser, validation UI, progress indicators

6. **Export Features**
   - `GET /api/lessons/export` - Export lessons
   - `GET /api/song/export` - Export songs
   - **Impact:** Data portability and backups
   - **Effort:** Low-Medium (2-3 days)
   - **Components Needed:** Export buttons, format selectors

7. **Templates & Efficiency**
   - `GET /api/lessons/templates` - Lesson templates
   - **Impact:** Faster lesson creation
   - **Effort:** Medium (3-4 days)
   - **Components Needed:** Template library, template selector, template editor

8. **Song Features**
   - `GET /api/song/stats` - Song statistics
   - `GET /api/song/favorites` - Favorite songs
   - **Impact:** Enhanced song management and student engagement
   - **Effort:** Low-Medium (2-3 days)
   - **Components Needed:** Stats dashboard, favorite toggle/list

### 🔧 LOW Priority (Future)

Nice-to-have features:

9. **Mobile Widgets**
   - `GET /api/widget/admin`
   - `GET /api/widget/dashboard`
   - **Impact:** Mobile-specific, limited audience
   - **Effort:** Low (already implemented)
   - **Note:** Backend ready, needs iOS Scriptable widget setup

10. **Cleanup & Optimization**
    - Review duplicate endpoints (`PUT /api/song/update`)
    - Remove test endpoints (`GET /api/song/user-test-song`)
    - Consolidate admin/teacher/student lesson endpoints

## Recommended Implementation Order

### Phase 1: Core Features (2-3 weeks)
1. Dashboard stats (`/api/dashboard/stats`, `/api/lessons/stats`)
2. Search improvements (`/api/lessons/search`, `/api/song/search`)
3. Teacher student management (`/api/teacher/students`)

### Phase 2: Teacher Tools (2 weeks)
4. Lesson schedule/calendar (`/api/lessons/schedule`)
5. Lesson analytics (`/api/lessons/analytics`)
6. Lesson templates (`/api/lessons/templates`)

### Phase 3: Efficiency Features (1-2 weeks)
7. Bulk operations (`/api/lessons/bulk`, `/api/song/bulk`)
8. Export features (`/api/lessons/export`, `/api/song/export`)

### Phase 4: Enhancement (1 week)
9. Song favorites (`/api/song/favorites`)
10. Song statistics (`/api/song/stats`)

### Phase 5: Polish (Optional)
11. Mobile widgets (if iOS development is planned)
12. Code cleanup and consolidation

## Technical Notes

### Current Architecture Patterns

**Good Patterns:**
- Using React Query for data fetching (`useQuery`, `useMutation`)
- Centralized API client (`@/lib/api-client`)
- Dedicated hooks per entity (`useSongList`, `useAssignmentList`)
- Automatic cache invalidation on mutations

**Inconsistencies to Address:**
- Mix of `fetch` and `apiClient` usage
- Some components use direct `fetch` instead of hooks
- Duplicate endpoints (admin/teacher/student vs. role-based filtering)

### Recommended Frontend Structure

For new implementations, follow this pattern:

```typescript
// hooks/useLessonAnalytics.ts
export function useLessonAnalytics(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ['lessons', 'analytics', filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      return apiClient.get(`/api/lessons/analytics?${params}`);
    },
    enabled: !!filters.teacherId || !!filters.studentId,
  });
}

// components/lessons/LessonAnalytics.tsx
export function LessonAnalytics() {
  const { data, isLoading, error } = useLessonAnalytics(filters);
  // Render analytics UI
}
```

## Next Steps

1. **Review Priorities:** Discuss with team/stakeholders
2. **Create Stories:** Break down Phase 1 into implementable tasks
3. **Design UI:** Mockups for dashboard, search, and teacher features
4. **Implement Hooks:** Start with data fetching hooks
5. **Build Components:** Create UI components for each feature
6. **Test:** Ensure proper error handling and loading states
7. **Document:** Update 2025-12-12-UI_STANDARDS.md with new patterns

## Questions to Address

1. Should we consolidate role-based endpoints into single endpoints with role filtering?
2. Are the widget endpoints actively used, or can they be deprioritized?
3. What analytics/metrics are most valuable to teachers and admins?
4. Should search be a separate page or enhanced filters on existing lists?
5. What export formats are needed (JSON, CSV, PDF)?

---

**Last Updated:** December 12, 2025
**Next Review:** After Phase 1 completion
