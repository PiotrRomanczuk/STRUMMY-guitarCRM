import { isShadowPlaceholderEmail } from '@/lib/auth/shadow-email';

/**
 * The minimal Profile shape needed to resolve a deliverable address.
 */
export interface DeliverableProfile {
  is_shadow: boolean;
  email: string | null;
  invite_email: string | null;
}

/**
 * Single chokepoint for resolving the address a student-bound email should go
 * to (ADR-0002 §3, spec 06 §6.2).
 *
 * - Shadow profile → the `invite_email` (the real address the teacher invited),
 *   or `null` if not yet invited.
 * - Real profile → `profiles.email`.
 * - A `shadow_*@placeholder.com` address is never deliverable → `null`.
 *
 * Returning `null` means "skip the send and log it" — never bounce mail to a
 * placeholder address.
 */
export function getDeliverableEmail(profile: DeliverableProfile): string | null {
  const candidate = profile.is_shadow ? profile.invite_email : profile.email;

  if (!candidate) return null;
  if (isShadowPlaceholderEmail(candidate)) return null;

  return candidate;
}
