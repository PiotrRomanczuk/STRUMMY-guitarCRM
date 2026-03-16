---
name: mobile-redesign
description: Pick and implement the next available mobile redesign task from PROGRESS.md. Reads the progress tracker, claims a task (WIP lock), reads the feature spec + design system, implements it in a worktree, and marks it done. Designed for 4 parallel agents — each picks a different task from the current wave.
---

# Mobile Redesign — Task Runner

Automated workflow for implementing v2 mobile-first UI tasks from `docs/mobile-redesign/PROGRESS.md`.

## Workflow

### Step 1: Read progress tracker + identify current wave

```
Read: docs/mobile-redesign/PROGRESS.md
```

1. Find the **current wave** — the first wave that has unchecked tasks (`- [ ]`) not marked `WIP` or `BLOCKED`.
2. **Wave dependency rule**: Waves must complete in order. Do NOT start Wave N+1 if Wave N has unchecked tasks.
3. Within a wave, pick the **first unchecked task** that is not `WIP` or `BLOCKED`.

If the user passed an argument:
- `wave N` — work in wave N specifically
- `"agent N"` — pick the Agent N task block within the current wave
- `"keyword"` — find a task matching that keyword
- `status` — show progress summary and exit (no implementation)

### Step 2: Claim the task

Edit `docs/mobile-redesign/PROGRESS.md` — add `WIP (@agent)` to the task line:

```
- [ ] WIP (@agent) Create `components/v2/navigation/AppShell.tsx` — v2 mobile shell
```

This prevents other parallel agents from picking the same task.

**IMPORTANT**: Claim ALL tasks in your agent block at once (e.g., all tasks under "Agent 1 — Navigation Shell"). This is your work unit.

### Step 3: Read required context

Before writing ANY code, read these files IN ORDER:

1. **Design System** (MANDATORY):
   ```
   Read: docs/mobile-redesign/V2_DESIGN_SYSTEM.md
   ```

2. **Feature Spec** (the spec file listed in your agent block header):
   ```
   Read: docs/mobile-redesign/XX-feature.md
   ```

3. **UI Standards**:
   ```
   Read: docs/UI_STANDARDS.md
   ```

4. **Existing v1 components** — find and read the current implementation to understand:
   - What hooks/server actions exist (REUSE these — do NOT create new data fetching)
   - What types/interfaces are defined
   - What the current UX flow looks like

5. **Animation variants** — check what presets exist:
   ```
   Read: lib/animations/variants.ts
   ```

### Step 4: Create branch + implement

**If running in a worktree** (recommended for parallel agents):
- The worktree handles branch isolation automatically.

**If running directly**:
```bash
git checkout -b feature/STRUM-v2-<task-name>
```

#### Implementation Rules

Follow V2_DESIGN_SYSTEM.md exactly. Key rules:

1. **Mobile/Desktop pattern** — every feature uses:
   ```tsx
   'use client';
   import { lazy, Suspense } from 'react';
   import { useLayoutMode } from '@/hooks/use-is-widescreen';
   const DesktopView = lazy(() => import('./Feature.Desktop'));

   export function Feature(props: FeatureProps) {
     const mode = useLayoutMode();
     if (mode === 'mobile') return <MobileView {...props} />;
     return (
       <Suspense fallback={<MobileView {...props} />}>
         <DesktopView {...props} />
       </Suspense>
     );
   }
   ```

2. **MobilePageShell** — wrap every v2 page

3. **Card-based lists** on mobile, tables on desktop

4. **Touch targets** >= 44px on all interactive elements

5. **Reuse v1 hooks** — never duplicate data fetching. Use existing:
   - `useLessonList`, `useLessonForm`, `useSongs`, `useProfiles`, etc.
   - Server actions like `getTeacherDashboardData()`, `getStudentDashboardData()`

6. **File structure** per domain:
   ```
   components/v2/<domain>/
   ├── <Feature>.tsx              # Mobile-first (default)
   ├── <Feature>.Desktop.tsx      # Desktop (lazy-loaded)
   ├── <Feature>.Skeleton.tsx     # Loading state
   └── index.ts                   # Barrel exports
   ```

7. **Quality gates**:
   - Each file < 200 LOC
   - No `any` types
   - Dark mode works (no hardcoded colors)
   - Framer Motion uses `variants.ts` presets
   - `pb-safe` on sticky bottom elements

8. **Cookie toggle** — wire v2 components into existing pages:
   ```tsx
   import { getUIVersion } from '@/lib/ui-version';

   export default async function Page() {
     const version = getUIVersion();
     if (version === 'v2') return <V2Feature />;
     return <V1Feature />;  // existing component
   }
   ```

### Step 5: Verify

After implementation, run:

```bash
npm run lint
npx tsc --noEmit
npm test -- --passWithNoTests
```

Also verify manually (or describe what to check):
- [ ] Works at 390px (iPhone 15 Pro)
- [ ] Works at 768px (iPad)
- [ ] Works at 1440px (desktop)
- [ ] Dark mode works
- [ ] Touch targets >= 44px
- [ ] Same data as v1 (reuses hooks/actions)
- [ ] Animations use variants.ts presets

### Step 6: Mark done

Update `docs/mobile-redesign/PROGRESS.md`:

```
- [x] Create `components/v2/navigation/AppShell.tsx` — v2 mobile shell
```

Remove the `WIP (@agent)` marker from all completed tasks.

### Step 7: Report

Summarize:
- Files created/modified
- Which v1 hooks/actions were reused
- Any issues or decisions made
- What remains in the current wave

## Arguments

| Arg | Behavior |
|-----|----------|
| (none) | Pick next available agent block in current wave |
| `wave N` | Work in wave N specifically |
| `agent N` | Pick agent N's block in current wave |
| `"keyword"` | Find tasks matching keyword |
| `status` | Show progress summary: done/remaining/blocked per wave |
| `foundation` | Work on Wave 1 (sequential foundation tasks) |

## Parallel Agent Launch Pattern

To run 4 agents in parallel on Wave 2+, use this from the orchestrator:

```
# Each agent gets isolation: "worktree" and a specific agent block
Agent(subagent_type="ui-engineer", isolation="worktree", prompt="
  /mobile-redesign agent 1
  You are Agent 1 for Wave 2. Your block: Navigation Shell.
  Branch: feature/STRUM-v2-nav-shell
")

Agent(subagent_type="ui-engineer", isolation="worktree", prompt="
  /mobile-redesign agent 2
  You are Agent 2 for Wave 2. Your block: Teacher Dashboard.
  Branch: feature/STRUM-v2-teacher-dashboard
")

Agent(subagent_type="ui-engineer", isolation="worktree", prompt="
  /mobile-redesign agent 3
  You are Agent 3 for Wave 2. Your block: Student Dashboard + SOTW.
  Branch: feature/STRUM-v2-student-dashboard
")

Agent(subagent_type="ui-engineer", isolation="worktree", prompt="
  /mobile-redesign agent 4
  You are Agent 4 for Wave 2. Your block: Onboarding + Settings Toggle.
  Branch: feature/STRUM-v2-onboarding
")
```

**Wave 1 is sequential** — run it with a single agent before launching parallel waves.

## Rules

1. **Always read PROGRESS.md first** — never start without checking what's available
2. **Always claim before working** — WIP lock prevents collisions
3. **Always read the design system** — V2_DESIGN_SYSTEM.md is non-negotiable
4. **Always read the feature spec** — the numbered doc (01-19) for your feature
5. **Reuse v1 hooks** — zero new data fetching unless the spec explicitly requires it
6. **Each file < 200 LOC** — split if larger
7. **No `any` types** — use proper TypeScript
8. **Run lint + tsc before marking done** — quality gates are mandatory
9. **Mark done immediately** — don't leave WIP locks hanging
10. **If blocked, mark BLOCKED** with a reason so the orchestrator can unblock

## Quick Reference: Wave Overview

| Wave | Tasks | Parallel? | Key Files |
|------|-------|-----------|-----------|
| 1 | Foundation (toggle + primitives) | Sequential | lib/ui-version.ts, components/v2/primitives/* |
| 2 | Nav + Dashboards + Onboarding | 4 agents | 01-dashboard, 18-sotw, 19-onboarding |
| 3 | Lessons + Songs + Assignments + Users | 4 agents | 02-lessons, 03-songs, 04-assignments, 06-users |
| 4 | Calendar + Settings + Analytics + Admin | 4 agents | 07-14 specs |
| 5 | Fretboard + AI + E2E + Cleanup | 4 agents | 16-fretboard, 17-ai |

## Example Usage

```
/mobile-redesign                    # Pick next available task
/mobile-redesign status             # Show wave progress
/mobile-redesign wave 2             # Work in wave 2
/mobile-redesign agent 1            # Pick agent 1's block
/mobile-redesign foundation         # Work on Wave 1
/mobile-redesign "lessons"          # Find and implement lessons tasks
```
