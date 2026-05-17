# Database Connection Layer

This document describes the database connection layer that manages routing between local and remote Supabase instances.

## Overview

The application supports dual database connections:
- **Local Supabase** (http://127.0.0.1:54321) - for local development
- **Remote Supabase** - for production/staging environments

The database layer automatically routes requests based on:
1. Request header override (`X-Database-Preference`)
2. Cookie preference (`sb-provider-preference`)
3. Environment defaults (prefers local if available)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Application                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐         ┌─────────────────┐                │
│  │   Frontend      │         │   Backend       │                │
│  │                 │         │                 │                │
│  │ DatabaseStatus  │         │ BackendDB       │                │
│  │ (client comp)   │         │ Indicator       │                │
│  │                 │         │ (server comp)   │                │
│  │ useDatabaseStatus│        │                 │                │
│  │ (hook)          │         │ DatabaseMiddleware│               │
│  └────────┬────────┘         └────────┬────────┘                │
│           │                           │                          │
│           └───────────┬───────────────┘                          │
│                       │                                          │
│           ┌───────────▼───────────┐                              │
│           │   Cookie/Header       │                              │
│           │   Preference          │                              │
│           └───────────┬───────────┘                              │
│                       │                                          │
│           ┌───────────▼───────────┐                              │
│           │   lib/database/       │                              │
│           │   - connection.ts     │                              │
│           │   - middleware.ts     │                              │
│           │   - index.ts          │                              │
│           └───────────┬───────────┘                              │
│                       │                                          │
└───────────────────────┼──────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌───────────────┐ ┌───────────────┐
│ Local DB      │ │ Remote DB     │
│ 127.0.0.1:    │ │ *.supabase.co │
│ 54321         │ │               │
└───────────────┘ └───────────────┘
```

## Components

### 1. Connection Layer (`lib/database/connection.ts`)

Provides low-level utilities for database configuration:

```typescript
import { DatabaseConnection, getDatabaseConfig, testConnection } from '@/lib/database';

// Get current config
const config = getDatabaseConfig();
console.log(config.url, config.type); // "http://127.0.0.1:54321", "local"

// Test connection
const status = await testConnection();
console.log(status.isConnected, status.latency); // true, 15
```

### 2. Middleware Layer (`lib/database/middleware.ts`)

For API routes and server components:

```typescript
import { 
  createRoutedSupabaseClient, 
  createRoutedServerClient,
  DatabaseMiddleware 
} from '@/lib/database';

// In API route
export async function GET(request: NextRequest) {
  const { client, type, isLocal } = createRoutedSupabaseClient(request);
  
  DatabaseMiddleware.log(type, 'Fetching songs');
  
  const { data } = await client.from('songs').select('*');
  
  const response = NextResponse.json(data);
  return DatabaseMiddleware.addHeaders(response, detectDatabasePreference(request));
}

// In server component
export default async function Page() {
  const { client, isLocal } = await createRoutedServerClient();
  const { data } = await client.from('profiles').select('*');
  // ...
}
```

### 3. Frontend Hook (`hooks/useDatabaseStatus.ts`)

For client components:

```typescript
'use client';

import { useDatabaseStatus } from '@/hooks';

export function MyComponent() {
  const { 
    type,           // 'local' | 'remote'
    isLocal,        // boolean
    isLoading,      // boolean
    error,          // string | null
    toggleDatabase, // () => void - switches between local/remote
    testConnection, // () => Promise<boolean> - tests actual connection
    status          // Full status object
  } = useDatabaseStatus();

  return (
    <div>
      <p>Connected to: {type}</p>
      <button onClick={toggleDatabase}>
        Switch to {isLocal ? 'remote' : 'local'}
      </button>
    </div>
  );
}
```

### 4. Backend Indicator (`components/debug/BackendDatabaseIndicator.tsx`)

Server component for displaying database status:

```tsx
import { BackendDatabaseIndicator } from '@/components/debug/BackendDatabaseIndicator';

export default async function Layout({ children }) {
  return (
    <div>
      <header>
        <BackendDatabaseIndicator variant="badge" />
      </header>
      {children}
    </div>
  );
}
```

### 5. Status API (`app/api/database/status/route.ts`)

HTTP endpoints for checking database status:

```bash
# Get current status
GET /api/database/status

# Test connection
POST /api/database/status

# Override with header
GET /api/database/status -H "X-Database-Preference: remote"
```

## Environment Variables

```bash
# Local Supabase (development)
NEXT_PUBLIC_SUPABASE_LOCAL_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_LOCAL_ANON_KEY=your-local-anon-key
SUPABASE_LOCAL_SERVICE_ROLE_KEY=your-local-service-role-key

# Remote Supabase (production)
NEXT_PUBLIC_SUPABASE_REMOTE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_REMOTE_ANON_KEY=your-remote-anon-key
SUPABASE_REMOTE_SERVICE_ROLE_KEY=your-remote-service-role-key

# Legacy variables (fallback)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Cookie Preference

The user's database preference is stored in a cookie:

- **Name**: `sb-provider-preference`
- **Values**: `local` | `remote`
- **Max Age**: 1 year
- **Path**: `/`

## Response Headers

API responses include database indicator headers:

| Header | Description |
|--------|-------------|
| `X-Database-Type` | Current database type (`local` or `remote`) |
| `X-Database-URL` | Database URL (truncated for security) |
| `X-Database-Source` | How preference was determined (`cookie`, `header`, `default`) |

## Usage in API Routes

Example of using the middleware in an API route:

```typescript
// app/api/songs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  createRoutedSupabaseClient,
  DatabaseMiddleware,
  detectDatabasePreference 
} from '@/lib/database';

export async function GET(request: NextRequest) {
  const dbContext = createRoutedSupabaseClient(request);
  
  // Log operation
  DatabaseMiddleware.log(dbContext.type, 'GET /api/songs');
  
  // Use the client
  const { data, error } = await dbContext.client
    .from('songs')
    .select('*');
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // Add database headers to response
  const response = NextResponse.json(data);
  return DatabaseMiddleware.addHeaders(response, detectDatabasePreference(request));
}
```

## Switching Databases

### Via Frontend
```typescript
const { toggleDatabase, switchTo } = useDatabaseStatus();

// Toggle
toggleDatabase();

// Switch to specific
switchTo('local');
switchTo('remote');
```

### Via Cookie (Manual)
```javascript
// Switch to remote
document.cookie = 'sb-provider-preference=remote; path=/; max-age=31536000';

// Switch to local
document.cookie = 'sb-provider-preference=local; path=/; max-age=31536000';

// Reload to apply
window.location.reload();
```

### Via Header (API Requests)
```bash
# Force remote for specific request
curl http://localhost:3000/api/songs \
  -H "X-Database-Preference: remote"
```

## Troubleshooting

### "No database configuration available"
- Check that at least one set of environment variables is properly configured
- Verify `.env.local` file exists and is readable

### Connection timeouts
- For local: Ensure `supabase start` is running
- For remote: Check network connectivity and firewall settings

### Cookie not persisting
- Check cookie settings in browser developer tools
- Ensure the app is served over HTTPS in production (cookies may be blocked otherwise)

### Headers not appearing
- Make sure to use `DatabaseMiddleware.addHeaders()` on the response
- Check that the API route is returning a `NextResponse` object

## File Structure

```
lib/
└── database/
    ├── index.ts           # Main exports
    ├── connection.ts      # Configuration & utilities
    └── middleware.ts      # API route middleware

hooks/
└── useDatabaseStatus.ts   # Frontend hook

components/
└── debug/
    ├── DatabaseStatus.tsx           # Existing frontend indicator
    └── BackendDatabaseIndicator.tsx # New server component

app/
└── api/
    └── database/
        └── status/
            └── route.ts   # Status API endpoint
```
