# Font System

A flexible font management system for easy font switching across the Guitar CRM application.

## Quick Start

### Switch Fonts

To change the app's font scheme, edit `lib/fonts/fonts.config.ts`:

```typescript
export const ACTIVE_FONT_SCHEME: keyof typeof FONT_SCHEMES = 'inter'; // Change this
```

Available schemes:
- `'geist'` - Modern, clean, highly readable (default)
- `'inter'` - Professional and versatile
- `'plusJakarta'` - Friendly geometric sans
- `'spaceGrotesk'` - Bold and distinctive
- `'poppins'` - Excellent readability
- `'dmSans'` - Low-contrast, easy on the eyes (includes display font)

## Architecture

### Files

```
lib/fonts/
├── fonts.config.ts   # Font scheme definitions and configuration
├── index.ts          # Font loading and utility functions
└── 2026-03-16-2025-11-02-README.md         # This file
```

### How It Works

1. **Configuration** (`fonts.config.ts`)
   - Define font schemes with sans, mono, and optional display fonts
   - Set the active scheme via `ACTIVE_FONT_SCHEME`

2. **Loading** (`index.ts`)
   - Imports all fonts via `next/font/google`
   - Maps font families to loaded instances
   - Provides utilities to get active fonts

3. **Application** (`app/layout.tsx`)
   - Calls `getFontVariableClasses()` to get CSS variable classes
   - Applies classes to `<body>` element

4. **Styling** (`app/globals.css`)
   - CSS variables are referenced in Tailwind's `@theme inline` block
   - Tailwind utilities like `font-sans` and `font-mono` use these variables

## Adding New Fonts

### 1. Add to Config

Edit `lib/fonts/fonts.config.ts`:

```typescript
export const FONT_SCHEMES: Record<string, FontScheme> = {
  // ... existing schemes
  myCustomScheme: {
    name: 'My Custom Fonts',
    description: 'Your description here',
    fonts: {
      sans: {
        family: 'Montserrat',
        weights: [400, 500, 600, 700],
        subsets: ['latin'],
        variable: '--font-montserrat',
      },
      mono: {
        family: 'Roboto Mono',
        subsets: ['latin'],
        variable: '--font-roboto-mono',
      },
    },
  },
};
```

### 2. Load the Fonts

Edit `lib/fonts/index.ts`:

```typescript
import { Montserrat, Roboto_Mono } from 'next/font/google';

const montserrat = Montserrat({
  variable: '--font-montserrat',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

const robotoMono = Roboto_Mono({
  variable: '--font-roboto-mono',
  subsets: ['latin'],
});

// Add to fontMap
const fontMap = {
  // ... existing fonts
  Montserrat: montserrat,
  'Roboto Mono': robotoMono,
};
```

### 3. Activate

```typescript
export const ACTIVE_FONT_SCHEME = 'myCustomScheme';
```

## Display Fonts

Some schemes include a `display` font for headings. Example:

```typescript
fonts: {
  sans: { family: 'DM Sans', ... },
  display: { family: 'DM Serif Display', ... },
  mono: { family: 'IBM Plex Mono', ... },
}
```

Use in components:

```tsx
<h1 className="font-display text-4xl">My Heading</h1>
```

Make sure to add the display font to Tailwind's theme in `globals.css`:

```css
@theme inline {
  --font-display: var(--font-dm-serif);
}
```

## Font Utilities

### `getActiveFonts()`

Returns the current font instances:

```typescript
import { getActiveFonts } from '@/lib/fonts';

const { sans, mono, display } = getActiveFonts();
```

### `getFontVariableClasses()`

Returns space-separated CSS variable class names:

```typescript
import { getFontVariableClasses } from '@/lib/fonts';

const classes = getFontVariableClasses();
// Returns: "--font-geist-sans --font-geist-mono"
```

### `getActiveFontScheme()`

Returns the active font scheme configuration:

```typescript
import { getActiveFontScheme } from '@/lib/fonts/fonts.config';

const scheme = getActiveFontScheme();
console.log(scheme.name); // "Geist (Default)"
```

## Dynamic Font Switching (Future)

To enable runtime font switching:

1. Store selected font in user preferences (database or localStorage)
2. Create a React Context Provider to manage font state
3. Update `<body>` className dynamically
4. Build a settings UI component

Example implementation:

```typescript
// lib/fonts/FontProvider.tsx
'use client';

import { createContext, useContext, useState } from 'react';

const FontContext = createContext<{
  scheme: string;
  setScheme: (scheme: string) => void;
}>({ scheme: 'geist', setScheme: () => {} });

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [scheme, setScheme] = useState('geist');

  return (
    <FontContext.Provider value={{ scheme, setScheme }}>
      {children}
    </FontContext.Provider>
  );
}

export const useFonts = () => useContext(FontContext);
```

## Tailwind Integration

The font system integrates with Tailwind CSS 4 via CSS variables:

**In `globals.css`:**
```css
@theme inline {
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

**Use in components:**
```tsx
<p className="font-sans">Uses the active sans font</p>
<code className="font-mono">Uses the active mono font</code>
```

## Performance

All fonts are loaded via `next/font/google`, which:
- Automatically optimizes font loading
- Self-hosts fonts for better performance
- Eliminates external network requests
- Prevents layout shift with CSS size-adjust

Fonts are loaded at build time and cached indefinitely.
