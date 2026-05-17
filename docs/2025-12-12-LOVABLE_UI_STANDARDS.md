# Lovable UI Standards

This document outlines the UI standards derived from the "Lovable" design system (based on `guitar-mastery-hub`). All new components and pages should adhere to these standards to ensure consistency.

## 1. Layout & Structure

### Page Container
- Use a centered container with padding.
- Max width: `max-w-7xl`.
- Spacing: `space-y-8` between major sections.

```tsx
<main className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
  {/* Content */}
</main>
```

### Cards
- Background: `bg-card`.
- Border: `border border-border`.
- Radius: `rounded-xl`.
- Hover Effect: `hover:border-primary/30 transition-all duration-300`.
- Glow Effect (Optional): Inner glow on hover.

```tsx
<div className="bg-card rounded-xl border border-border overflow-hidden">
  <div className="p-6 border-b border-border">
    <h3 className="font-semibold">Title</h3>
    <p className="text-sm text-muted-foreground mt-1">Subtitle</p>
  </div>
  <div className="p-6">
    {/* Content */}
  </div>
</div>
```

## 2. Animations

Use `animate-fade-in` for entrance animations. Add delays for staggered appearance.

```tsx
<div className="opacity-0 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
  {/* Content */}
</div>
```

## 3. Colors & Status

Use specific color combinations for status indicators (Badges, Icons, Text).

### Success (Completed, Active)
- Text: `text-green-500`
- Background: `bg-green-500/10`
- Border: `border-green-500/20`

### Primary (In Progress, Submitted)
- Text: `text-primary`
- Background: `bg-primary/10`
- Border: `border-primary/20`

### Warning (Due Soon, Pending)
- Text: `text-yellow-500`
- Background: `bg-yellow-500/10` (if needed)

### Destructive (Overdue, Error)
- Text: `text-destructive`
- Background: `bg-destructive/10`
- Border: `border-destructive/20`

### Muted (Pending, Inactive)
- Text: `text-muted-foreground`
- Background: `bg-muted`
- Border: `border-border`

## 4. Typography

- **Headings**: `font-bold tracking-tight`.
- **Subtitles**: `text-muted-foreground`.
- **Body**: `text-sm` or `text-base`.
- **Labels**: `text-xs font-medium`.

## 5. Components

### Badges
Use `variant="outline"` combined with the color utility classes above.

```tsx
<Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
  Label
</Badge>
```

### Icons
- Use `lucide-react` icons.
- Size: Typically `w-4 h-4` or `w-5 h-5`.
- Color: Match the text color of the context (e.g., `text-primary`).

## 6. Tables / Lists

- Wrap lists/tables in a Card container.
- Use `divide-y divide-border` for list items.
- Hover state: `hover:bg-secondary/50`.

```tsx
<div className="divide-y divide-border">
  {items.map(item => (
    <div className="p-4 hover:bg-secondary/50 transition-colors">
      {/* Item Content */}
    </div>
  ))}
</div>
```
