---
created: 2026-06-08
updated: 2026-06-08
status: merged
slug: onboarding
pr: 430
---

# Onboarding

`/design-preview/onboarding`

## Status

**merged** in PR #430 on 2026-06-08. Live at `/design-preview/onboarding`.

## Files on disk (2026-06-08)

```
components/design-preview/onboarding/types.ts
components/design-preview/onboarding/data.ts
components/design-preview/onboarding/OnboardShell.tsx
components/design-preview/onboarding/OnboardPrimitives.tsx
components/design-preview/onboarding/OnboardTeacher.tsx
components/design-preview/onboarding/OnboardStudent.tsx
app/design-preview/onboarding/page.tsx
```

## Source files (bundle)

- `/tmp/strummy-design/strummy/project/src/onboarding.jsx`

## Artboards mounted

| Label                                 | Dim      | Component           |
| ------------------------------------- | -------- | ------------------- |
| Teacher · Step 2 of 5 — Studio info   | 1280×800 | `<OnboardTeacher/>` |
| Student · Step 2 of 4 — Level + goals | 1280×800 | `<OnboardStudent/>` |

## Notes from the agent

- `OnboardShell` renders the shared 2-column wizard frame (left rail with brand + step indicator + connector lines + time-remaining)
- `OnboardPrimitives` exposes `OnbHeader`, `OnbField`, `OnbInput`, `OnbNextBar`
- `OnboardStudent` is `'use client'` (level + goals toggle state); `OnboardTeacher` stays server
- Dropped the prototype’s unused `primary` prop on `OnbNextBar`
- 0 lint errors, 4 size warnings (left as-is)

## Remaining TODO

- [x] Verify in browser at `/design-preview/onboarding`
- [x] Branch `feature/design-preview-onboarding`, commit, push, open PR #430
- [x] Squash-merged 2026-06-08
