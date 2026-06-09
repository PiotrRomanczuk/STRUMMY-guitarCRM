---
created: 2026-06-08
updated: 2026-06-08
status: not-started
slug: states
---

# Empty + Loading States

`/design-preview/states`

## Status

**not-started**.

## Files on disk

None.

## Source files (bundle)

- `/tmp/strummy-design/strummy/project/src/states.jsx` — empty teacher dashboard + “Tuning up…” loading skeleton

## Artboards to mount

| Label                                      | Dim       | Prototype                                          |
| ------------------------------------------ | --------- | -------------------------------------------------- |
| Empty · brand-new teacher, no students yet | 1440×1024 | `<EmptyTeacherDash width={1440} height={1024}/>`   |
| Loading skeleton · ‘Tuning up…’            | 1440×1024 | `<LoadingTeacherDash width={1440} height={1024}/>` |

## Remaining TODO

- [ ] Read `states.jsx` in full
- [ ] Implement `EmptyTeacherDash.tsx` (CTA-led empty state, “invite first student” flow)
- [ ] Implement `LoadingTeacherDash.tsx` (shimmer skeleton matching the real dashboard layout)
- [ ] Local types + data
- [ ] Create `app/design-preview/states/page.tsx`
- [ ] Lint clean
- [ ] Branch `feature/design-preview-states`, PR, verify
