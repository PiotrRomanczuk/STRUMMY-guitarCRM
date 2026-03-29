/**
 * Shared authentication wrapper for API routes.
 *
 * API routes in app/api/ are excluded from the middleware proxy,
 * so each must handle its own auth. This wrapper standardizes that
 * and prevents accidental exposure of unprotected endpoints.
 *
 * @example
 * // Basic auth - any authenticated user
 * export async function GET(request: Request) {
 *   return withAuth(request, async (user) => {
 *     return NextResponse.json({ items: [] });
 *   });
 * }
 *
 * // With role requirement
 * export async function POST(request: Request) {
 *   return withAuth(request, async (user) => {
 *     return NextResponse.json({ created: true });
 *   }, { requiredRole: 'admin' });
 * }
 */

import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { createClient } from '@/lib/supabase/server';

export type UserRole = 'admin' | 'teacher' | 'student';

export interface WithAuthOptions {
  requiredRole?: UserRole;
}

type AuthHandler = (user: User) => Promise<Response | NextResponse>;

const ROLE_COLUMN_MAP: Record<UserRole, string> = {
  admin: 'is_admin',
  teacher: 'is_teacher',
  student: 'is_student',
};

/**
 * Check if the user has the required role by querying the profiles table.
 */
async function hasRole(userId: string, role: UserRole): Promise<boolean> {
  const supabase = await createClient();
  const column = ROLE_COLUMN_MAP[role];

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(column)
    .eq('id', userId)
    .single();

  if (error || !profile) {
    return false;
  }

  return (profile as unknown as Record<string, unknown>)[column] === true;
}

/**
 * Wrap an API route handler with authentication (and optional role) checks.
 *
 * - Authenticates the request via cookie session or API key bearer token.
 * - Returns 401 if not authenticated.
 * - If `requiredRole` is set, checks the profiles table and returns 403 if missing.
 * - Passes the verified `User` to the handler.
 */
export async function withAuth(
  request: Request,
  handler: AuthHandler,
  options?: WithAuthOptions,
): Promise<Response | NextResponse> {
  const auth = await authenticateRequest(request);

  if (!auth.user) {
    return NextResponse.json(
      { error: auth.error || 'Unauthorized' },
      { status: auth.status },
    );
  }

  if (options?.requiredRole) {
    const isAuthorized = await hasRole(auth.user.id, options.requiredRole);

    if (!isAuthorized) {
      return NextResponse.json(
        { error: `Forbidden. ${options.requiredRole} role required.` },
        { status: 403 },
      );
    }
  }

  return handler(auth.user);
}
