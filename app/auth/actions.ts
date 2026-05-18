'use server';

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { checkAuthRateLimit } from '@/lib/auth/rate-limiter';
import { SignInSchema, SignUpSchema } from '@/schemas/AuthSchema';
import {
  checkAccountLockout,
  incrementFailedAttempts,
  resetFailedAttempts,
} from '@/lib/auth/account-lockout';
import { updateLastSignIn } from '@/app/actions/account';
import { isDisposableEmail } from '@/lib/auth/disposable-email-checker';
import {
  logSigninSuccess,
  logSigninFailure,
  logSigninLocked,
  logSigninRateLimited,
  logSignupAttempt,
  logSignupSuccess,
  logSignupFailure,
  logResendVerification,
  logPasswordResetRequested,
  logPasswordResetFailed,
} from '@/lib/auth/auth-event-logger';
import { logger } from '@/lib/logger';

async function getClientIdentifier(email: string): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0].trim() || headersList.get('x-real-ip') || 'unknown';
  return `${email}:${ip}`;
}

function rateLimitError(operation: string, retryAfter: number) {
  const minutes = Math.ceil(retryAfter / 60);
  return {
    error: `Too many ${operation} attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`,
    rateLimited: true,
    retryAfter,
  };
}

export async function signIn(email: string, password: string) {
  const parsed = SignInSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Rate limiting
  const identifier = await getClientIdentifier(email);
  const rateLimit = await checkAuthRateLimit(identifier, 'login');
  if (!rateLimit.allowed) {
    logger.warn(`[Auth] Rate limit exceeded for login: ${email}`);
    logSigninRateLimited(email);
    return rateLimitError('login', rateLimit.retryAfter!);
  }

  // Account lockout check
  const lockout = await checkAccountLockout(email);
  if (lockout.locked) {
    logSigninLocked(email);
    const minutes = Math.ceil((lockout.retryAfterMs ?? 0) / 60000);
    return {
      error: `Account temporarily locked due to too many failed attempts. Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`,
      locked: true,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    await incrementFailedAttempts(email);
    logSigninFailure(email, error.message);

    if (error.message === 'Invalid login credentials') {
      return {
        error:
          'Invalid email or password. If you haven\'t set a password yet, please use "Forgot password?" to create one.',
      };
    }
    return { error: error.message };
  }

  if (data.user) {
    await resetFailedAttempts(email);
    await updateLastSignIn(data.user.id);
    logSigninSuccess(email, data.user.id);

    // Check for MFA requirement
    const factors = data.user.factors ?? [];
    const verifiedFactors = factors.filter((f) => f.status === 'verified');
    if (verifiedFactors.length > 0) {
      return {
        success: true,
        mfaRequired: true,
        factorId: verifiedFactors[0].id,
      };
    }

    return { success: true };
  }

  return { error: 'An unexpected error occurred' };
}

export async function signUp(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  confirmPassword: string
) {
  const parsed = SignUpSchema.safeParse({
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  if (isDisposableEmail(email)) {
    return {
      error: 'Disposable email addresses are not allowed. Please use a permanent email address.',
    };
  }

  const identifier = await getClientIdentifier(email);
  const rateLimit = await checkAuthRateLimit(identifier, 'signup');
  if (!rateLimit.allowed) {
    logger.warn(`[Auth] Rate limit exceeded for signup: ${email}`);
    return rateLimitError('sign-up', rateLimit.retryAfter!);
  }

  logSignupAttempt(email);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  });

  if (error) {
    logSignupFailure(email, error.message);
    if (
      error.message.includes('already registered') ||
      error.message.includes('already been registered')
    ) {
      return {
        error:
          'This email is already registered. Please sign in or use "Forgot Password" to reset your password.',
      };
    }
    return { error: error.message };
  }

  // Shadow user detection: identities array is empty for admin-created accounts
  if (data.user && (data.user.identities?.length ?? 0) === 0) {
    logSignupFailure(email, 'Shadow user conflict');
    return {
      error:
        'This email is associated with an invitation. Please check your email for the invitation link, or use "Forgot Password" to claim your account.',
    };
  }

  if (data.user) {
    // email_status: Supabase sends confirmation email if confirmations are enabled
    const emailConfirmEnabled = !data.user.email_confirmed_at;
    logSignupSuccess(email, data.user.id, emailConfirmEnabled ? 'sent' : 'skipped');
    return { success: true };
  }

  return { error: 'An unexpected error occurred' };
}

export async function resendVerificationEmail(email: string) {
  const identifier = await getClientIdentifier(email);
  const rateLimit = await checkAuthRateLimit(identifier, 'resendEmail');
  if (!rateLimit.allowed) {
    logger.warn(`[Auth] Rate limit exceeded for resend email: ${email}`);
    return rateLimitError('resend', rateLimit.retryAfter!);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });

  if (error) {
    logResendVerification(email, false, error.message);
    return { error: error.message };
  }

  logResendVerification(email, true);
  return { success: true };
}

export async function resetPassword(email: string) {
  const identifier = await getClientIdentifier(email);
  const rateLimit = await checkAuthRateLimit(identifier, 'passwordReset');

  if (!rateLimit.allowed) {
    logger.warn(
      `[Auth] Rate limit exceeded for password reset: ${email}, retry after ${rateLimit.retryAfter}s`
    );
    return rateLimitError('password reset', rateLimit.retryAfter!);
  }

  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_SITE_URL;

  if (!origin) {
    logger.error('[Auth] Could not determine origin for password reset redirect');
    return { error: 'Configuration error: Could not determine site origin' };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    logger.error(`[Auth] Password reset failed for ${email}`, error);
    logPasswordResetFailed(email, error.message);
    return { error: error.message };
  }

  logPasswordResetRequested(email);
  return { success: true };
}
