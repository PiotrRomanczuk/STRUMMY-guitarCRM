# v2 Mobile Design System — Agent Reference

> Every v2 component built by any agent MUST follow this file.
> This is the single source of truth for visual consistency across all 19 features.

---

## 1. Existing Tokens (DO NOT change — defined in `globals.css`)

```
Primary:     hsl(42 90% 45%)   — gold (light) / hsl(42 90% 55%) (dark)
Accent:      hsl(350 75% 45%)  — red (both modes)
Success:     hsl(142 76% 36%)
Warning:     hsl(38 92% 50%)
Destructive: hsl(0 84% 60%)
Background:  hsl(40 20% 98%)   — warm white (light) / hsl(0 0% 8%) (dark)
Card:        hsl(0 0% 100%)    — white (light) / hsl(0 0% 12%) (dark)
Border:      hsl(40 10% 88%)   — warm gray (light) / hsl(0 0% 16%) (dark)
Radius:      0.625rem (10px)
Font:        Geist Sans (--font-sans), Geist Mono (--font-mono)
```

Use Tailwind semantic classes (`bg-primary`, `text-muted-foreground`, `border-border`) — never hardcode HSL.

---

## 2. v2 Spacing Scale

All v2 components use this consistent spacing:

| Context | Mobile (< md) | Tablet (md) | Desktop (lg+) |
|---------|---------------|-------------|----------------|
| Page padding | `px-4` | `px-6` | `px-8` |
| Section gap | `space-y-4` | `space-y-6` | `space-y-8` |
| Card padding | `p-4` | `p-5` | `p-6` |
| Card gap (grid) | `gap-3` | `gap-4` | `gap-6` |
| List item padding | `px-4 py-3` | `px-4 py-3` | `px-6 py-4` |
| Between fields (form) | `space-y-4` | `space-y-4` | `space-y-5` |
| Bottom nav height | `h-16` | hidden | hidden |
| Safe area bottom | `pb-[env(safe-area-inset-bottom)]` | — | — |

---

## 3. Touch Target Rules

**Minimum 44px** on all interactive elements at mobile viewport:

```tsx
// Buttons: always min-h-[44px]
<Button className="min-h-[44px] w-full sm:w-auto">Action</Button>

// List items: always min-h-[44px]
<div className="min-h-[44px] flex items-center px-4 py-3">

// Star ratings / toggles: 48px targets
<button className="w-12 h-12 flex items-center justify-center">

// Icon buttons: 44px with padding
<button className="p-2.5 rounded-lg"> {/* 40px icon area + padding = 44px+ */}
  <Icon className="h-5 w-5" />
</button>
```

---

## 4. v2 Component Patterns

### 4a. Mobile/Desktop Switching

Every v2 feature uses this pattern — mobile renders by default, desktop lazy-loaded:

```tsx
'use client';

import { lazy, Suspense } from 'react';
import { useLayoutMode } from '@/hooks/use-is-widescreen';

const DesktopView = lazy(() => import('./Feature.Desktop'));

export function Feature(props: FeatureProps) {
  const mode = useLayoutMode();

  if (mode === 'mobile') return <MobileView {...props} />;

  return (
    <Suspense fallback={<MobileView {...props} />}>
      <DesktopView {...props} />
    </Suspense>
  );
}
```

### 4b. MobilePageShell

Wrap every v2 page in this shell for consistent header + scroll + safe area:

```tsx
interface MobilePageShellProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;      // Top-right action buttons
  fab?: React.ReactNode;           // FloatingActionButton
  children: React.ReactNode;
}

// Structure:
// ┌─────────────────────────┐
// │ ← Title          [acts] │  sticky header
// │   subtitle              │
// ├─────────────────────────┤
// │                         │
// │   scrollable content    │
// │                         │
// │                         │
// ├─────────────────────────┤
// │   [bottom nav 64px]     │  from AppShell
// └─────────────────────────┘
// [FAB]                        fixed bottom-right, above nav
```

### 4c. Card-Based Lists (replacing tables)

All v2 lists use cards on mobile, tables on desktop:

```tsx
// Mobile card structure
<div className="bg-card rounded-xl border border-border p-4 space-y-2
               active:bg-muted/50 transition-colors">
  {/* Row 1: Primary info */}
  <div className="flex items-center justify-between">
    <span className="font-medium text-sm truncate">{title}</span>
    <StatusBadge status={status} />
  </div>
  {/* Row 2: Secondary info */}
  <div className="flex items-center gap-2 text-xs text-muted-foreground">
    <Calendar className="h-3.5 w-3.5" />
    <span>{date}</span>
    <span>·</span>
    <span>{detail}</span>
  </div>
</div>
```

Card list spacing: `space-y-2` between cards.

### 4d. Step Wizard Forms

All v2 forms with 3+ fields use the step wizard pattern (generalized from MobileSongForm):

```
┌────────────────────────────┐
│  ● ○ ○  Step 1 of 3       │  ProgressIndicator
├────────────────────────────┤
│                            │
│  Step title                │
│  [field 1]                 │  min-h-[400px] step content
│  [field 2]                 │
│  [field 3]                 │
│                            │
├────────────────────────────┤
│  [Previous]    [Next →]    │  sticky bottom, pb-safe
└────────────────────────────┘
```

Rules:
- Max 4 fields per step
- Validate before advancing (toast on error)
- Previous/Next buttons always visible (sticky bottom)
- Last step shows "Submit" instead of "Next"
- Use `pb-safe` on button container

### 4e. Bottom Sheets (replacing dialogs on mobile)

All v2 dialogs render as bottom sheets on mobile, centered dialogs on desktop:

```tsx
// Use existing Drawer component on mobile, Dialog on desktop
// See ResponsiveDialog pattern in 2025-12-12-UI_STANDARDS.md
// Bottom sheet min-height: 40vh, max-height: 85vh
// Always include drag handle (DrawerContent provides this)
```

### 4f. Filter Chips (replacing filter dropdowns)

All v2 filter bars use horizontal scroll chips:

```tsx
<div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
  <FilterChip label="All" active={!filter} onClick={() => setFilter(null)} />
  <FilterChip label="Active" active={filter === 'active'} onClick={() => setFilter('active')} />
  <FilterChip label="Completed" active={filter === 'completed'} onClick={() => setFilter('completed')} />
</div>

// FilterChip: pill shape, 36px height, primary bg when active
<button className={cn(
  "shrink-0 h-9 px-4 rounded-full text-sm font-medium transition-colors",
  "border border-border",
  active ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground"
)}>
```

### 4g. Floating Action Button

Primary creation action on mobile — fixed position above bottom nav:

```tsx
<button className={cn(
  "fixed right-4 z-40 rounded-full shadow-lg",
  "bg-primary text-primary-foreground",
  "w-14 h-14 flex items-center justify-center",
  "bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)]", // above bottom nav
  "active:scale-95 transition-transform"
)}>
  <Plus className="h-6 w-6" />
</button>
```

---

## 5. v2 Animation Standards

Use existing variants from `lib/animations/variants.ts`:

| Context | Variant | When |
|---------|---------|------|
| Page enter | `pageTransition` | Route change |
| List items | `listItem` inside `staggerContainer` | List render |
| Cards | `cardEntrance` | Card mount |
| Tap feedback | `tapScale` | Button/card press |
| Hover lift | `hoverLift` | Desktop card hover |
| Slide in | `slideInBottom` | Bottom sheet enter |
| Fade | `fadeIn` | Subtle element appear |

**Rules:**
- Use `staggerContainer` + `listItem` for all card lists
- Use `fastStaggerContainer` for lists with 10+ items
- Never animate on reduced-motion preference (`prefers-reduced-motion: reduce`)
- Page transitions: fade only, no slide (prevents scroll-position issues)

```tsx
import { motion } from 'framer-motion';
import { staggerContainer, listItem } from '@/lib/animations/variants';

<motion.div variants={staggerContainer} initial="hidden" animate="visible">
  {items.map(item => (
    <motion.div key={item.id} variants={listItem}>
      <Card {...item} />
    </motion.div>
  ))}
</motion.div>
```

---

## 6. v2 Typography Scale

| Element | Mobile | Desktop | Tailwind |
|---------|--------|---------|----------|
| Page title | 20px | 30px | `text-xl sm:text-2xl lg:text-3xl font-bold` |
| Section title | 16px | 20px | `text-base sm:text-lg lg:text-xl font-semibold` |
| Card title | 14px | 16px | `text-sm sm:text-base font-medium` |
| Body text | 14px | 14px | `text-sm` |
| Secondary text | 12px | 14px | `text-xs sm:text-sm text-muted-foreground` |
| Label | 12px | 12px | `text-xs font-medium text-muted-foreground` |
| Badge text | 11px | 12px | `text-[11px] sm:text-xs font-medium` |

---

## 7. v2 Icon Sizing

| Context | Mobile | Desktop | Tailwind |
|---------|--------|---------|----------|
| Navigation tab | 20px | — | `h-5 w-5` |
| Card inline | 14px | 16px | `h-3.5 w-3.5 sm:h-4 sm:w-4` |
| Action button | 20px | 20px | `h-5 w-5` |
| Empty state | 48px | 48px | `h-12 w-12` |
| FAB | 24px | — | `h-6 w-6` |
| Status indicator | 12px | 14px | `h-3 w-3 sm:h-3.5 sm:w-3.5` |

---

## 8. Status Badge Pattern

Consistent across all v2 features:

```tsx
const STATUS_STYLES = {
  active:    'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  pending:   'bg-primary/10 text-primary border-primary/20',
  warning:   'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  overdue:   'bg-destructive/10 text-destructive border-destructive/20',
  inactive:  'bg-muted text-muted-foreground border-border',
  completed: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
} as const;

<span className={cn(
  "inline-flex items-center rounded-full px-2.5 py-0.5",
  "text-[11px] sm:text-xs font-medium border",
  STATUS_STYLES[status]
)}>
  {label}
</span>
```

---

## 9. Dark Mode Rules

Every v2 component must work in dark mode. Rules:

- **Never use** `bg-white` or `text-black` — use `bg-card` and `text-foreground`
- **Never use** hardcoded colors — use CSS variable classes
- **Borders**: `border-border` (auto-switches)
- **Hover states**: `hover:bg-muted/50` (works in both modes)
- **Status colors**: Use `/10` opacity variants (e.g., `bg-green-500/10`) — readable in both modes
- **Test both modes** before marking complete

---

## 10. Swipe Actions Pattern

For swipeable list items (lessons, songs, assignments, notifications):

```
← swipe left  →  reveals action buttons on right
← swipe right →  reveals action buttons on left (optional)

┌──────────────────────┬──────┬──────┐
│  [Card content]      │ Edit │ Del  │  ← revealed on swipe-left
└──────────────────────┴──────┴──────┘
```

Rules:
- Swipe threshold: 80px before actions reveal
- Action buttons: 72px wide each, full card height
- Edit action: `bg-primary` with white icon
- Delete action: `bg-destructive` with white icon
- Snap back on incomplete swipe
- Only enable on mobile (`useLayoutMode() === 'mobile'`)

---

## 11. Empty State Pattern

Consistent across all v2 features:

```tsx
<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
    <Icon className="h-6 w-6 text-muted-foreground" />
  </div>
  <h3 className="text-base font-semibold mb-1">{title}</h3>
  <p className="text-sm text-muted-foreground mb-6 max-w-xs">{description}</p>
  <Button size="sm">{actionLabel}</Button>
</div>
```

---

## 12. Loading State Pattern

Consistent skeleton pattern:

```tsx
// Card skeleton
<div className="bg-card rounded-xl border border-border p-4 space-y-3 animate-pulse">
  <div className="h-4 bg-muted rounded w-3/4" />
  <div className="h-3 bg-muted rounded w-1/2" />
  <div className="h-3 bg-muted rounded w-2/3" />
</div>

// List skeleton: render 5 card skeletons in space-y-2
```

---

## 13. File Naming & Structure

Every v2 domain follows this exact structure:

```
components/v2/<domain>/
├── <Feature>.tsx              # Mobile-first (default render)
├── <Feature>.Desktop.tsx      # Desktop enhancement (lazy-loaded at lg+)
├── <Feature>.Skeleton.tsx     # Loading state
├── use<Feature>.ts            # Shared hook (if new; prefer reusing v1 hooks)
└── index.ts                   # Barrel exports
```

Rules:
- Mobile component is the default export
- Desktop component is a named export, lazy-loaded
- Reuse v1 hooks whenever possible — don't duplicate data fetching
- Each file < 200 LOC
- No `any` types

---

## 14. Responsive Breakpoint Quick Reference

```
Mobile:     < 768px   (useLayoutMode() === 'mobile')
Tablet:     768-1023px (useLayoutMode() === 'tablet')
Desktop:    >= 1024px  (useLayoutMode() === 'widescreen')

Tailwind:   sm:640  md:768  lg:1024  xl:1280  2xl:1536
Custom:     xs:475  ultrawide:2560
```

Primary design viewport: **390px** (iPhone 15 Pro)
Secondary: 768px (iPad), 1440px (desktop)

---

## Checklist for Every v2 Component

Before submitting, verify:

- [ ] Uses `MobilePageShell` wrapper (pages) or card pattern (components)
- [ ] Touch targets >= 44px
- [ ] `pb-safe` on any sticky bottom element
- [ ] Dark mode works (no hardcoded colors)
- [ ] Framer Motion animations use `variants.ts` presets
- [ ] Typography follows scale in section 6
- [ ] Icons follow sizing in section 7
- [ ] Empty state follows section 11 pattern
- [ ] Loading skeleton follows section 12 pattern
- [ ] File < 200 LOC
- [ ] No `any` types
- [ ] Reuses v1 hooks for data fetching (no new API calls)
