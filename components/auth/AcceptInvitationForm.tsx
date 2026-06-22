'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { StrongPasswordSchema } from '@/schemas/AuthSchema';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Button } from '@/components/ui/button';
import FormAlert from '@/components/shared/FormAlert';
import { ArrowRight, Loader2 } from 'lucide-react';

type Phase = 'loading' | 'ready' | 'error';

export default function AcceptInvitationForm() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('loading');
  const [initError, setInitError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // GoTrue redirects to /accept-invitation#access_token=...&refresh_token=...&type=invite
    // after verifying the invite link. Detect and set the session from the hash.
    const hash = window.location.hash;
    if (hash.includes('access_token=') && hash.includes('type=invite')) {
      const params = new URLSearchParams(hash.slice(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        supabase.auth
          .setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(({ error }) => {
            if (error) {
              setInitError('Failed to establish session. Please request a new invite.');
              setPhase('error');
            } else {
              // Clean hash from URL without triggering navigation
              window.history.replaceState(
                null,
                '',
                window.location.pathname + window.location.search
              );
              setPhase('ready');
            }
          });
        return;
      }
    }

    // Also handle error hash from GoTrue (e.g. otp_expired)
    if (hash.includes('error=')) {
      const params = new URLSearchParams(hash.slice(1));
      const code = params.get('error_code') ?? params.get('error') ?? '';
      const desc = params.get('error_description')?.replace(/\+/g, ' ') ?? '';
      const msg =
        code === 'otp_expired' || desc.toLowerCase().includes('expired')
          ? 'This invitation link has expired. Please ask your teacher to send a new invite.'
          : desc || 'This invitation link is invalid. Please request a new one.';
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      Promise.resolve().then(() => {
        setInitError(msg);
        setPhase('error');
      });
      return;
    }

    // No hash — check for an existing active invite session via cookies
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setPhase('ready');
      } else {
        setInitError('This invitation link appears to be invalid or expired.');
        setPhase('error');
      }
    });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const passwordResult = StrongPasswordSchema.safeParse(password);
    if (!passwordResult.success) {
      setSubmitError(passwordResult.error.issues[0].message);
      return;
    }
    if (password !== confirmPassword) {
      setSubmitError("Passwords don't match");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      setSubmitError(error.message);
      return;
    }

    router.push('/onboarding');
  };

  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Verifying your invite…
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="text-center text-sm text-muted-foreground">
        <p>{initError}</p>
        <p className="mt-2">
          <a href="/sign-up" className="text-primary hover:underline">
            Create a new account
          </a>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PasswordInput
        id="password"
        label="Create Password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setSubmitError(null);
        }}
        showStrength
        autoComplete="new-password"
      />
      <PasswordInput
        id="confirmPassword"
        label="Confirm Password"
        value={confirmPassword}
        onChange={(e) => {
          setConfirmPassword(e.target.value);
          setSubmitError(null);
        }}
        autoComplete="new-password"
      />
      {submitError && <FormAlert type="error" message={submitError} />}
      <Button
        type="submit"
        disabled={submitting}
        className="w-full h-12 rounded-lg font-bold text-base mt-2"
      >
        {submitting ? 'Setting up…' : 'Set Password & Continue'}
        {!submitting && <ArrowRight className="ml-2 h-5 w-5" />}
      </Button>
    </form>
  );
}
