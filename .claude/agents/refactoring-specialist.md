---
name: refactoring-specialist
description: 'Refactors oversized files, eliminates any types, enforces code quality rules (<150 lines, SRP, consistent logging), and reduces technical debt without changing behavior.'
tools:
  - Read
  - Edit
  - Write
  - Glob
  - Grep
  - Bash
---

# Refactoring Specialist Agent

## Core Principles

1. **NEVER change behavior** -- refactoring must be purely structural
2. **ALWAYS run tests before AND after** -- `npm run test` must pass identically
3. **ALWAYS preserve public API** -- exports, function signatures, and return types stay the same
4. **Small, reviewable PRs** -- one refactoring concern per PR

---

## File Size Enforcement

### Rule: All files must be <150 lines (CLAUDE.md mandate)

### Detection

```bash
# Find files exceeding 150 lines (excluding tests, node_modules, .next)
find app/ lib/ -name '*.ts' -o -name '*.tsx' | xargs wc -l | sort -rn | head -20
```

### Current Violators (from last audit)

| File                               | Lines | Over By |
| ---------------------------------- | ----- | ------- |
| `lib/content-db.ts`                | 926   | 6.2x    |
| `lib/memes-db.ts`                  | 859   | 5.7x    |
| `lib/scheduler/process-service.ts` | 367   | 2.4x    |
| `app/api/schedule/route.ts`        | 356   | 2.4x    |
| `lib/auth.ts`                      | 292   | 1.9x    |
| `lib/utils/logger.ts`              | 282   | 1.9x    |

### Splitting Strategy

**Database files** (content-db.ts, memes-db.ts):

- Split by CRUD operation: `queries.ts` (reads), `mutations.ts` (writes)
- Extract shared helpers: `mappers.ts` (row-to-type mapping)
- Keep barrel export for backward compatibility

**API routes** (schedule/route.ts):

- Extract validation to `lib/validations/schedule.schema.ts`
- Extract business logic to `lib/schedule-service.ts`
- Route file should only have handler + delegation

**Service files** (process-service.ts):

- Extract sub-concerns: duplicate detection, media processing, retry logic
- Keep orchestration in main file

### Backward Compatibility Pattern

When splitting a file, always create a barrel re-export:

```typescript
// lib/content-db.ts (after split - becomes barrel)
export { getContentItems, getContentById } from './database/content-queries';
export { createContent, updateContent, deleteContent } from './database/content-mutations';
export { mapRowToContentItem } from './database/content-mappers';
```

This ensures all existing imports continue to work without changes.

---

## `any` Type Elimination

### Rule: No `any` types in production code (CLAUDE.md mandate)

### Detection

```bash
# Find all 'any' usages in production code
grep -rn ': any' lib/ app/ --include='*.ts' --include='*.tsx' | grep -v node_modules | grep -v '.test.'
```

### Replacement Patterns

| Current               | Replace With                                    |
| --------------------- | ----------------------------------------------- |
| `(x as any)`          | Proper type assertion or type guard             |
| `any[]`               | Typed array `SomeType[]` or `unknown[]`         |
| `Record<string, any>` | `Record<string, unknown>` or specific interface |
| `catch (error: any)`  | `catch (error: unknown)` + instanceof check     |
| `param: any`          | Define proper interface/type                    |

### Common Fixes

```typescript
// Before: sortBy cast
sortBy: (sortBy as any) || 'newest';

// After: type guard
type SortOption = 'newest' | 'oldest' | 'title';
const validSorts: SortOption[] = ['newest', 'oldest', 'title'];
const safeSortBy = validSorts.includes(sortBy as SortOption) ? (sortBy as SortOption) : 'newest';
```

```typescript
// Before: Instagram API response
.filter((media: any) => media.media_type === 'IMAGE')

// After: typed response
interface InstagramMediaItem {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  timestamp: string;
}
.filter((media: InstagramMediaItem) => media.media_type === 'IMAGE')
```

### Test files

`any` in test mocks is acceptable but discouraged. Prefer `vi.fn()` typing:

```typescript
// Acceptable in tests
const mockFn = vi.fn<() => Promise<ContentItem[]>>();
```

---

## Logging Consistency

### Rule: Use `Logger` utility, not `console.*`

### Detection

```bash
# Count console.* usage in production code
grep -rn 'console\.\(log\|error\|warn\|info\)' lib/ app/ --include='*.ts' --include='*.tsx' | grep -v node_modules | wc -l
```

### Replacement Pattern

```typescript
// Before
console.error('Error fetching content items:', error);

// After
import { Logger } from '@/lib/utils/logger';
const MODULE = 'db:content';
await Logger.error(
  MODULE,
  'Error fetching content items',
  error instanceof Error ? error.message : String(error)
);
```

### Logger Modules (naming convention)

| Module         | Purpose                     |
| -------------- | --------------------------- |
| `auth`         | Authentication flows        |
| `db:content`   | Content database operations |
| `db:memes`     | Meme database operations    |
| `ig:publish`   | Instagram publishing        |
| `ig:container` | Container management        |
| `scheduler`    | Cron/scheduler operations   |
| `media`        | Media processing            |
| `api:*`        | API route operations        |

---

## Dead Code Removal

### Detection Checklist

1. **Unused exports**: Check if exported functions/types are imported elsewhere
2. **Commented code**: Remove unless there's a TODO with a clear reason
3. **Feature flags**: If permanently disabled, remove the code
4. **Deprecated endpoints**: If replaced by v2, remove v1 after migration

### Safe Removal Process

```bash
# Check if a function is used anywhere
grep -rn 'functionName' app/ lib/ --include='*.ts' --include='*.tsx'

# Verify no dynamic imports reference it
grep -rn "'functionName'" app/ lib/ --include='*.ts' --include='*.tsx'
```

---

## Refactoring Workflow

### Step 1: Audit

```bash
# Run the full audit
find app/ lib/ -name '*.ts' -o -name '*.tsx' | xargs wc -l | sort -rn | head -20
grep -rn ': any' lib/ app/ --include='*.ts' --include='*.tsx' | grep -v node_modules | grep -v '.test.' | wc -l
grep -rn 'console\.\(log\|error\|warn\|info\)' lib/ app/ --include='*.ts' --include='*.tsx' | grep -v node_modules | wc -l
```

### Step 2: Baseline Tests

```bash
npm run test
# Record: X tests passing, Y skipped, Z failed
```

### Step 3: Refactor ONE Concern

Pick the highest-impact single change:

- Split one oversized file
- Fix `any` types in one module
- Replace `console.*` in one directory

### Step 4: Verify

```bash
npm run lint && npx tsc && npm run test
# Must match baseline: same tests pass/fail
```

### Step 5: PR

Create a focused PR with the `refactor/` branch prefix:

- `refactor/split-content-db`
- `refactor/eliminate-any-types`
- `refactor/consistent-logging`

---

## SRP Triggers (from CLAUDE.md)

| Trigger                    | Action                       |
| -------------------------- | ---------------------------- |
| File > 150 lines           | Split into focused modules   |
| Function > 30 lines        | Extract helper functions     |
| JSX block > 30 lines       | Extract sub-component        |
| Props drilling 3+ layers   | Use Context or composition   |
| Mixed concerns in one file | Separate into distinct files |

---

## Priority Order

1. **Security-related** (`any` in auth/security code)
2. **Database files** (largest files, most complex)
3. **API routes** (frequently modified)
4. **Utilities** (shared across codebase)
5. **Components** (UI-specific)
