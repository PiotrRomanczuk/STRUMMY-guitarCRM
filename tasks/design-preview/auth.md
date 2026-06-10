---
created: 2026-06-08
updated: 2026-06-08
status: merged
slug: auth
pr: 429
---

# Authentication

`/design-preview/auth`

## Status

**merged** in PR #429 on 2026-06-08. Live at `/design-preview/auth`.

## Files on disk (2026-06-08)

```
components/design-preview/auth/types.ts
components/design-preview/auth/data.ts
components/design-preview/auth/AuthFrame.tsx
components/design-preview/auth/AuthSignIn.tsx
components/design-preview/auth/AuthMagicLinkSent.tsx
components/design-preview/auth/AuthRoleSelect.tsx
app/design-preview/auth/page.tsx
```

## Source files (bundle)

- `/tmp/strummy-design/strummy/project/src/auth.jsx`

## Artboards mounted

| Label                                    | Dim      | Component              |
| ---------------------------------------- | -------- | ---------------------- |
| Sign in · email + magic link + SSO       | 1280×800 | `<AuthSignIn/>`        |
| Magic link sent · check your inbox       | 1280×800 | `<AuthMagicLinkSent/>` |
| Role select · teacher · student · parent | 1280×800 | `<AuthRoleSelect/>`    |

## Notes from the agent

- `StaffLines` re-ported locally inside `AuthFrame.tsx` (foundation doesn’t export it yet)
- Envelope icon inlined as `AUTH_EMAIL_ICON` in `data.ts` (not in foundation `I` dictionary)
- `AuthRoleSelect` is the only `'use client'` (toggles selected role); others stay server components
- 3 `max-lines-per-function` warnings, no errors

## Remaining TODO

- [x] Verify in browser at `/design-preview/auth`
- [x] Branch `feature/design-preview-auth`, commit, push, open PR #429
- [x] Squash-merged 2026-06-08
- [ ] Follow-up: extract `StaffLines` into shared foundation primitives
- [ ] Follow-up: add a generic `envelope` icon to the foundation `I` dictionary
