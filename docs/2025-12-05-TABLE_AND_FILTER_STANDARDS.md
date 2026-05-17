# Table and Filter UI Standards

This document outlines the required UI/UX standards for all data tables and filtering interfaces in the Guitar CRM application.

## 1. Filtering Interface

All list views with filtering capabilities must adhere to the following structure:

### Container
- **Component**: `div` with specific styling matching the card look.
- **Classes**: `bg-card rounded-lg border shadow-sm p-4 space-y-4`.

### Layout
- **Grid System**: Use a responsive grid for filter inputs.
  - Default: `grid-cols-1`
  - Small screens (`sm`): `grid-cols-2`
  - Medium screens (`md`): `grid-cols-4` (or adapted based on number of filters)
- **Gap**: `gap-4`.

### Input Components
- **Labels**: All inputs must have a `Label` (from `@/components/ui/label`) above them.
- **Text Search**: Use `Input` (from `@/components/ui/input`).
  - Placeholder: Clear description (e.g., "Search by email, name...").
- **Dropdowns**: Use `Select` (from `@/components/ui/select`).
  - Trigger must display a placeholder when no value is selected.
  - Content must use `SelectContent`, `SelectItem`.

### Actions
- **Reset Button**: Should be present if filters can be cleared.
  - Variant: `outline`.
  - Alignment: Aligned with the bottom of input fields (using `flex items-end`).
  - Width: `w-full` to match input fields in the grid.

## 2. Data Tables

All data tables must use the Shadcn UI Table components.

### Structure
- **Container**: `div` with `rounded-md border`.
- **Component**: `Table` (from `@/components/ui/table`).
- **Header**: `TableHeader` containing `TableRow` with `TableHead` items.
- **Body**: `TableBody` containing `TableRow` with `TableCell` items.

### Styling
- **Empty State**:
  - If no data is found, render a single `TableRow` with a `TableCell` spanning all columns.
  - Height: `h-24`.
  - Alignment: `text-center`.
- **Actions Column**:
  - If actions (Edit, Delete) are present, they should be in the last column.
  - Alignment: `text-right`.

### Components
- **Badges**: Use `Badge` (from `@/components/ui/badge`) for status indicators (e.g., Role, Status, Level).
- **Avatars**: Use `Avatar` (from `@/components/ui/avatar`) for user profiles if available.
- **Buttons**: Action buttons inside tables should usually be `size="sm"` and `variant="ghost"` or `variant="outline"` unless it's a primary action like "Delete" (which might be `variant="destructive"`).

## 3. Row Hover Details (Quick View)

To provide additional context without cluttering the table, use a hover card pattern for the primary column (e.g., Title or Name).

### Implementation

- **Trigger**: The primary cell (usually the first column) should be the trigger.
- **Interaction**: The details card appears when hovering over the primary cell or row.
- **Styling**:
  - Container: `absolute z-50 hidden group-hover:block w-64 p-4`.
  - Appearance: `bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700`.
  - Positioning: Typically `left-4 top-full mt-1` relative to the cell.
- **Content**:
  - Use small headers (`text-xs font-semibold text-gray-500 uppercase tracking-wider`).
  - Use concise lists or summaries.
  - Limit items (e.g., show top 3 and "+X more").

### Example Structure

```tsx
<TableRow className="group">
  <TableCell className="relative">
    <Link href="...">Title</Link>
    <div className="absolute left-4 top-full mt-1 z-50 hidden group-hover:block w-64 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
      {/* Details Content */}
    </div>
  </TableCell>
  {/* Other cells */}
</TableRow>
```

## 4. Consistency Checklist

- [ ] Filters are wrapped in a Card-like container (`bg-card rounded-lg border shadow-sm`).
- [ ] Filter layout is responsive (grid).
- [ ] All inputs have Labels.
- [ ] Table is wrapped in a bordered container (`rounded-md border`).
- [ ] Empty state is handled gracefully with `h-24 text-center`.
- [ ] Shadcn UI components are used exclusively (no raw HTML `input`, `select`, `table`).
- [ ] Row hover details are implemented for complex items (e.g., Lessons with songs).
