/**
 * Shared permission utilities for API mutation operations.
 *
 * Used by lesson and song handlers to validate that the
 * requesting user has the required role for write operations.
 */

export interface MutationProfile {
  isAdmin?: boolean | null;
  isTeacher?: boolean | null;
}

/**
 * Validate that user has required role for mutation operations.
 * Admins and teachers are allowed; students and null profiles are denied.
 */
export function validateMutationPermission(
  profile: MutationProfile | null
): boolean {
  return !!(profile?.isAdmin || profile?.isTeacher);
}
