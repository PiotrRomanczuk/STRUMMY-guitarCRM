# Sidebar 8.1 — Classic Wide

**Date**: 2026-05-17
**Source**: `.claude/designs/strummy-design-bundle/project/sidebar-classic.jsx`
**Data**: `.claude/designs/strummy-design-bundle/project/shared.jsx` (lines 7–44)

Inventory of every region, element, and data point inside the sidebar — the prototype was built around generic SaaS analytics data (Acme / Reports / Funnels). The structure is reusable as-is; the labels need to be remapped to Strummy.

---

## 1. Container

| Spec         | Value                        |
| ------------ | ---------------------------- |
| Width        | `260px`                      |
| Height       | `100%`                       |
| Background   | `#fafaf8` (ivory)            |
| Border-right | `1px solid rgba(0,0,0,0.07)` |
| Font size    | `13px` base                  |
| Foreground   | `#1d1d1f`                    |
| Layout       | flex column, top → bottom    |

## 2. Region order (top → bottom)

1. Workspace switcher
2. Search input
3. Scrollable nav body (groups + lists)
4. Profile row (sticky at bottom, top border)

---

## 3. Workspace switcher (top)

- Pill button: tinted 22×22 square w/ initial · workspace name · chevron
- Click → opens dropdown anchored under the button (`zIndex: 20`)
- Dropdown items: each workspace (highlight = active) + divider + "New workspace" CTA
- State: `ws` (current), `wsOpen` (dropdown visibility)

**Prototype data** (3 workspaces) — `shared.jsx:7-11`:
| id | name | initial | tint |
|---|---|---|---|
| acme | Acme Analytics | A | blue `oklch(0.58 0.14 250)` |
| north | Northwind Co. | N | green `oklch(0.60 0.13 160)` |
| lumen | Lumen Labs | L | red `oklch(0.62 0.14 30)` |

> **Strummy mapping**: workspaces map to studios/schools if multi-tenant is in scope; otherwise hide this region and replace with a single "Strummy" brand row.

---

## 4. Search input

- Magnifier icon + text input + `⌘K` keycap hint
- Background `#f4f2ec`, focus border `rgba(0,0,0,0.07)`
- Filters all visible nav rows live (case-insensitive label match)

---

## 5. Nav body (scrollable)

Five collapsible groups, all open by default. State: `openGroups = { main, work, admin, pinned, recent }`.

### 5.1 Group "Analyze" (NAV_MAIN) — `shared.jsx:13-20`

| id       | label    | icon   | badge |
| -------- | -------- | ------ | ----- |
| home     | Overview | home   | —     |
| reports  | Reports  | chart  | 12    |
| funnels  | Funnels  | funnel | —     |
| cohorts  | Cohorts  | users  | —     |
| segments | Segments | layers | 3     |
| events   | Events   | bolt   | —     |

### 5.2 Group "Workspaces" (NAV_WORK) — `shared.jsx:21-26`

| id         | label      | icon | badge |
| ---------- | ---------- | ---- | ----- |
| dashboards | Dashboards | grid | —     |
| notebooks  | Notebooks  | book | —     |
| alerts     | Alerts     | bell | 2     |
| exports    | Exports    | down | —     |

### 5.3 Group "Pinned" (PINNED) — `shared.jsx:33-37`

Each item has a kind-based icon (dashboard / funnel / cohort).

| id  | label               | kind      |
| --- | ------------------- | --------- |
| p1  | Weekly KPI scan     | dashboard |
| p2  | Signup → Activation | funnel    |
| p3  | Retention · 30d     | cohort    |

### 5.4 Group "Recent" (RECENT, first 4 only) — `shared.jsx:38-44`

Each row shows a dot icon + label + monospaced relative-time stamp on the right.

| id  | label                    | when                        |
| --- | ------------------------ | --------------------------- |
| r1  | Q2 Revenue by plan       | 2m                          |
| r2  | Mobile onboarding funnel | 18m                         |
| r3  | EU trial conversions     | 1h                          |
| r4  | Churn cohort — Mar       | 3h                          |
| r5  | Feature flag impact      | yest (overflow — not shown) |

### 5.5 Group "Admin" (NAV_ADMIN) — `shared.jsx:27-31`

| id       | label        | icon |
| -------- | ------------ | ---- |
| sources  | Data sources | plug |
| team     | Team         | team |
| settings | Settings     | gear |

---

## 6. Profile row (bottom, sticky)

- 28×28 round avatar with initials
- Name + email (truncate)
- Notification bell icon button with red unread dot
- Settings gear icon button
- Top border `1px solid rgba(0,0,0,0.07)`

**Prototype data** — `sidebar-classic.jsx:133-136`:
| Field | Value |
|---|---|
| Initials | JM |
| Name | Jess Morales |
| Email | jess@acme.co |

---

## 7. Interaction states

| Element                         | State | Style                                                                                 |
| ------------------------------- | ----- | ------------------------------------------------------------------------------------- |
| Nav row (default)               | —     | transparent bg, mute fg                                                               |
| Nav row (hover)                 | —     | bg `rgba(0,0,0,0.04)`                                                                 |
| Nav row (active)                | —     | bg `oklch(0.94 0.03 250)`, fg `oklch(0.58 0.14 250)` (accent blue), `fontWeight: 500` |
| Nav row badge (default)         | —     | bg `rgba(0,0,0,0.06)`, fg mute                                                        |
| Nav row badge (active)          | —     | bg accent, fg `#fff`                                                                  |
| Group label                     | —     | uppercase 10.5px, 0.7 letter-spacing, mute color                                      |
| Group chevron                   | open  | rotated 90°                                                                           |
| Workspace dropdown row (active) | —     | bg `rgba(0,0,0,0.06)`                                                                 |

---

## 8. Icons used (from `shared.jsx` Icon component)

`home · chart · funnel · users · layers · bolt · grid · book · bell · down · plug · team · gear · star · clock · dot · search · chev · chevd · plus`

---

## 9. Strummy nav remap (proposed)

The prototype's analytics-themed labels need to be replaced with Strummy nav items. Mapping suggestion (based on current Strummy app):

| Group                         | Strummy items                                   |
| ----------------------------- | ----------------------------------------------- |
| **Teach** (was Analyze)       | Dashboard, Lessons, Students, Songs, Calendar   |
| **Practice** (was Workspaces) | Repertoire, Fretboard, Chord Quiz, Practice Log |
| **Pinned**                    | (user-pinned songs, lessons, students)          |
| **Recent**                    | (last opened lessons / students)                |
| **Admin**                     | Users, Settings, Billing                        |

The Profile row maps directly to `useUser()` data (name, email, avatar, notifications, settings link).

The Workspace switcher → either hide (single-tenant) or repurpose as a Role switcher (Admin / Teacher / Student) since Strummy already has that concept on the topbar.

---

## 10. Implementation notes / open questions

1. **Role switcher vs workspace switcher** — does the existing top-bar role switcher (already shipped in `AppShell`) make the workspace switcher redundant? Recommend hiding it for v1 and folding role switching into the profile row.
2. **Search behavior** — prototype filters visible rows only. Strummy needs a real `⌘K` command palette (cross-entity search: students, songs, lessons). Keep the input visually, but wire it to a separate palette overlay.
3. **Pinned + Recent persistence** — needs a `user_preferences.pinned_items` and a `recent_items` log; not in current schema.
4. **Icons** — current Strummy uses `lucide-react`. The prototype icons are inline SVGs in `shared.jsx:54+`; map each name → closest Lucide icon when porting.
5. **Mobile** — this is a desktop-only sidebar (260px fixed). Mobile needs a separate drawer/sheet pattern; not in the bundle for this direction.
6. **Collision with current `AppShell`** — `components/layout/AppShell.tsx` already has a sidebar implementation (just shipped in `feature/STRUM-dashboard-cleanup`). Need to decide: replace, or keep current and apply only visual tokens?
