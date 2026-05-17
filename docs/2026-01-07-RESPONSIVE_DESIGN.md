# Responsive Design Guide

## Display Optimizations

The Guitar CRM admin dashboard has been optimized for three primary displays:

### 1. **Ultrawide Monitor (3440x1440)**
- **Breakpoint**: `2560px+` (using `ultrawide:` prefix)
- **Grid Layouts**: Up to 10-column grids for maximum space utilization
- **Features**:
  - Admin stats displayed in 10-column grid (2 columns per stat)
  - Student management uses 5-column layout (3 for main, 2 for sidebar)
  - Lesson stats can span up to 8 columns
  - Optimized spacing with larger gaps

### 2. **Vertical Display (1080p Portrait)**
- **Detection**: `orientation: portrait` and `min-width: 1080px`
- **Grid Layouts**: Single and dual-column layouts
- **Features**:
  - Stack components vertically to maximize scrollable space
  - Single-column layout for most sections
  - Dual-column for compact stats
  - Optimized for vertical scrolling workflow

### 3. **iPhone 17 Pro Max (430x932)**
- **Breakpoint**: Mobile-first with max-width `430px`
- **Grid Layouts**: Single column with stacked cards
- **Features**:
  - Compact padding (3px base)
  - Smaller font sizes (text-xl → text-base)
  - Touch-optimized spacing
  - Responsive icon sizes (3.5w → 4w)
  - Collapsible sections

## Custom CSS Classes

### Ultrawide Classes
```css
.ultrawide:grid-cols-4      /* 4 columns */
.ultrawide:grid-cols-5      /* 5 columns */
.ultrawide:grid-cols-6      /* 6 columns */
.ultrawide:grid-cols-10     /* 10 columns */
.ultrawide:col-span-2       /* Span 2 columns */
.ultrawide:col-span-3       /* Span 3 columns */
.ultrawide:gap-8            /* 2rem gap */
.ultrawide:px-12            /* 3rem padding */
```

### Portrait Classes
```css
.portrait:grid-cols-1       /* Single column */
.portrait:grid-cols-2       /* Two columns */
.portrait:max-w-full        /* Full width */
```

### Extra Small (xs: 475px+)
```css
.xs:grid-cols-2             /* 2 columns for small phones */
```

## Component Responsiveness

### TeacherDashboardClient
- **Container**: `max-w-[2400px]` for ultrawide support
- **Padding**: `px-3 sm:px-4 md:px-6 lg:px-8`
- **Spacing**: `space-y-4 sm:space-y-6 lg:space-y-8`

### StatsCard
- **Font sizes**: `text-xl sm:text-2xl lg:text-3xl`
- **Icon sizes**: `h-3.5 w-3.5 sm:h-4 sm:w-4`
- **Padding**: Responsive with `pb-1.5 sm:pb-2`

### LessonStatsOverview
- **Grid**: `grid-cols-2 sm:grid-cols-2 md:grid-cols-4 ultrawide:grid-cols-8`
- **Gaps**: `gap-3 sm:gap-4`
- **Font sizes**: `text-xs sm:text-sm` for labels

### StudentList
- **Header padding**: `p-3 sm:p-4 lg:p-6`
- **Typography**: `text-base sm:text-lg` for titles

### TodaysAgenda
- **Card padding**: `px-3 sm:px-6`
- **Grid gaps**: `gap-1.5 sm:gap-2`
- **Icon sizes**: `h-3.5 w-3.5 sm:h-4 sm:w-4`

## Grid Layout Patterns

### Ultrawide (3440x1440)
```
┌─────────────────────────────────────────────────────┐
│  Lesson Stats (3/4 cols)  │  Today's Agenda (1/4)  │
├───────────────┬────────────┴────────────────────────┤
│ Needs Attn 2  │ Weekly Summary 2  │  Health 2      │
├───────────────┴─────────────────┬──────────────────┤
│  Student List (3/5 cols)        │ Sidebar (2/5)    │
├─────────────────────────────────┴──────────────────┤
│  Admin Stats (5 cards × 2 cols each = 10 total)    │
└─────────────────────────────────────────────────────┘
```

### Portrait 1080p
```
┌──────────────┐
│ Lesson Stats │
├──────────────┤
│Today's Agenda│
├──────────────┤
│ Needs Attn   │
├──────────────┤
│Weekly Summary│
├──────────────┤
│   Health     │
├──────────────┤
│ Student List │
├──────────────┤
│   Sidebar    │
├──────────────┤
│ Admin Stats  │
│ (2 columns)  │
└──────────────┘
```

### iPhone 17 Pro Max
```
┌────────┐
│ Header │
├────────┤
│ Lesson │
│ Stats  │
├────────┤
│Today's │
│ Agenda │
├────────┤
│ Needs  │
│  Attn  │
├────────┤
│ Weekly │
├────────┤
│ Health │
├────────┤
│Student │
│  List  │
├────────┤
│Sidebar │
├────────┤
│ Admin  │
│ Stats  │
│(2 cols)│
└────────┘
```

## Best Practices

1. **Mobile-First**: Start with mobile layout, then enhance for larger screens
2. **Container Constraints**: Use `max-w-[2400px]` for ultrawide screens
3. **Flexible Grids**: Use responsive grid classes that adapt to each display
4. **Touch Targets**: Minimum 44x44px on mobile (using `h-7 sm:h-8` patterns)
5. **Typography Scale**: Responsive font sizes (text-xs → sm → base → lg → xl → 2xl → 3xl)
6. **Spacing**: Progressive spacing (gap-1.5 → 2 → 3 → 4 → 6 → 8)

## Testing Displays

### Chrome DevTools Custom Devices
Add these custom device profiles:

**Ultrawide Monitor**
- Width: 3440px
- Height: 1440px
- Device pixel ratio: 1
- User agent: Desktop

**Portrait 1080p**
- Width: 1080px
- Height: 1920px
- Device pixel ratio: 1
- User agent: Desktop
- Orientation: Portrait

**iPhone 17 Pro Max**
- Width: 430px
- Height: 932px
- Device pixel ratio: 3
- User agent: Mobile Safari

## Implementation Notes

- All responsive classes are defined in `app/globals.css`
- Main dashboard layout in `components/dashboard/teacher/TeacherDashboardClient.tsx`
- Viewport configuration in `app/layout.tsx`
- Custom breakpoints leverage CSS `@media` queries with utility classes
