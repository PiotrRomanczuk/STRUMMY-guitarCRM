# Feature 10: Theory Courses

> **Tier**: 2 | **Priority**: Supporting

## Current Routes

| Route | Purpose |
|-------|---------|
| `/dashboard/theory` | Course list |
| `/dashboard/theory/new` | Create new course |
| `/dashboard/theory/[courseId]` | View course |
| `/dashboard/theory/[courseId]/edit` | Edit course |
| `/dashboard/theory/[courseId]/new` | Create lesson within course |
| `/dashboard/theory/[courseId]/[lessonId]` | View theory lesson |
| `/dashboard/theory/[courseId]/[lessonId]/edit` | Edit theory lesson |

## Component Tree

| File | LOC | Purpose |
|------|-----|---------|
| `components/theory/TheoryCourseForm.tsx` | ~120 | Course creation/edit form |
| `components/theory/TheoryLessonForm.tsx` | ~100 | Lesson creation/edit form |
| `components/theory/TheoryCourseCard.tsx` | ~80 | Course card display |
| `components/theory/TheoryCourseAccessManager.tsx` | ~100 | Student access control |
| `components/theory/TheoryChapterReader.tsx` | ~120 | Lesson content reader |
| `components/theory/index.ts` | ~10 | Re-exports |

**Total**: 6 files, ~530 LOC

## Data Contract

### Server Actions
| Action | File | Returns |
|--------|------|---------|
| N/A | — | Theory uses API routes |

### API Routes
| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/theory` | GET, POST | List/create courses |
| `/api/theory/[courseId]` | GET, PUT, DELETE | CRUD single course |
| `/api/theory/[courseId]/lessons` | GET, POST | List/create lessons |
| `/api/theory/[courseId]/lessons/[lessonId]` | GET, PUT, DELETE | CRUD lesson |

## User Stories

### Teacher (on phone)
1. Create a quick theory lesson with text content
2. Assign access to specific students or cohorts
3. Review course structure — reorder lessons

### Student (on phone)
1. Browse available theory courses and open lessons
2. Read theory content in a comfortable mobile reader
3. Track progress through a multi-lesson course

## Mobile Pain Points (at 390px)

1. **Rich text editor** — editing course content on mobile keyboard is painful
2. **Course card grid** — cards don't collapse to single column cleanly
3. **Chapter reader** — text sizing and line-height not optimized for mobile reading
4. **Access manager** — student picker table needs mobile-friendly search
5. **No offline reading** — theory content should be cacheable for offline practice
6. **Navigation between lessons** — no swipe-through, requires back-and-forth navigation

## Figma Design Link

> To be filled when designed

## Implementation Spec

### New Files (v2)
| File | Purpose |
|------|---------|
| `components/v2/theory/CourseList.tsx` | Course cards with progress indicators |
| `components/v2/theory/CourseList.Desktop.tsx` | Desktop grid layout |
| `components/v2/theory/ChapterReader.tsx` | Mobile-optimized reader with swipe-through |
| `components/v2/theory/CourseForm.tsx` | Step wizard for course creation |
| `components/v2/theory/LessonForm.tsx` | Mobile-friendly content editor |

### Files to Deprecate (v1)
| File | Reason |
|------|--------|
| `components/theory/TheoryChapterReader.tsx` | Replaced by v2 reader |
| `components/theory/TheoryCourseForm.tsx` | Replaced by v2 form |

### Shared Primitives Needed
- [x] `MobilePageShell`
- [x] `StepWizardForm` — course creation steps
- [ ] `MobileReader` — optimized text reading experience
- [ ] `SwipeNavigation` — swipe between lessons
