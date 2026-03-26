/**
 * API Authentication utilities
 * Supports both cookie-based session auth and API key bearer tokens
 */

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { hashApiKey } from '@/lib/api-keys';
import type { User } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

export interface AuthResult {
  user: User | null;
  error?: string;
  status: number;
}

/**
 * Extract bearer token from Authorization header
 * Supports: "Bearer <token>" or "Bearer gcrm_<token>"
 */
function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1];
}

/**
 * Check if token looks like an API key (starts with prefix)
 */
function isApiKey(token: string): boolean {
  return token.startsWith('gcrm_');
}

/**
 * Validate API key and return associated user
 */
async function validateApiKey(apiKey: string): Promise<AuthResult> {
  // Use admin client to bypass RLS — there's no authenticated session yet
  const adminClient = createAdminClient();
  const keyHash = hashApiKey(apiKey);

  // Find active API key with matching hash
  const { data: apiKeyRecord, error } = await adminClient
    .from('api_keys')
    .select('user_id, is_active')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single();

  if (error || !apiKeyRecord) {
    return {
      user: null,
      error: 'Invalid API key',
      status: 401,
    };
  }

  // Update last_used_at timestamp (non-blocking)
  adminClient
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', keyHash)
    .then(
      () => {
        // Silent update - don't block request
      },
      (err) => {
        logger.error('Failed to update API key last_used_at:', err);
      }
    );

  // Get user details from auth.users
  const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(
    apiKeyRecord.user_id
  );

  if (userError || !userData.user) {
    return {
      user: null,
      error: 'User not found',
      status: 404,
    };
  }

  return {
    user: userData.user,
    status: 200,
  };
}

/**
 * Validate session token and return user
 */
async function validateSessionToken(sessionToken: string): Promise<AuthResult> {
  const supabase = await createClient();

  // Set the session using the access token
  const { data, error } = await supabase.auth.getUser(sessionToken);

  if (error || !data.user) {
    return {
      user: null,
      error: 'Invalid session token',
      status: 401,
    };
  }

  return {
    user: data.user,
    status: 200,
  };
}

/**
 * Authenticate request using either cookie session or API key
 * Use this in API routes that should support both auth methods
 *
 * @example
 * ```ts
 * export async function GET(request: Request) {
 *   const auth = await authenticateRequest(request);
 *   if (!auth.user) {
 *     return NextResponse.json({ error: auth.error }, { status: auth.status });
 *   }
 *   // Use auth.user for the authenticated user
 * }
 * ```
 */
export async function authenticateRequest(request: Request): Promise<AuthResult> {
  // Try Authorization header first (API key or session token)
  const authHeader = request.headers.get('Authorization');

  if (authHeader) {
    const token = extractBearerToken(authHeader);

    if (!token) {
      return {
        user: null,
        error: 'Invalid Authorization header format. Use: Bearer <token>',
        status: 401,
      };
    }

    // Check if it's an API key or session token
    if (isApiKey(token)) {
      return await validateApiKey(token);
    } else {
      return await validateSessionToken(token);
    }
  }

  // Fall back to cookie-based session auth
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      error: 'Unauthorized - no valid session or API key',
      status: 401,
    };
  }

  return {
    user,
    status: 200,
  };
}

/**
 * Require authentication for an API route
 * Returns the user or throws an error response
 *
 * @example
 * ```ts
 * export async function GET(request: Request) {
 *   const { user, errorResponse } = await requireAuth(request);
 *   if (errorResponse) return errorResponse;
 *
 *   // user is guaranteed to be non-null here
 * }
 * ```
 */
export async function requireAuth(request: Request): Promise<
  | {
      user: User;
      errorResponse?: never;
    }
  | {
      user?: never;
      errorResponse: Response;
    }
> {
  const auth = await authenticateRequest(request);

  if (!auth.user) {
    return {
      errorResponse: new Response(JSON.stringify({ error: auth.error || 'Unauthorized' }), {
        status: auth.status,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }

  return { user: auth.user };
}
