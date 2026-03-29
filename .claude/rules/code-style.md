---
description: Code conventions — component organization, naming, size limits, UI components, forms, styling
globs: ['components/**', 'lib/**', 'app/**', 'hooks/**', 'schemas/**']
---

## Component Organization

```
components/<domain>/<Feature>/
├── index.ts              # Re-exports
├── Feature.tsx           # Main component
├── Feature.Header.tsx    # Sub-components use Parent.Section.tsx naming
├── useFeature.ts         # Custom hook
└── feature.helpers.ts    # Pure utility functions
```

## Naming

- **Components/Types**: PascalCase (`StudentLesson.tsx`)
- **Functions/Variables**: camelCase (`fetchLessons()`)
- **Booleans**: `is/has/can` prefix (`isLoading`)
- **Hooks**: `use` prefix (`useStudentLesson`)
- **Sub-components**: `Parent.Section.tsx` (`StudentLesson.Song.tsx`)

## Size Limits (Enforced)

- Component file: Max 200 LOC
- Hook file: Max 150 LOC
- Function body: Max 50 LOC

## UI Components

**MANDATORY**: When creating or modifying ANY UI component, ALWAYS use the shadcn MCP server (configured in `.mcp.json`) to look up available components, check their APIs, and install new ones. Never guess at shadcn/ui component APIs or props -- query the MCP server first. Extend existing components rather than building from scratch.

## Form Validation

- Validate on blur, not on every keystroke
- Use Zod schemas from `/schemas`
- Clear errors when user starts typing

## Styling

Mobile-first with Tailwind breakpoints. Always include `dark:` variants.
