---
created: 2026-06-08
updated: 2026-06-08
status: not-started
slug: settings
---

# Settings

`/design-preview/settings`

## Status

**not-started**.

## Files on disk

None.

## Source files (bundle)

- `/tmp/strummy-design/strummy/project/src/settings.jsx` — `<SettingsApp width height tab>` with `tab` ∈ `billing | members | branding | integrations`

## Artboards to mount

| Label                            | Dim       | Prototype                           |
| -------------------------------- | --------- | ----------------------------------- |
| Settings · Billing (default tab) | 1440×1024 | `<SettingsApp tab="billing"/>`      |
| Settings · Members               | 1440×1024 | `<SettingsApp tab="members"/>`      |
| Settings · Branding              | 1440×1024 | `<SettingsApp tab="branding"/>`     |
| Settings · Integrations          | 1440×1024 | `<SettingsApp tab="integrations"/>` |

## Remaining TODO

- [ ] Read `settings.jsx` in full
- [ ] Implement `SettingsApp.tsx` (sidebar + topbar + tab nav + active tab pane)
- [ ] Implement per-tab pane components: `BillingPane`, `MembersPane`, `BrandingPane`, `IntegrationsPane`
- [ ] Local types in `types.ts`, local data in `data.ts`
- [ ] Create `app/design-preview/settings/page.tsx` mounting all 4 artboards
- [ ] Lint clean
- [ ] Branch `feature/design-preview-settings`, PR, verify
