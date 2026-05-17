# Feature 6: Users/Students Management

> **Tier**: 2 | **Priority**: Supporting

## Current Routes

| Route | Purpose |
|-------|---------|
| `/dashboard/users` | Student list (teacher/admin view) |
| `/dashboard/users/new` | Create new student |
| `/dashboard/users/[id]` | Student detail page (tabbed) |
| `/dashboard/users/[id]/edit` | Edit student profile |

## Component Tree

### List
| File | LOC | Purpose |
|------|-----|---------|
| `components/users/UsersList.tsx` | ~100 | Main list container |
| `components/users/UsersListTable.tsx` | ~120 | Data table view |
| `components/users/UsersListFilters.tsx` | ~80 | Filter controls |

### Detail / Tabs
| File | LOC | Purpose |
|------|-----|---------|
| `components/users/UserDetail.tsx` | ~120 | Detail page layout |
| `components/users/UserDetailTabs.tsx` | ~100 | Tabbed interface |
| `components/users/UserOverviewTab.tsx` | ~100 | Overview section |
| `components/users/UserLessons.tsx` | ~80 | Lesson history tab |
| `components/users/UserSongs.tsx` | ~80 | Song list tab |
| `components/users/UserAssignments.tsx` | ~80 | Assignments tab |
| `components/users/UserRepertoireTab.tsx` | ~100 | Repertoire tab |
| `components/users/RepertoireCard.tsx` | ~80 | Song card in repertoire |
| `components/users/AddSongToRepertoireDialog.tsx` | ~80 | Add song dialog |
| `components/users/EditSongConfigDialog.tsx` | ~60 | Edit config |
| `components/users/StudentAssignments.tsx` | ~80 | Assignment history |
| `components/users/StudentRepertoire.tsx` | ~80 | Repertoire section |
| `components/users/UserSkills.tsx` | ~60 | Skills display |

### Form
| File | LOC | Purpose |
|------|-----|---------|
| `components/users/UserForm.tsx` | ~100 | Form wrapper |
| `components/users/UserFormFields.tsx` | 127 | Form field definitions |
| `components/users/UserFormActions.tsx` | ~40 | Submit/cancel |
| `components/users/AvatarEditor.tsx` | ~80 | Avatar upload |
| `components/users/RoleToggle.tsx` | ~40 | Role switcher |
| `components/users/DangerZone.tsx` | ~60 | Delete actions |

### CSV Import (10 files)
| File | LOC | Purpose |
|------|-----|---------|
| `components/users/CsvSongImportButton.tsx` | ~30 | Import trigger |
| `components/users/CsvSongImportDialog.tsx` | ~100 | Main import dialog |
| `components/users/CsvSongImportDialog.Upload.tsx` | ~60 | Upload section |
| `components/users/CsvSongImportDialog.Preview.tsx` | ~80 | Preview section |
| `components/users/CsvSongImportDialog.Results.tsx` | ~60 | Results display |
| `components/users/CsvSongImportDialog.EditableSongList.tsx` | ~120 | Editable list |
| `components/users/CsvSongImportDialog.AuthorCombobox.tsx` | ~80 | Author picker |
| `components/users/csvParser.ts` | ~60 | CSV parsing |
| `components/users/useAuthorMatching.ts` | ~60 | Author matching hook |
| `components/users/useCsvSongImport.ts` | ~80 | Import hook |

### Other
| File | LOC | Purpose |
|------|-----|---------|
| `components/users/ExportButton.tsx` | ~40 | Data export |
| `components/users/useUserFormState.ts` | ~60 | Form state hook |
| `components/users/useUsersList.ts` | ~80 | List state hook |

**Total**: ~40 files, ~4,273 LOC

## Data Contract

### Server Actions
| Action | File | Returns |
|--------|------|---------|
| `createStudentProfile()` | `app/actions/student-management.ts` | Created student profile |

### Hooks (Client)
| Hook | File | Data Source |
|------|------|-------------|
| `useUsersList` | `components/users/useUsersList.ts` | `/api/users` with pagination |
| `useUserFormState` | `components/users/useUserFormState.ts` | Form state management |
| `useAuthorMatching` | `components/users/useAuthorMatching.ts` | CSV author matching |
| `useCsvSongImport` | `components/users/useCsvSongImport.ts` | CSV import workflow |

### API Routes
| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/users` | GET, POST | List/create users |
| `/api/users/[id]` | GET, PUT, DELETE | CRUD single user |
| `/api/students` | GET | Student-specific queries |
| `/api/admin/users` | GET, PUT | Admin user management |

## User Stories

### Teacher (on phone between lessons)
1. Look up a student's profile to check their progress before a lesson
2. Quick-add a new student — name + email, send invite
3. Review a student's lesson history and repertoire from their detail page

### Admin
1. Manage all users, toggle roles, bulk import from CSV
2. Review student engagement metrics per user
3. Export user data for reporting

## Mobile Pain Points (at 390px)

1. **User list is a full table** — columns overflow, need card layout
2. **User detail tabs** — tab bar scrolls off-screen, hard to switch between 5+ tabs
3. **CSV import dialog** — multi-step dialog with preview table doesn't fit on mobile
4. **Avatar editor** — file upload flow needs mobile camera integration
5. **Nested dialogs** — add-to-repertoire dialog inside user detail tab is deeply nested
6. **Form fields** — long form with many fields needs vertical step-through on mobile

## Figma Design Link

> To be filled when designed

## Implementation Spec

### New Files (v2)
| File | Purpose |
|------|---------|
| `components/v2/users/UserList.tsx` | Card-based student list with avatar + stats |
| `components/v2/users/UserList.Desktop.tsx` | Desktop table |
| `components/v2/users/UserDetail.tsx` | Swipeable tab detail view |
| `components/v2/users/UserDetail.Desktop.tsx` | Desktop multi-panel |
| `components/v2/users/UserForm.tsx` | Step wizard form |
| `components/v2/users/InviteFlow.tsx` | Simplified mobile invite |

### Files to Deprecate (v1)
| File | Reason |
|------|--------|
| `components/users/UsersListTable.tsx` | Replaced by card list |
| `components/users/UserDetailTabs.tsx` | Replaced by swipeable tabs |
| `components/users/UserForm.tsx` | Replaced by step wizard |

### Shared Primitives Needed
- [x] `MobilePageShell`
- [x] `SwipeableListItem` — swipe to message/edit student
- [x] `StepWizardForm` — multi-step user creation
- [ ] `SwipeableTabs` — swipe between detail sections
- [ ] `FileUploadSheet` — camera/gallery picker bottom sheet
