---
created: 2026-06-08
updated: 2026-06-08
status: partial
slug: assignments
---

# Assignments

`/design-preview/assignments`

## Status

**partial** — row + composer drafted; teacher + student compositions and page not done.

## Files already on disk (2026-06-08)

```
components/design-preview/assignments/types.ts
components/design-preview/assignments/data.ts
components/design-preview/assignments/primitives.tsx
components/design-preview/assignments/AssignmentRow.tsx
components/design-preview/assignments/AssignmentComposer.tsx
```

## Source files (bundle)

- `/tmp/strummy-design/strummy/project/src/assignments.jsx` — `<AssignmentsTeacher width height>` (manage + review) and `<AssignmentsStudent width height>` (inbox + submit)

## Artboards to mount

| Label                                         | Dim       | Prototype                                          |
| --------------------------------------------- | --------- | -------------------------------------------------- |
| Teacher · Assignment management · Desktop     | 1440×1024 | `<AssignmentsTeacher width={1440} height={1024}/>` |
| Student · Assignment inbox + submit · Desktop | 1440×1024 | `<AssignmentsStudent width={1440} height={1024}/>` |

## Remaining TODO

- [ ] Audit the 5 existing files; confirm `AssignmentRow` and `AssignmentComposer` match prototype
- [ ] Implement `AssignmentsTeacher.tsx` (sidebar + composer + roster + review queue)
- [ ] Implement `AssignmentsStudent.tsx` (sidebar + inbox + submission flow)
- [ ] Create `app/design-preview/assignments/page.tsx` mounting both artboards
- [ ] Lint clean
- [ ] Branch `feature/design-preview-assignments`, PR, verify
