# Naming Conventions & Code Style

**Status**: Established via discovery Q&A (Q9)  
**Last Updated**: October 26, 2025  
**Enforced By**: ESLint, code review

---

## Purpose

Establish consistent naming patterns to make code immediately understandable and easier to navigate.

---

## Core Principle

**PascalCase for React Components/Types** | **camelCase for everything else**

This single rule makes file type obvious at a glance.

---

## File Naming

| File Type         | Pattern                  | Example                      |
| ----------------- | ------------------------ | ---------------------------- |
| React Component   | PascalCase               | `StudentLesson.tsx`          |
| Sub-component     | `Parent.Section.tsx`     | `StudentLesson.Item.tsx`     |
| Custom Hook       | `use` + PascalCase       | `useStudentLesson.ts`        |
| Utility functions | camelCase                | `formatDate.ts`              |
| Helpers           | `featureName.helpers.ts` | `studentLesson.helpers.ts`   |
| Schema            | PascalCase               | `SongSchema.ts`              |
| Type definitions  | PascalCase               | `Lesson.types.ts`            |
| Constants         | camelCase or UPPER_CASE  | `config.ts` or `API_KEYS.ts` |
| Config            | camelCase                | `supabase.ts`                |
| Test              | Match source + `.test`   | `StudentLesson.test.tsx`     |

---

## Variable & Function Naming

### Variables

**Booleans**: `is` or `has` prefix

```typescript
const isLoading = false;
const hasError = true;
const canEdit = user.role === 'admin';
```

**Arrays**: Plural nouns

```typescript
const lessons = [];
const studentNames = ['Alice', 'Bob'];
const songs = fetchSongs();
```

**Numbers**: Descriptive context

```typescript
const COUNT_LESSONS = 10;
const MAX_TITLE_LENGTH = 200;
const songCount = lessons.length;
```

**Objects**: Singular nouns

```typescript
const student = { id: '1', name: 'Alice' };
const config = { apiUrl: '...' };
const lesson = fetchLesson();
```

### Functions

**Imperative verbs**: What the function does

```typescript
// Getters
function getSongById(id: string) {}
function fetchLessons() {}
function retrieveTeacher() {}

// Formatters
function formatDate(date: string) {}
function stringifyLesson(lesson: Lesson) {}

// Checkers
function isValidEmail(email: string) {}
function canDeleteLesson(lesson: Lesson) {}
function hasStudentCompletedSong(studentId: string, songId: string) {}

// Calculators
function calculateCompletionRate(lessons: Lesson[]) {}
function computeAverageProgress(students: Student[]) {}

// Handlers
function handleSubmit(e: FormEvent) {}
function onLessonSelect(id: string) {}
function handleBlur(e: FocusEvent) {}
```

### React Component Props

Props object: `...Props` or `...Config`

```typescript
interface LessonFormProps {
	lessonId?: string;
	onSubmit: (data: LessonInput) => Promise<void>;
}

interface ModalConfig {
	title: string;
	isOpen: boolean;
}
```

Event handlers: `on...` prefix

```typescript
interface ButtonProps {
	onClick: () => void;
	onHover?: () => void;
	onChange: (value: string) => void;
}
```

---

## Component Naming

### Composition Components

Main component: Same as folder

```
StudentLesson/
├── StudentLesson.tsx        // Main
├── StudentLesson.Header.tsx // Sub
├── StudentLesson.Item.tsx   // Sub
```

**Usage**:

```typescript
import { StudentLesson } from '@/components/lessons/StudentLesson';
<StudentLesson lesson={lesson} />;
```

### Sub-components

Child components: `ParentName.Section.tsx`

```
StudentLesson/
├── StudentLesson.Header.tsx    // Header section
├── StudentLesson.SongList.tsx  // List section
├── StudentLesson.Song.tsx      // Item in list
├── StudentLesson.Empty.tsx     // Empty state
```

**NOT**:

```
❌ Header.tsx        // Unclear which feature
❌ LessonHeader.tsx  // Redundant with folder
❌ StudentLessonHeader.tsx  // Too long
```

---

## Hook Naming

```typescript
// ✅ Custom hooks
useStudentLesson();
useForm();
useAsync();
useLocalStorage();

// ✅ Event handlers (not really hooks, but similar pattern)
useOnClickOutside();
usePrevious();

// ❌ NOT hooks (no "use" prefix)
getStudentLessons(); // Use getters, not "use"
formatLessonDate(); // Utility function
isValidEmail(); // Checker function
```

---

## Constant Naming

### Global Constants

```typescript
// Public constants: PascalCase or UPPER_CASE
export const API_BASE_URL = 'https://api.strummy.com';
export const DEFAULT_LESSON_LENGTH_MINUTES = 60;
export const VALID_DIFFICULTIES = [
	'beginner',
	'intermediate',
	'advanced',
] as const;

// Or more readable
export const DifficultyLevels = {
	BEGINNER: 'beginner',
	INTERMEDIATE: 'intermediate',
	ADVANCED: 'advanced',
} as const;

// Private constants: camelCase
const DEFAULT_PAGE_SIZE = 20;
const RETRY_ATTEMPTS = 3;
```

### Feature-Specific Constants

Keep in helpers file:

```typescript
// studentLesson.helpers.ts
const SONG_STATUS_COLORS = {
	to_learn: 'bg-gray-100',
	started: 'bg-yellow-100',
	mastered: 'bg-green-100',
};

export function getSongStatusColor(status: SongStatus) {
	return SONG_STATUS_COLORS[status] || 'bg-gray-100';
}
```

---

## Enum Naming

```typescript
// ✅ PascalCase
enum StudentRole {
	Teacher = 'teacher',
	Student = 'student',
	Admin = 'admin',
}

// ✅ Or const object (preferred in TypeScript)
const StudentRole = {
	TEACHER: 'teacher',
	STUDENT: 'student',
	ADMIN: 'admin',
} as const;

type StudentRole = (typeof StudentRole)[keyof typeof StudentRole];
```

---

## Type Naming

```typescript
// ✅ PascalCase
type Lesson = {
	id: string;
	title: string;
};

type LessonInput = Omit<Lesson, 'id'>;

interface StudentWithLessons extends Student {
	lessons: Lesson[];
}

// ❌ Avoid
type lesson = {}; // camelCase
type TLesson = {}; // T prefix (old C# style)
```

---

## Alias Naming

```typescript
// ✅ Clear alias names
import { StudentLesson as StudentLessonComponent } from '@/components/StudentLesson';
import type { StudentLesson as StudentLessonType } from '@/schemas/LessonSchema';

// ❌ Unclear
import { StudentLesson as SL } from '@/components/StudentLesson';
import type { StudentLesson as ST } from '@/schemas/LessonSchema';
```

---

## Private vs Public

```typescript
// ✅ Private functions: underscore prefix (convention, not enforced)
export function formatDate(date: string) {}
function _sortByDate(items: Item[]) {} // Private helper

// ✅ Or just don't export
function sortByDate(items: Item[]) {} // File-scoped

// ✅ Private properties: # prefix (JavaScript standard)
class Lesson {
	#id: string; // Cannot be accessed from outside
	title: string;
}
```

---

## CSS Class Naming

Use BEM (Block Element Modifier) or atomic names:

```tsx
// ✅ BEM-like
className = 'lesson-form lesson-form--editing';
className = 'lesson-form__header lesson-form__header--active';

// ✅ Tailwind (preferred)
className = 'flex gap-4 px-3 sm:px-4 py-2 sm:py-3';
className = 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600';

// ❌ Avoid custom CSS classes in this project
className = 'my-custom-form';
className = 'style-form-header';
```

---

## ID Naming

```typescript
// ✅ Clear IDs
const studentId = 'abc-123';
const lessonSongId = 'def-456';

// ❌ Unclear
const id1 = 'abc-123';
const sid = 'abc-123';
const studentIdRef = 'abc-123'; // Too long
```

---

## Query Parameter Naming

```typescript
// ✅ Clear query params
/lessons?studentId=123&sortBy=date
/songs?level=intermediate&key=C

// ❌ Unclear
/lessons?s=123&sort=d
/songs?l=i&k=C
```

---

## URL Path Naming

```typescript
// ✅ RESTful paths
GET    /api/lessons
POST   /api/lessons
GET    /api/lessons/:id
PUT    /api/lessons/:id
DELETE /api/lessons/:id

GET    /api/lessons/:lessonId/songs
POST   /api/lessons/:lessonId/songs/:songId/progress

// ❌ Non-standard
GET    /api/get-lessons
POST   /api/create-lesson
DELETE /api/lesson-delete
```

---

## Event Handler Naming

```typescript
// ✅ on[Event] pattern
onClick = { handleClick };
onChange = { handleChange };
onSubmit = { handleSubmit };
onBlur = { handleBlur };

// Or callback props
onClick = { onLessonSelect };
onChange = { onSortChange };

// ❌ Not clear
onClick = { doClick };
onChange = { updateSort };
onSubmit = { save }; // What saves? Be specific
```

---

## Common Naming Patterns Summary

| What          | Pattern            | Example              |
| ------------- | ------------------ | -------------------- |
| Component     | PascalCase         | `StudentLesson.tsx`  |
| Function      | camelCase verb     | `fetchLessons()`     |
| Variable      | camelCase          | `studentId`          |
| Constant      | UPPER_CASE         | `MAX_LENGTH`         |
| Boolean       | `is/has/can`       | `isLoading`          |
| Array         | Plural             | `lessons`            |
| Type          | PascalCase         | `type Lesson`        |
| Hook          | `use` + PascalCase | `useStudentLesson()` |
| Event handler | `on` + Event       | `onClick`            |
| Callback prop | `on` + Action      | `onSubmit`           |

---

## Checklist Before Committing

- [ ] Components are PascalCase
- [ ] Functions are camelCase with verb
- [ ] Booleans start with `is`, `has`, `can`
- [ ] Arrays are plural nouns
- [ ] Constants are UPPER_CASE
- [ ] Hooks start with `use`
- [ ] Event handlers are `on[Event]` or `handle[Event]`
- [ ] Types/Interfaces are PascalCase
- [ ] No single-letter variables (except `i` in loops)
- [ ] Private helpers don't export (or use `_` prefix)

---

## Resources

- TypeScript naming best practices: https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html
- React conventions: https://react.dev/learn
- ESLint naming rules: https://eslint.org/docs/latest/rules/camelcase
