# Dashboard & Table Standardization Guide

## 1. Dashboard Page Layout

All dashboard pages should use a consistent layout component `DashboardPageLayout`.

### Structure
```tsx
<DashboardPageLayout
  title="Page Title"
  description="Optional description text."
  action={
    <Button>Primary Action</Button> // e.g., "Add New"
  }
>
  {/* Page Content */}
</DashboardPageLayout>
```

### Implementation Details
- **Header Section**: Flex container with title/description on the left and action button on the right.
- **Mobile Responsiveness**: Stack vertically on small screens, row on medium+.
- **Spacing**: Consistent padding and margins.

## 2. Table Standardization

All tables must use the Shadcn UI `Table` primitives found in `components/ui/table.tsx`.

### Structure
```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function MyTable({ data }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Column 1</TableHead>
            <TableHead>Column 2</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.col1}</TableCell>
              <TableCell>{item.col2}</TableCell>
              <TableCell className="text-right">
                {/* Actions */}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

### Key Requirements
- **Wrapper**: Always wrap the `Table` in a `div` with `rounded-md border` for consistent styling.
- **Headers**: Use `TableHead`.
- **Rows**: Use `TableRow`.
- **Cells**: Use `TableCell`.
- **Empty State**: Handle empty data gracefully (optional but recommended).

## 3. Implementation Todo List

- [ ] Create `components/dashboard/DashboardPageLayout.tsx`
- [ ] Refactor `components/songs/SongList/Table.tsx` to use Shadcn Table
- [ ] Refactor `components/users/UsersListTable.tsx` to use Shadcn Table
- [ ] Refactor `components/lessons/LessonTable.tsx` to use Shadcn Table
- [ ] Extract and Refactor `AssignmentsTable` from `components/assignments/AssignmentsList.tsx`
- [ ] Update `app/dashboard/songs/page.tsx` to use `DashboardPageLayout`
- [ ] Update `app/dashboard/users/page.tsx` to use `DashboardPageLayout`
- [ ] Update `app/dashboard/lessons/page.tsx` to use `DashboardPageLayout`
- [ ] Update `app/dashboard/assignments/page.tsx` to use `DashboardPageLayout`
