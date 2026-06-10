---
created: 2026-06-08
updated: 2026-06-08
status: not-started
slug: notifications
---

# Notifications / Activity

`/design-preview/notifications`

## Status

**not-started**.

## Files on disk

None.

## Source files (bundle)

- `/tmp/strummy-design/strummy/project/src/notifications.jsx` — full-pane activity feed with filters + daily digest rail

## Artboards to mount

| Label              | Dim       | Prototype                                         |
| ------------------ | --------- | ------------------------------------------------- |
| Activity · Desktop | 1440×1024 | `<NotificationsPane width={1440} height={1024}/>` |
| Activity · Mobile  | 390×844   | `<NotificationsPaneMobile/>`                      |

## Remaining TODO

- [ ] Read `notifications.jsx` in full
- [ ] Implement `NotificationsPane.tsx` (desktop)
- [ ] Implement `NotificationsPaneMobile.tsx`
- [ ] Local types + data
- [ ] Create `app/design-preview/notifications/page.tsx`
- [ ] Lint clean
- [ ] Branch `feature/design-preview-notifications`, PR, verify
