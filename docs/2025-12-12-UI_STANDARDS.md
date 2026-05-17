# UI Standards & Design System

This document outlines the UI standards for the application. All new components and pages should adhere to these standards to ensure consistency, accessibility, and a cohesive user experience across all devices.

## 1. Design Philosophy

- **Mobile-First**: Design for the smallest screen first, then enhance for larger screens.
- **Consistency**: Reuse existing components and patterns.
- **Simplicity**: Keep interfaces clean and focused on the user's task.
- **Feedback**: Provide immediate visual feedback for user actions.
- **Accessibility**: Ensure all components are accessible (keyboard navigable, proper contrast, touch targets).

## 2. Layout & Structure

### Multi-Display Optimization

The application is optimized for three primary display configurations:

1. **Ultrawide Monitor (3440x1440)** - Horizontal workspace with up to 10-column grids
2. **Portrait 1080p Display** - Vertical orientation with single-column stacking
3. **Mobile (iPhone 17 Pro Max - 430x932)** - Touch-optimized compact layout

### Page Container
Standardize page layouts to ensure content is centered and readable across all displays.

- **Max Width**: 
  - `max-w-7xl` for standard dashboard/app views
  - `max-w-screen-2xl` for admin dashboard (supports ultrawide)
  - `max-w-5xl` for focused content
- **Padding**: 
  - Mobile-first: `px-3 sm:px-4 md:px-6 lg:px-8`
  - Standard: `px-4 sm:px-6 lg:px-8`
- **Vertical Spacing**: 
  - Mobile-first: `space-y-4 sm:space-y-6 lg:space-y-8`
  - Standard: `space-y-6` or `space-y-8`

```tsx
<main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl space-y-6 sm:space-y-8">
  {/* Page Header */}
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Page Title</h1>
    {/* Actions - Full width on mobile, auto on desktop */}
    <div className="w-full sm:w-auto flex gap-2">
      {/* Action Buttons */}
    </div>
  </div>
  
  {/* Content */}
</main>
```

### Cards
Cards are the primary container for grouping related content.

- **Background**: `bg-card`
- **Border**: `border border-border`
- **Radius**: `rounded-xl`
- **Shadow**: `shadow-sm` (optional, use sparingly)
- **Hover**: `hover:border-primary/30 transition-all duration-300` for interactive cards
- **Padding**: 
  - Mobile-first: `p-3 sm:p-4 lg:p-6`
  - Standard: `p-4 sm:p-6`
- **Header Padding**: `pb-2 sm:pb-3` or `pb-3 sm:pb-6` for card headers

```tsx
<div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
  <div className="p-3 sm:p-4 lg:p-6 border-b border-border">
    <h3 className="text-base sm:text-lg font-semibold">Card Title</h3>
    <p className="text-xs sm:text-sm text-muted-foreground mt-1">Card description or subtitle.</p>
  </div>
  <div className="p-3 sm:p-4 lg:p-6">
    {/* Card Content */}
  </div>
  <div className="p-3 sm:p-4 lg:p-6 bg-muted/50 border-t border-border">
    {/* Card Footer (Optional) */}
  </div>
</div>
```

### Responsive Grid Layouts

Use adaptive grid systems for different displays:

- **Mobile (≤430px)**: Single column (`grid-cols-1`)
- **Small Phones (≥475px)**: `xs:grid-cols-2`
- **Standard Mobile/Tablet**: `sm:grid-cols-2`, `md:grid-cols-3`
- **Desktop**: `lg:grid-cols-3`, `xl:grid-cols-4`
- **Portrait Display (1080p)**: `portrait:grid-cols-1` or `portrait:grid-cols-2`
- **Ultrawide (≥2560px)**: `ultrawide:grid-cols-4/5/6/10`

```tsx
{/* Example: Adaptive Stats Grid */}
<div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 portrait:grid-cols-2 lg:grid-cols-5 ultrawide:grid-cols-10 gap-3 sm:gap-4 lg:gap-6">
  {/* Grid items */}
</div>
```

## 3. Typography

Use the configured font stack (Inter/Sans). Font sizes should adapt to screen size.

- **H1 (Page Title)**: `text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight`
- **H2 (Section Title)**: `text-xl sm:text-2xl font-semibold tracking-tight`
- **H3 (Card Title)**: `text-lg font-semibold`
- **H4 (Subsection)**: `text-base font-medium`
- **Body**: `text-sm` or `text-base text-foreground`
- **Muted/Subtitle**: `text-sm text-muted-foreground`
- **Small/Label**: `text-xs font-medium text-muted-foreground uppercase tracking-wider`

### Responsive Typography

Apply responsive font sizing for optimal readability:

- **Mobile (≤430px)**: Use smaller base sizes (`text-xs`, `text-sm`)
- **Tablet**: Standard sizes with `sm:` prefix
- **Desktop**: Larger sizes with `lg:` and `xl:` prefixes
- **Ultrawide**: Maximum sizes for enhanced readability

```tsx
{/* Example: Responsive heading */}
<h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">
  Dashboard Title
</h1>
```

## 4. Colors & Status

Use semantic colors to convey meaning. Avoid hardcoding hex values; use Tailwind utility classes that map to CSS variables.

### Status Indicators

| Status | Meaning | Classes |
| :--- | :--- | :--- |
| **Success** | Completed, Active, Paid | `text-green-600 bg-green-50 border-green-200` (Light) / `text-green-400 bg-green-500/10 border-green-500/20` (Dark/Adaptive) |
| **Primary** | In Progress, Submitted | `text-primary bg-primary/10 border-primary/20` |
| **Warning** | Due Soon, Pending Action | `text-yellow-600 bg-yellow-50 border-yellow-200` / `text-yellow-400 bg-yellow-500/10 border-yellow-500/20` |
| **Destructive** | Overdue, Error, Deleted | `text-destructive bg-destructive/10 border-destructive/20` |
| **Neutral** | Inactive, Draft | `text-muted-foreground bg-muted border-border` |

### Usage Example (Badge)

```tsx
<Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20">
  Active
</Badge>
```

## 5. Components

### Buttons
- **Primary**: `default` variant. For main actions.
- **Secondary**: `outline` or `secondary` variant. For cancel/back actions.
- **Destructive**: `destructive` variant. For delete/remove actions.
- **Ghost**: `ghost` variant. For icon buttons or less prominent actions.
- **Mobile**: Buttons should often be full-width (`w-full`) on mobile devices for easier interaction.

### Inputs
- Always include a `<Label>` associated with the input.
- Use `placeholder` for guidance.
- Display validation errors with `text-destructive text-sm`.
- **Mobile**: Ensure inputs have `text-base` (16px) to prevent auto-zoom on iOS devices.

### Icons
- Library: `lucide-react`
- **Mobile Icon Sizes**:
  - Extra small: `h-3 w-3 sm:h-3.5 sm:w-3.5`
  - Small/inline: `h-3.5 w-3.5 sm:h-4 sm:w-4`
  - Standard: `h-4 w-4 sm:h-5 sm:w-5`
  - Large: `h-5 w-5 sm:h-6 sm:w-6`
  - Extra large: `h-6 w-6 sm:h-8 sm:w-8`
- **Desktop Only**: Use fixed sizes without responsive classes
- **Color**: Usually matches text color (`currentColor`), or specific status color
- **Spacing**: Icons should have adequate margin from text (`gap-1`, `gap-2`, etc.)

```tsx
{/* Responsive icon example */}
<Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />

{/* Icon with text */}
<div className="flex items-center gap-2">
  <CheckCircle className="h-4 w-4 text-green-600" />
  <span className="text-sm">Completed</span>
</div>
```

### Spacing & Gaps

Consistent spacing creates visual hierarchy and improves readability:

- **Component Gaps** (flexbox/grid):
  - Mobile: `gap-1.5 sm:gap-2` or `gap-2 sm:gap-3`
  - Standard: `gap-2`, `gap-3`, `gap-4`
  - Large sections: `gap-4 sm:gap-6`
  - Ultrawide: `gap-6`, `gap-8`

- **Vertical Spacing** (stacked elements):
  - Tight: `space-y-2 sm:space-y-3`
  - Standard: `space-y-3 sm:space-y-4` or `space-y-4 sm:space-y-6`
  - Loose: `space-y-6 sm:space-y-8`

- **Padding**:
  - Compact (mobile-first): `p-2 sm:p-3 lg:p-4`
  - Standard: `p-3 sm:p-4 lg:p-6`
  - Generous: `p-4 sm:p-6 lg:p-8`

```tsx
{/* Responsive grid with adaptive gaps */}
<div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
  {/* Grid items */}
</div>
```

## 6. Animations

Use subtle animations to enhance the user experience, not distract.

- **Fade In**: `animate-fade-in`
- **Slide Up**: `animate-slide-up` (custom class often used for entering elements)
- **Transitions**: `transition-all duration-200` or `duration-300` ease-in-out.

```tsx
// Staggered list animation
<div className="opacity-0 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
  {/* Content */}
</div>
```

## 7. Tables & Lists

### Tables
- Wrap in a rounded border container.
- Header: `bg-muted/50` text `text-muted-foreground`.
- Rows: `hover:bg-muted/50 transition-colors`.
- Cells: `p-4 align-middle`.
- **Mobile**: Tables often break on mobile. Use a horizontal scroll wrapper OR convert rows to card-like views for small screens.

### Lists
- Use `divide-y divide-border` for separation.
- Interactive rows should have hover states.

```tsx
<div className="rounded-md border border-border overflow-x-auto">
  <Table className="min-w-[600px]">
    {/* Table Content */}
  </Table>
</div>
```

## 8. Empty States

Always provide a clear empty state when no data is available.

- **Icon**: Large, muted icon (`w-12 h-12 text-muted-foreground/50`).
- **Title**: Clear statement ("No students found").
- **Description**: Helpful context or next step ("Get started by adding a new student.").
- **Action**: Primary button to create/add.

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center space-y-4 border-2 border-dashed border-border rounded-xl bg-muted/10">
  <Users className="w-12 h-12 text-muted-foreground/50" />
  <div className="space-y-1">
    <h3 className="font-semibold text-lg">No students yet</h3>
    <p className="text-muted-foreground text-sm max-w-sm">
      Add your first student to start tracking their progress.
    </p>
  </div>
  <Button>Add Student</Button>
</div>
```

## 9. Mobile Design & Responsiveness

### Touch Targets
Ensure all interactive elements are large enough to be easily tapped.
- **Minimum Size**: 44x44px for touch targets.
- **Spacing**: Ensure adequate spacing between interactive elements to prevent accidental clicks.

### Navigation
- **Mobile (≤768px)**: Top horizontal bar with hamburger menu
- **Tablet/Desktop (≥768px)**: Top horizontal navigation bar
- **Widescreen (≥1024px)**: **Left sidebar** (preferred for better UX on wide displays)
- **Ultrawide (≥2560px)**: Left sidebar with expanded width options
- **Actions**: Primary actions should be within easy reach of the thumb on mobile (bottom of screen)

**Sidebar Best Practices:**
- Position on the **left** for widescreen and ultrawide displays
- Use a collapsible/expandable design
- Include clear visual indicators for active routes
- Maintain consistent width (e.g., `w-64` expanded, `w-16` collapsed)
- Provide smooth transitions between states

### Modals & Dialogs
- **Desktop**: Centered Dialog.
- **Mobile**: Bottom Sheet (Drawer) or Full-screen Dialog.

```tsx
// Example: Responsive Dialog/Drawer
import { useMediaQuery } from "@/hooks/use-media-query"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Drawer, DrawerContent } from "@/components/ui/drawer"

export function ResponsiveDialog({ children, open, onOpenChange }) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>{children}</DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>{children}</DrawerContent>
    </Drawer>
  )
}
```

### Forms on Mobile
- **Stacking**: Stack form fields vertically.
- **Input Types**: Use correct `type` attributes (`tel`, `email`, `number`) to trigger the appropriate keyboard.
- **Auto-zoom**: Ensure input font size is at least 16px to prevent iOS auto-zoom.

## 10. Responsive Breakpoint Reference

### Standard Tailwind Breakpoints
- `sm`: 640px - Small tablets and large phones
- `md`: 768px - Tablets portrait
- `lg`: 1024px - Tablets landscape, small laptops
- `xl`: 1280px - Laptops
- `2xl`: 1536px - Large laptops, desktops

### Custom Breakpoints
- `xs`: 475px - Small phones landscape (custom)
- `portrait`: 1080px with `orientation: portrait` - Vertical displays (custom)
- `ultrawide`: 2560px - Ultrawide monitors (3440x1440, 2560x1080, etc.) (custom)

### Mobile-First Approach

Always start with mobile layout and enhance for larger screens:

```tsx
{/* Mobile-first responsive component */}
<div className="
  px-3 sm:px-4 md:px-6 lg:px-8
  text-sm sm:text-base lg:text-lg
  grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ultrawide:grid-cols-6
  gap-2 sm:gap-3 lg:gap-4 ultrawide:gap-6
">
  {/* Content */}
</div>
```

### Target Display Specifications

1. **iPhone 17 Pro Max**: 430x932px (mobile)
   - Single column layouts
   - Touch-optimized (44px minimum)
   - Compact spacing

2. **Portrait 1080p**: 1080x1920px (vertical display)
   - Single/dual column layouts
   - Vertical scrolling optimized
   - Full-width components

3. **Ultrawide 3440x1440**: (horizontal workspace)
   - Multi-column grids (4-10 columns)
   - Left sidebar navigation
   - Maximum horizontal space utilization

## Summary Checklist

When creating new components or pages, ensure:

- [ ] Mobile-first responsive design
- [ ] Proper spacing (px-3 sm:px-4 lg:px-8)
- [ ] Responsive typography (text-sm sm:text-base lg:text-lg)
- [ ] Touch targets ≥44px on mobile
- [ ] Icons with responsive sizing (h-4 sm:h-5)
- [ ] Semantic color usage (no hardcoded hex)
- [ ] Proper grid layouts for all breakpoints
- [ ] Left sidebar on widescreen (≥1024px)
- [ ] Horizontal nav on mobile/tablet
- [ ] Smooth animations and transitions
- [ ] Empty states with clear CTAs
- [ ] Accessible keyboard navigation
- [ ] Dark mode support
