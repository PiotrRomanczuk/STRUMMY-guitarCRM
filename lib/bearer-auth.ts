/**
 * Bearer token authentication utilities for API routes
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { hashApiKey } from '@/lib/api-keys';
import { logger } from '@/lib/logger';

/**
 * Extract bearer token from Authorization header
 * @param authHeader The Authorization header value
 * @returns {string | null} The token or null if not found
 */
export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * Authenticate a request using bearer token
 * Returns the user ID and profile if authentication succeeds
 * @param bearerToken The bearer token from the Authorization header
 * @returns User info or null if authentication fails
 */
export async function authenticateWithBearerToken(bearerToken: string) {
  try {
    const supabase = createAdminClient();
    const keyHash = hashApiKey(bearerToken);

    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .select('user_id, is_active')
      .eq('key_hash', keyHash)
      .single();

    if (error || !apiKey || !apiKey.is_active) {
      logger.error('[Bearer Auth] Invalid or inactive API key');
      return null;
    }

    // Update last_used_at (fire and forget)
    void supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('key_hash', keyHash);

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, is_admin, is_teacher, is_student, is_active')
      .eq('id', apiKey.user_id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return {
      userId: apiKey.user_id,
      profile,
    };
  } catch (error) {
    logger.error('[Bearer Auth] Error authenticating:', error);
    return null;
  }
}

/**
 * Authenticate using session cookies (for backward compatibility)
 */
export async function authenticateWithSession() {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, is_admin, is_teacher, is_student, is_active')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return {
      userId: user.id,
      profile,
    };
  } catch (error) {
    logger.error('[Session Auth] Error authenticating:', error);
    return null;
  }
}
