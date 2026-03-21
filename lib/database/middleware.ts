/**
 * Database Middleware Layer
 *
 * Server-side middleware that intercepts all API requests and routes them
 * to the appropriate database (local or remote) based on:
 * 1. Cookie preference (sb-provider-preference)
 * 2. Request header override (X-Database-Preference)
 * 3. Environment defaults
 *
 * This middleware is designed to be used in API routes and server components.
 */

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/database.types';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

export type DatabaseType = 'local' | 'remote';

export interface DatabaseContext {
  type: DatabaseType;
  url: string;
  isLocal: boolean;
  client: SupabaseClient<Database>;
}

export interface RequestDatabaseInfo {
  preferredType: DatabaseType;
  actualType: DatabaseType;
  source: 'cookie' | 'header' | 'default';
  url: string;
}

// ============================================
// CONFIGURATION DETECTION
// ============================================

function getLocalConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_LOCAL_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_LOCAL_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY;

  if (url && anonKey) {
    return { url, anonKey, serviceRoleKey, isAvailable: true };
  }
  return { url: '', anonKey: '', serviceRoleKey: '', isAvailable: false };
}

function getRemoteConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_REMOTE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_REMOTE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey =
    process.env.SUPABASE_REMOTE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && anonKey) {
    return { url, anonKey, serviceRoleKey, isAvailable: true };
  }
  return { url: '', anonKey: '', serviceRoleKey: '', isAvailable: false };
}

// ============================================
// DATABASE PREFERENCE DETECTION
// ============================================

/**
 * Detect database preference from request (for API routes)
 */
export function detectDatabasePreference(request: NextRequest): RequestDatabaseInfo {
  const localConfig = getLocalConfig();
  const remoteConfig = getRemoteConfig();

  // 1. Check for header/cookie override (development only)
  if (process.env.NODE_ENV === 'development') {
    const headerPref = request.headers.get('X-Database-Preference');
    if (headerPref === 'remote' || headerPref === 'local') {
      const isLocal = headerPref === 'local';
      const config = isLocal ? localConfig : remoteConfig;

      if (config.isAvailable) {
        return {
          preferredType: headerPref,
          actualType: headerPref,
          source: 'header',
          url: config.url,
        };
      }
    }

    // 2. Check cookie preference
    const cookiePref = request.cookies.get('sb-provider-preference')?.value;
    if (cookiePref === 'remote' || cookiePref === 'local') {
      const isLocal = cookiePref === 'local';
      const config = isLocal ? localConfig : remoteConfig;

      if (config.isAvailable) {
        return {
          preferredType: cookiePref,
          actualType: cookiePref,
          source: 'cookie',
          url: config.url,
        };
      }
      // If preferred config not available, fall through to default
    }
  }

  // 3. Default: prefer local if available
  if (localConfig.isAvailable) {
    return {
      preferredType: 'local',
      actualType: 'local',
      source: 'default',
      url: localConfig.url,
    };
  }

  if (remoteConfig.isAvailable) {
    return {
      preferredType: 'remote',
      actualType: 'remote',
      source: 'default',
      url: remoteConfig.url,
    };
  }

  throw new Error('No database configuration available');
}

/**
 * Detect database preference from cookies (for server components)
 */
export async function detectDatabasePreferenceFromCookies(): Promise<RequestDatabaseInfo> {
  const cookieStore = await cookies();
  const localConfig = getLocalConfig();
  const remoteConfig = getRemoteConfig();

  const cookiePref = cookieStore.get('sb-provider-preference')?.value;

  if (cookiePref === 'remote' && remoteConfig.isAvailable) {
    return {
      preferredType: 'remote',
      actualType: 'remote',
      source: 'cookie',
      url: remoteConfig.url,
    };
  }

  if (localConfig.isAvailable) {
    return {
      preferredType: cookiePref === 'local' ? 'local' : 'local',
      actualType: 'local',
      source: cookiePref ? 'cookie' : 'default',
      url: localConfig.url,
    };
  }

  if (remoteConfig.isAvailable) {
    return {
      preferredType: 'remote',
      actualType: 'remote',
      source: 'default',
      url: remoteConfig.url,
    };
  }

  throw new Error('No database configuration available');
}

// ============================================
// SUPABASE CLIENT CREATION
// ============================================

/**
 * Create a Supabase client for API routes with automatic database routing
 */
export function createRoutedSupabaseClient(request: NextRequest): DatabaseContext {
  const dbInfo = detectDatabasePreference(request);
  const config = dbInfo.actualType === 'local' ? getLocalConfig() : getRemoteConfig();

  if (!config.isAvailable) {
    throw new Error(`${dbInfo.actualType} database configuration not available`);
  }

  const client = createServerClient<Database>(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
      },
    },
  });

  return {
    type: dbInfo.actualType,
    url: config.url,
    isLocal: dbInfo.actualType === 'local',
    client,
  };
}

/**
 * Create a Supabase client for server components with automatic database routing
 */
export async function createRoutedServerClient(): Promise<DatabaseContext> {
  const cookieStore = await cookies();
  const dbInfo = await detectDatabasePreferenceFromCookies();
  const config = dbInfo.actualType === 'local' ? getLocalConfig() : getRemoteConfig();

  if (!config.isAvailable) {
    throw new Error(`${dbInfo.actualType} database configuration not available`);
  }

  const client = createServerClient<Database>(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });

  return {
    type: dbInfo.actualType,
    url: config.url,
    isLocal: dbInfo.actualType === 'local',
    client,
  };
}

/**
 * Create an admin Supabase client for API routes (uses service role key)
 */
export function createRoutedAdminClient(request: NextRequest): DatabaseContext {
  const dbInfo = detectDatabasePreference(request);
  const config = dbInfo.actualType === 'local' ? getLocalConfig() : getRemoteConfig();

  if (!config.isAvailable || !config.serviceRoleKey) {
    throw new Error(
      `${dbInfo.actualType} database admin configuration not available (missing service role key)`
    );
  }

  const client = createServerClient<Database>(config.url, config.serviceRoleKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return {
    type: dbInfo.actualType,
    url: config.url,
    isLocal: dbInfo.actualType === 'local',
    client,
  };
}

// ============================================
// RESPONSE HEADERS
// ============================================

/**
 * Add database indicator headers to a response
 */
export function addDatabaseHeaders(
  response: NextResponse,
  dbInfo: RequestDatabaseInfo
): NextResponse {
  response.headers.set('X-Database-Type', dbInfo.actualType);
  response.headers.set('X-Database-Source', dbInfo.source);
  // X-Database-URL intentionally omitted — exposes internal infrastructure details
  return response;
}

// ============================================
// LOGGING
// ============================================

const LOG_PREFIX = {
  local: '🏠 [LOCAL-DB]',
  remote: '☁️  [REMOTE-DB]',
};

/**
 * Log a database operation with context
 */
export function logDatabaseOperation(
  dbType: DatabaseType,
  operation: string,
  details?: Record<string, unknown>
): void {
  const prefix = LOG_PREFIX[dbType];
  const timestamp = new Date().toISOString();

  if (details) {
    logger.info(`${prefix} [${timestamp}] ${operation}`, details);
  } else {
    logger.info(`${prefix} [${timestamp}] ${operation}`);
  }
}

// ============================================
// EXPORTS
// ============================================

export const DatabaseMiddleware = {
  detectPreference: detectDatabasePreference,
  detectPreferenceFromCookies: detectDatabasePreferenceFromCookies,
  createClient: createRoutedSupabaseClient,
  createServerClient: createRoutedServerClient,
  createAdminClient: createRoutedAdminClient,
  addHeaders: addDatabaseHeaders,
  log: logDatabaseOperation,
  getLocalConfig,
  getRemoteConfig,
};
