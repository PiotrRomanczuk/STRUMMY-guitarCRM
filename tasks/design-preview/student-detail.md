---
created: 2026-06-08
updated: 2026-06-08
status: scaffold-only
slug: student-detail
---

# Student Detail

`/design-preview/student-detail`

## Status

**scaffold-only** — types + data + primitives stubs exist, no real component code yet.

## Files already on disk (2026-06-08)

```
components/design-preview/student-detail/types.ts
components/design-preview/student-detail/data.ts
components/design-preview/student-detail/primitives.tsx
```

These are mostly empty scaffolding from the failed parallel run. Likely safer to rewrite.

## Source files (bundle)

- `/tmp/strummy-design/strummy/project/src/student-detail.jsx` — `<StudentDetail studentId width height>`, tabs (overview / lessons / repertoire / practice log)

## Artboards to mount

| Label                             | Dim       | Prototype                                                    |
| --------------------------------- | --------- | ------------------------------------------------------------ |
| Emma Johnson · Overview · Desktop | 1440×1400 | `<StudentDetail studentId="s1" width={1440} height={1400}/>` |
| Carlos Reyes · At-risk · Desktop  | 1440×1400 | `<StudentDetail studentId="s2" width={1440} height={1400}/>` |

`STUDENTS` from `lib/mock-data` already has `s1` (Emma) and `s2` (Carlos) with full profile data.

## Remaining TODO

- [ ] Audit the 3 scaffold files; rewrite from scratch if mostly empty
- [ ] Implement `StudentDetail.tsx` with tabs + sub-views (overview header, lessons, repertoire, practice log)
- [ ] Wire the `studentId` prop — switch on `s1` vs `s2` from `STUDENTS`
- [ ] Highlight at-risk visual state for Carlos (red accents)
- [ ] Create `app/design-preview/student-detail/page.tsx` mounting both artboards
- [ ] Lint clean
- [ ] Branch `feature/design-preview-student-detail`, PR, verify
