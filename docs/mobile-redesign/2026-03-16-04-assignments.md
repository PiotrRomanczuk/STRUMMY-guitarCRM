# Feature 4: Assignments

> **Tier**: 1 | **Priority**: Core Daily Use

## Current Routes

| Route | Purpose |
|-------|---------|
| `/dashboard/assignments` | Assignment list |
| `/dashboard/assignments/new` | Create new assignment |
| `/dashboard/assignments/[id]` | Assignment detail |
| `/dashboard/assignments/[id]/edit` | Edit assignment |
| `/dashboard/assignments/templates` | Reusable assignment templates |
| `/dashboard/assignments/templates/new` | Create template |
| `/dashboard/assignments/templates/[id]` | Template detail |

## Component Tree

### List
| File | LOC | Purpose |
|------|-----|---------|
| `components/assignments/list/index.tsx` | ~30 | Entry point |
| `components/assignments/list/Header.tsx` | ~60 | List header + create |
| `components/assignments/list/Filters.tsx` | ~80 | Filter controls |
| `components/assignments/list/Table.tsx` | ~120 | Assignment table |
| `components/assignments/list/Empty.tsx` | ~30 | Empty state |

### Legacy List (may be duplicate)
| File | LOC | Purpose |
|------|-----|---------|
| `components/assignments/AssignmentList/index.tsx` | ~30 | Entry point |
| `components/assignments/AssignmentList/Header.tsx` | ~60 | Header |
| `components/assignments/AssignmentList/Filters.tsx` | ~80 | Filters |
| `components/assignments/AssignmentList/Table.tsx` | ~120 | Table |
| `components/assignments/AssignmentList/Empty.tsx` | ~30 | Empty |

### Form
| File | LOC | Purpose |
|------|-----|---------|
| `components/assignments/form/AssignmentForm.tsx` | ~150 | Main form |
| `components/assignments/form/AssignmentForm.Fields.tsx` | ~120 | Form fields |
| `components/assignments/form/AssignmentForm.Actions.tsx` | ~40 | Submit/cancel buttons |
| `components/assignments/form/AssignmentAI.tsx` | ~80 | AI-generated assignments |
| `components/assignments/form/useAssignmentForm.ts` | ~80 | Form state hook |

### Templates
| File | LOC | Purpose |
|------|-----|---------|
| `components/assignments/templates/TemplateForm.tsx` | ~120 | Template editor |
| `components/assignments/templates/TemplateList.tsx` | ~80 | Template list |
| `components/assignments/templates/useTemplateForm.ts` | ~60 | Template form hook |

### Student View
| File | LOC | Purpose |
|------|-----|---------|
| `components/assignments/student/StudentAssignmentsPageClient.tsx` | ~120 | Student assignment list |
| `components/assignments/student/AssignmentList.tsx` | ~80 | Student-facing list |

### Shared
| File | LOC | Purpose |
|------|-----|---------|
| `components/assignments/shared/AssignmentCard.tsx` | ~80 | Card component |
| `components/assignments/shared/AssignmentProgress.tsx` | ~60 | Progress indicator |
| `components/assignments/shared/AssignmentSectionHeader.tsx` | ~30 | Section header |
| `components/assignments/shared/AssignmentStatusBadge.tsx` | ~30 | Status badge |

**Total**: ~29 files, ~3,272 LOC

## Data Contract

### Server Actions
| Action | File | Returns |
|--------|------|---------|
| `createAssignmentTemplate()` | `app/actions/assignment-templates.ts` | Created template |
| `updateAssignmentTemplate()` | `app/actions/assignment-templates.ts` | Updated template |
| `deleteAssignmentTemplate()` | `app/actions/assignment-templates.ts` | Deleted confirmation |

### Hooks (Client)
| Hook | File | Data Source |
|------|------|-------------|
| `useAssignmentList` | `components/assignments/hooks/useAssignmentList.ts` | `/api/assignments` with filtering |
| `useAssignment` | `components/assignments/hooks/useAssignment.ts` | `/api/assignments/[id]` |
| `useAssignmentForm` | `components/assignments/form/useAssignmentForm.ts` | Form state + mutations |
| `useAssignmentMutations` | `components/assignments/hooks/useAssignmentMutations.ts` | CRUD mutations |
| `useTemplateForm` | `components/assignments/templates/useTemplateForm.ts` | Template form state |

### API Routes
| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/assignments` | GET, POST | List/create assignments |
| `/api/assignments/[id]` | GET, PUT, DELETE | CRUD single assignment |

## User Stories

### Teacher (on phone between lessons)
1. Quick-create an assignment for a student using a template -- pick student, pick template, set due date
2. Review which assignments are overdue and send a reminder
3. Check assignment completion rates across students

### Student (practicing at home)
1. See all pending assignments with due dates -- sorted by urgency
2. View assignment details -- what songs to practice, goals, resources
3. Mark sections of an assignment as complete

## Mobile Pain Points (at 390px)

1. **Assignment list table** -- columns overflow, no card layout for mobile
2. **Assignment form** -- long single-page form with student picker, date picker, song selector all cramped
3. **Template selection** -- template picker is a dropdown, should be full-screen list
4. **Due date display** -- dates truncated in table cells
5. **Student assignment view** -- lacks progress visualization, just a text list
6. **AI generation** -- streaming text display needs mobile-friendly layout

## Figma Design Link

> To be filled when designed

## Implementation Spec

### New Files (v2)
| File | Purpose |
|------|---------|
| `components/v2/assignments/AssignmentList.tsx` | Card-based list with due-date urgency |
| `components/v2/assignments/AssignmentList.Desktop.tsx` | Desktop table |
| `components/v2/assignments/AssignmentDetail.tsx` | Mobile detail with progress |
| `components/v2/assignments/AssignmentForm.tsx` | Step wizard: Student -> Content -> Schedule |
| `components/v2/assignments/TemplateList.tsx` | Template grid/cards |

### Files to Deprecate (v1)
| File | Reason |
|------|--------|
| `components/assignments/list/Table.tsx` | Replaced by card list |
| `components/assignments/form/AssignmentForm.tsx` | Replaced by step wizard |
| `components/assignments/AssignmentList/` | Legacy duplicate removed |

### Shared Primitives Needed
- [x] `MobilePageShell`
- [x] `StepWizardForm` -- student -> content -> schedule steps
- [x] `SwipeableListItem` -- swipe to complete/edit
- [x] `CollapsibleFilterBar` -- status + due date filters
- [ ] `UrgencyBadge` -- color-coded due date indicator
