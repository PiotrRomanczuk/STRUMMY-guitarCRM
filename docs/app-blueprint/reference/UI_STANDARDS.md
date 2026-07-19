---
created: 2026-06-16
updated: 2026-06-16
---

# Strummy — UI & Design Standards

> Cross-ref: [`docs/app-blueprint/`](../README.md) (editorial is the sole UI generation — see 00-overview). These standards apply to the **editorial** components — the sole UI generation — under `components/<domain>/editorial/*`.

Living reference for layout, tokens, responsiveness, and component conventions. All new editorial pages/components follow these rules for consistency, accessibility, and a cohesive cross-device experience.

## Design Philosophy

| Principle         | Rule                                                                |
| :---------------- | :------------------------------------------------------------------ |
| **Mobile-first**  | Design smallest screen first, enhance upward                        |
| **Consistency**   | Reuse existing components and patterns; extend, don't rebuild       |
| **Simplicity**    | Clean interfaces focused on the user's task                         |
| **Feedback**      | Immediate visual feedback for user actions                          |
| **Accessibility** | Keyboard navigable, proper contrast, touch targets ≥44px, dark mode |

---

## Design Tokens

Use Tailwind utilities mapping to CSS variables. **Never hardcode hex values.** Always pair light styles with `dark:` variants.

### Color & Status

| Status          | Meaning                 | Classes                                                                                                          |
| :-------------- | :---------------------- | :--------------------------------------------------------------------------------------------------------------- |
| **Success**     | Completed, Active, Paid | `text-green-600 bg-green-50 border-green-200` / dark: `text-green-400 bg-green-500/10 border-green-500/20`       |
| **Primary**     | In Progress, Submitted  | `text-primary bg-primary/10 border-primary/20`                                                                   |
| **Warning**     | Due Soon, Pending       | `text-yellow-600 bg-yellow-50 border-yellow-200` / dark: `text-yellow-400 bg-yellow-500/10 border-yellow-500/20` |
| **Destructive** | Overdue, Error, Deleted | `text-destructive bg-destructive/10 border-destructive/20`                                                       |
| **Neutral**     | Inactive, Draft         | `text-muted-foreground bg-muted border-border`                                                                   |

Surfaces: `bg-card`, `bg-muted/50`, `border-border`, `text-foreground`, `text-muted-foreground`.

### Spacing Scale

Progressive, mobile-first: `gap-1.5 → 2 → 3 → 4 → 6 → 8`.

| Use                      | Compact (mobile-first)   | Standard                 | Generous                               |
| :----------------------- | :----------------------- | :----------------------- | :------------------------------------- |
| **Padding**              | `p-2 sm:p-3 lg:p-4`      | `p-3 sm:p-4 lg:p-6`      | `p-4 sm:p-6 lg:p-8`                    |
| **Gaps**                 | `gap-1.5 sm:gap-2`       | `gap-2`/`gap-3`/`gap-4`  | `gap-4 sm:gap-6` / ultrawide `gap-6/8` |
| **Vertical (`space-y`)** | `space-y-2 sm:space-y-3` | `space-y-3 sm:space-y-4` | `space-y-6 sm:space-y-8`               |

### Typography

Font stack: Inter / Sans. Sizes adapt to screen.

| Element             | Classes                                                              |
| :------------------ | :------------------------------------------------------------------- |
| **H1 (Page Title)** | `text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight`          |
| **H2 (Section)**    | `text-xl sm:text-2xl font-semibold tracking-tight`                   |
| **H3 (Card Title)** | `text-lg font-semibold`                                              |
| **H4 (Subsection)** | `text-base font-medium`                                              |
| **Body**            | `text-sm` / `text-base text-foreground`                              |
| **Muted/Subtitle**  | `text-sm text-muted-foreground`                                      |
| **Small/Label**     | `text-xs font-medium text-muted-foreground uppercase tracking-wider` |

Mobile inputs must be ≥16px (`text-base`) to prevent iOS auto-zoom.

---

## Responsive / Mobile-First

Always start mobile, enhance upward. Always include `dark:` variants.

### Breakpoints

| Prefix               | Width                             | Target                                    |
| :------------------- | :-------------------------------- | :---------------------------------------- |
| `xs` (custom)        | 475px                             | Small phones landscape                    |
| `sm`                 | 640px                             | Large phones, small tablets               |
| `md`                 | 768px                             | Tablets portrait                          |
| `lg`                 | 1024px                            | Tablets landscape, laptops                |
| `xl`                 | 1280px                            | Laptops                                   |
| `2xl`                | 1536px                            | Large desktops                            |
| `portrait` (custom)  | ≥1080px + `orientation: portrait` | Vertical displays                         |
| `ultrawide` (custom) | 2560px                            | Ultrawide monitors (3440×1440, 2560×1080) |

Custom prefixes are defined in `app/globals.css` via `@media` + utility classes.

### Target Displays

| Display               | Size      | Layout                                                     |
| :-------------------- | :-------- | :--------------------------------------------------------- |
| **iPhone 17 Pro Max** | 430×932   | Single column, compact padding, touch targets ≥44px        |
| **Portrait 1080p**    | 1080×1920 | Single/dual column, vertical scroll, full-width components |
| **Ultrawide**         | 3440×1440 | 4–10 column grids, left sidebar, max horizontal use        |

### Mobile-First Example

```tsx
<div
  className="
  px-3 sm:px-4 md:px-6 lg:px-8
  text-sm sm:text-base lg:text-lg
  grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ultrawide:grid-cols-6
  gap-2 sm:gap-3 lg:gap-4 ultrawide:gap-6
"
>
  {/* Content */}
</div>
```

### Touch & Navigation

- **Touch targets**: min 44×44px (e.g. `h-7 sm:h-8` patterns).
- **Mobile (≤768px)**: top bar + hamburger; primary actions within thumb reach.
- **Tablet (≥768px)**: top horizontal nav.
- **Widescreen (≥1024px)**: left sidebar (preferred) — collapsible, active-route indicators, `w-64` expanded / `w-16` collapsed, smooth transitions.
- **Forms**: stack vertically; correct input `type` (`tel`/`email`/`number`); input ≥16px.

### Modals & Dialogs

Desktop = centered `Dialog`. Mobile = `Drawer` (bottom sheet) / full-screen. Switch via `useMediaQuery("(min-width: 768px)")`.

```tsx
const isDesktop = useMediaQuery('(min-width: 768px)');
return isDesktop ? (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>{children}</DialogContent>
  </Dialog>
) : (
  <Drawer open={open} onOpenChange={onOpenChange}>
    <DrawerContent>{children}</DrawerContent>
  </Drawer>
);
```

---

## Layout & Containers

### Page Container

| Use                         | Max width                             |
| :-------------------------- | :------------------------------------ |
| Standard dashboard/app      | `max-w-7xl`                           |
| Admin dashboard (ultrawide) | `max-w-screen-2xl` / `max-w-[2400px]` |
| Focused content             | `max-w-5xl`                           |

- **Padding**: `px-3 sm:px-4 md:px-6 lg:px-8` (or standard `px-4 sm:px-6 lg:px-8`).
- **Vertical spacing**: `space-y-4 sm:space-y-6 lg:space-y-8`.

```tsx
<main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl space-y-6 sm:space-y-8">
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Page Title</h1>
    <div className="w-full sm:w-auto flex gap-2">{/* Actions */}</div>
  </div>
  {/* Content */}
</main>
```

### Cards

Primary container for grouped content.

- **Surface**: `bg-card rounded-xl border border-border` (+ `shadow-sm` sparingly).
- **Interactive hover**: `hover:border-primary/30 transition-all duration-300`.
- **Padding**: `p-3 sm:p-4 lg:p-6`; header `pb-2 sm:pb-3` (or `pb-3 sm:pb-6`).

```tsx
<div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
  <div className="p-3 sm:p-4 lg:p-6 border-b border-border">
    <h3 className="text-base sm:text-lg font-semibold">Card Title</h3>
    <p className="text-xs sm:text-sm text-muted-foreground mt-1">Subtitle.</p>
  </div>
  <div className="p-3 sm:p-4 lg:p-6">{/* Content */}</div>
</div>
```

### Responsive Grids

| Display               | Pattern                                                  |
| :-------------------- | :------------------------------------------------------- |
| Mobile (≤430px)       | `grid-cols-1`                                            |
| Small phones (≥475px) | `xs:grid-cols-2`                                         |
| Mobile/tablet         | `sm:grid-cols-2`, `md:grid-cols-3`                       |
| Desktop               | `lg:grid-cols-3`, `xl:grid-cols-4`                       |
| Portrait 1080p        | `portrait:grid-cols-1` / `portrait:grid-cols-2`          |
| Ultrawide (≥2560px)   | `ultrawide:grid-cols-4/5/6/10`, `ultrawide:col-span-2/3` |

```tsx
<div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 portrait:grid-cols-2 lg:grid-cols-5 ultrawide:grid-cols-10 gap-3 sm:gap-4 lg:gap-6">
  {/* Stats */}
</div>
```

---

## Dashboard Patterns

Dashboard pages use a consistent layout wrapper (`DashboardPageLayout`): title + description on the left, primary action on the right; stacks vertically on mobile, row on `md+`.

```tsx
<DashboardPageLayout
  title="Page Title"
  description="Optional description text."
  action={<Button>Add New</Button>}
>
  {/* Page Content */}
</DashboardPageLayout>
```

### Display-Adaptive Grids

| Display            | Behavior                                                                                                 |
| :----------------- | :------------------------------------------------------------------------------------------------------- |
| **Ultrawide**      | Lesson stats up to 8 cols; admin stats 10-col (2/stat); students 5-col (3 main + 2 sidebar); larger gaps |
| **Portrait 1080p** | Stack vertically; single column, dual-column for compact stats                                           |
| **Mobile**         | Single column stacked cards; compact padding; collapsible sections                                       |

Component baselines: container `max-w-[2400px]`, padding `px-3 sm:px-4 md:px-6 lg:px-8`, spacing `space-y-4 sm:space-y-6 lg:space-y-8`. Stat cards: `text-xl sm:text-2xl lg:text-3xl`, icons `h-3.5 w-3.5 sm:h-4 sm:w-4`.

---

## Table & Filter Patterns

### Filter Interface

- **Container**: `bg-card rounded-lg border shadow-sm p-4 space-y-4`.
- **Layout**: responsive grid — `grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4` (adapt to filter count).
- **Inputs**: every input has a `Label` above it. Text search uses `Input` with a clear placeholder ("Search by email, name…"); dropdowns use `Select` with placeholder + `SelectContent`/`SelectItem`.
- **Reset**: `variant="outline"`, `w-full`, bottom-aligned with inputs via `flex items-end`.

### Data Tables

Use shadcn `Table` primitives (`@/components/ui/table`) exclusively — no raw HTML `table`/`input`/`select`.

- **Wrapper**: `div` with `rounded-md border`.
- **Header**: `bg-muted/50`, `text-muted-foreground`.
- **Rows**: `hover:bg-muted/50 transition-colors`.
- **Cells**: `p-4 align-middle`.
- **Status**: `Badge`; user profiles: `Avatar`.
- **Actions column**: last column, `text-right`; buttons `size="sm" variant="ghost"|"outline"` (or `destructive` for delete).
- **Empty state (in-table)**: single `TableRow` → `TableCell` spanning all columns, `h-24 text-center`.

```tsx
<div className="rounded-md border overflow-x-auto">
  <Table className="min-w-[600px]">
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>{/* rows */}</TableBody>
  </Table>
</div>
```

**Mobile**: tables break on small screens — use horizontal scroll wrapper (`overflow-x-auto` + `min-w-[…]`) or convert rows to card views.

### Row Hover Quick-View

For complex rows (e.g. lessons with songs), surface detail on hover of the primary cell.

- **Trigger**: primary (first) cell, row gets `group`.
- **Card**: `absolute left-4 top-full mt-1 z-50 hidden group-hover:block w-64 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700`.
- **Content**: small headers (`text-xs font-semibold uppercase tracking-wider`), concise lists, limit items ("+X more").

### Lists

`divide-y divide-border` for separation; interactive rows get hover states.

---

## Component Conventions

**shadcn/ui via the shadcn MCP** — MANDATORY: when creating/modifying any UI component, query the shadcn MCP server first to look up APIs, props, and install components. Never guess shadcn APIs. **Extend existing components; don't rebuild.**

### Buttons

| Variant                 | Use                          |
| :---------------------- | :--------------------------- |
| `default`               | Primary actions              |
| `outline` / `secondary` | Cancel / back                |
| `destructive`           | Delete / remove              |
| `ghost`                 | Icon buttons, low-prominence |

Mobile: often `w-full` for easier tapping.

### Inputs

Always paired with `<Label>`; use placeholder for guidance; errors as `text-destructive text-sm`; mobile inputs `text-base` (16px).

### Icons

Library: `lucide-react`. Color matches text (`currentColor`) or status color; `gap-1`/`gap-2` from text.

| Size         | Classes                     |
| :----------- | :-------------------------- |
| Extra small  | `h-3 w-3 sm:h-3.5 sm:w-3.5` |
| Small/inline | `h-3.5 w-3.5 sm:h-4 sm:w-4` |
| Standard     | `h-4 w-4 sm:h-5 sm:w-5`     |
| Large        | `h-5 w-5 sm:h-6 sm:w-6`     |
| Extra large  | `h-6 w-6 sm:h-8 sm:w-8`     |

### Empty States (page-level)

Icon + title + description + CTA, in a dashed container.

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center space-y-4 border-2 border-dashed border-border rounded-xl bg-muted/10">
  <Users className="w-12 h-12 text-muted-foreground/50" />
  <div className="space-y-1">
    <h3 className="font-semibold text-lg">No students yet</h3>
    <p className="text-muted-foreground text-sm max-w-sm">
      Add your first student to start tracking progress.
    </p>
  </div>
  <Button>Add Student</Button>
</div>
```

### Animations

Subtle, never distracting: `animate-fade-in`, `animate-slide-up`, `transition-all duration-200|300 ease-in-out`. Stagger lists via `animationDelay` + `animationFillMode: 'forwards'`.

---

## Checklist

- [ ] Mobile-first responsive design; `dark:` variants everywhere
- [ ] Container padding `px-3 sm:px-4 lg:px-8`, responsive typography
- [ ] Touch targets ≥44px; responsive icon sizing
- [ ] Semantic colors only (no hardcoded hex)
- [ ] Grid layouts cover all breakpoints (xs → ultrawide/portrait)
- [ ] Left sidebar ≥1024px, horizontal nav on mobile/tablet
- [ ] shadcn primitives via the shadcn MCP — extend, don't rebuild
- [ ] Filters in card container with labeled inputs + reset
- [ ] Tables bordered; empty states `h-24 text-center`
- [ ] Page-level empty states with clear CTAs
- [ ] Smooth animations; accessible keyboard navigation
