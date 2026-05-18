'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { headers } from 'next/headers';
import { logger } from '@/lib/logger';

type AuthEventType =
  | 'signup_attempted'
  | 'signup_succeeded'
  | 'signup_failed'
  | 'email_confirmed'
  | 'invite_sent'
  | 'invite_failed'
  | 'user_created_by_admin'
  | 'shadow_user_created'
  | 'signin_succeeded'
  | 'signin_failed'
  | 'signin_locked'
  | 'signin_rate_limited'
  | 'password_reset_requested'
  | 'password_reset_failed'
  | 'resend_verification_requested'
  | 'resend_verification_failed';

type AuthEmailStatus = 'not_applicable' | 'sent' | 'failed' | 'skipped';

interface AuthEventPayload {
  eventType: AuthEventType;
  userEmail?: string;
  userId?: string;
  actorId?: string;
  success: boolean;
  errorMessage?: string;
  emailStatus?: AuthEmailStatus;
  emailError?: string;
  metadata?: Record<string, unknown>;
}

async function getClientIp(): Promise<string> {
  try {
    const headersList = await headers();
    const forwarded = headersList.get('x-forwarded-for');
    return forwarded?.split(',')[0].trim() || headersList.get('x-real-ip') || 'unknown';
  } catch {
    return 'unknown';
  }
}

export async function logAuthEvent(payload: AuthEventPayload): Promise<string | null> {
  try {
    const supabase = createAdminClient();
    const ipAddress = await getClientIp();

    const { data, error } = await supabase
      .from('auth_events' as never)
      .insert({
        event_type: payload.eventType,
        user_email: payload.userEmail ?? null,
        user_id: payload.userId ?? null,
        actor_id: payload.actorId ?? null,
        ip_address: ipAddress,
        success: payload.success,
        error_message: payload.errorMessage ?? null,
        email_status: payload.emailStatus ?? 'not_applicable',
        email_error: payload.emailError ?? null,
        metadata: payload.metadata ?? null,
      } as never)
      .select('id' as never)
      .single();

    if (error) {
      logger.error('[AuthEventLogger] Failed to log event', error);
      return null;
    }

    return (data as { id: string } | null)?.id ?? null;
  } catch (err) {
    logger.error('[AuthEventLogger] Unexpected error:', err);
    return null;
  }
}

// --- Convenience wrappers ---

export async function logSignupAttempt(email: string) {
  return logAuthEvent({ eventType: 'signup_attempted', userEmail: email, success: true });
}

export async function logSignupSuccess(
  email: string,
  userId: string,
  emailStatus: AuthEmailStatus = 'sent'
) {
  return logAuthEvent({
    eventType: 'signup_succeeded',
    userEmail: email,
    userId,
    success: true,
    emailStatus,
  });
}

export async function logSignupFailure(email: string, error: string) {
  return logAuthEvent({
    eventType: 'signup_failed',
    userEmail: email,
    success: false,
    errorMessage: error,
  });
}

export async function logSigninSuccess(email: string, userId: string) {
  return logAuthEvent({ eventType: 'signin_succeeded', userEmail: email, userId, success: true });
}

export async function logSigninFailure(email: string, error: string) {
  return logAuthEvent({
    eventType: 'signin_failed',
    userEmail: email,
    success: false,
    errorMessage: error,
  });
}

export async function logSigninLocked(email: string) {
  return logAuthEvent({
    eventType: 'signin_locked',
    userEmail: email,
    success: false,
    errorMessage: 'Account locked',
  });
}

export async function logSigninRateLimited(email: string) {
  return logAuthEvent({
    eventType: 'signin_rate_limited',
    userEmail: email,
    success: false,
    errorMessage: 'Rate limited',
  });
}

export async function logEmailConfirmed(email: string, userId: string) {
  return logAuthEvent({ eventType: 'email_confirmed', userEmail: email, userId, success: true });
}

export async function logInviteSent(email: string, actorId: string, userId: string) {
  return logAuthEvent({
    eventType: 'invite_sent',
    userEmail: email,
    actorId,
    userId,
    success: true,
    emailStatus: 'sent',
  });
}

export async function logInviteFailed(email: string, actorId: string, error: string) {
  return logAuthEvent({
    eventType: 'invite_failed',
    userEmail: email,
    actorId,
    success: false,
    errorMessage: error,
  });
}

export async function logAdminUserCreated(email: string, actorId: string, userId: string) {
  return logAuthEvent({
    eventType: 'user_created_by_admin',
    userEmail: email,
    actorId,
    userId,
    success: true,
  });
}

export async function logShadowUserCreated(email: string, actorId: string, userId: string) {
  return logAuthEvent({
    eventType: 'shadow_user_created',
    userEmail: email,
    actorId,
    userId,
    success: true,
  });
}

export async function logPasswordResetRequested(email: string) {
  return logAuthEvent({
    eventType: 'password_reset_requested',
    userEmail: email,
    success: true,
    emailStatus: 'sent',
  });
}

export async function logPasswordResetFailed(email: string, error: string) {
  return logAuthEvent({
    eventType: 'password_reset_failed',
    userEmail: email,
    success: false,
    errorMessage: error,
  });
}

export async function logResendVerification(email: string, success: boolean, error?: string) {
  return logAuthEvent({
    eventType: success ? 'resend_verification_requested' : 'resend_verification_failed',
    userEmail: email,
    success,
    errorMessage: error,
    emailStatus: success ? 'sent' : 'failed',
  });
}
