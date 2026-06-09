---
created: 2026-06-08
updated: 2026-06-08
status: partial
slug: lessons
---

# Lesson Management

`/design-preview/lessons`

## Status

**partial** — primitives + list view drafted, detail / app shell / page not yet written.

## Files already on disk (2026-06-08)

```
components/design-preview/lessons/data.ts
components/design-preview/lessons/types.ts
components/design-preview/lessons/styles.ts
components/design-preview/lessons/LessonPrimitives.tsx
components/design-preview/lessons/LessonList.tsx
```

Audit these before continuing — they were written by an agent that didn’t return its schema, so they may be incomplete or inconsistent. Either keep + extend, or rewrite.

## Source files (bundle)

Read in full from `/tmp/strummy-design/strummy/project/src/`:

- `lesson-app.jsx` — top-level `<LessonApp>` and `<LessonAppMobile>` with `role` + `initial` + `initialLessonId` props
- `lesson-list.jsx`
- `lesson-detail.jsx`
- `lesson-primitives.jsx`
- `lesson-data.jsx`

## Artboards to mount

In `app/design-preview/lessons/page.tsx`, mount five artboards via `<ArtboardStage>`:

| Label                                    | Dim       | Prototype                                                                    |
| ---------------------------------------- | --------- | ---------------------------------------------------------------------------- |
| Lessons · List · Desktop (teacher)       | 1440×1024 | `<LessonApp role="teacher" initial="list"/>`                                 |
| Lesson detail · #042 Blackbird · Desktop | 1440×1024 | `<LessonApp role="teacher" initial="detail" initialLessonId="L-042"/>`       |
| Lessons · List · Mobile                  | 390×844   | `<LessonAppMobile role="teacher" initial="list"/>`                           |
| Lesson detail · Mobile                   | 390×844   | `<LessonAppMobile role="teacher" initial="detail" initialLessonId="L-042"/>` |
| Student role · Lessons list              | 1440×1024 | `<LessonApp role="student" initial="list"/>`                                 |

## Remaining TODO

- [ ] Audit the 5 existing files; either complete them or rewrite
- [ ] Implement `LessonDetail.tsx` (desktop) — students, songs, recap, homework, notes
- [ ] Implement `LessonApp.tsx` — wires sidebar + topbar + list ↔ detail navigation
- [ ] Implement `LessonAppMobile.tsx` — mobile list ↔ detail
- [ ] Create `app/design-preview/lessons/page.tsx` mounting the 5 artboards
- [ ] Lint pass clean
- [ ] Branch `feature/design-preview-lessons`, PR, verify in browser
