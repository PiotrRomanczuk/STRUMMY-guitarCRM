'use client';

import { useEffect, useState, useMemo, useRef, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { SignInSchema } from '@/schemas/AuthSchema';
import { signIn as signInAction, resendVerificationEmail } from '@/app/auth/actions';
import {
  AuthLayout,
  AuthHeader,
  AuthDivider,
  GoogleAuthButton,
  DbConnectionIndicator,
  DevQuickLogin,
} from '@/components/auth';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import FormAlert from '@/components/shared/FormAlert';
import { Mail, ArrowRight, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const demoTriggered = useRef(false);
  const [isChecking, setIsChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [touched, setTouched] = useState({ email: false, password: false });

  useEffect(() => {
    let cancelled = false;
    const checkUser = async () => {
      const supabase = createClient();
      // getUser() can hang (supabase-js navigator.locks contention, common under
      // dev HMR) — never strand the user on the loading screen. Race it against a
      // timeout and fall through to the form on hang/error.
      const resolveUser = supabase.auth
        .getUser()
        .then((res) => res.data.user)
        .catch(() => null);
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
      const user = await Promise.race([resolveUser, timeout]);
      if (cancelled) return;
      if (user) {
        router.push('/dashboard');
      } else {
        setIsChecking(false);
      }
    };
    checkUser();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Auto-fill demo credentials when ?demo=true
  const isDemo = searchParams.get('demo') === 'true' && !isChecking;
  useEffect(() => {
    if (!isDemo || demoTriggered.current) return;
    demoTriggered.current = true;
    // Defer state updates to avoid synchronous setState in effect
    requestAnimationFrame(() => {
      setEmail('sarah@strummy.app');
      setPassword('Demo2024!');
      setTimeout(() => {
        const form = document.querySelector('form');
        if (form) form.requestSubmit();
      }, 150);
    });
  }, [isDemo]);

  // Validate fields using useMemo to avoid setState in effect
  const fieldErrors = useMemo(() => {
    if (!touched.email && !touched.password) return {};

    const errors: { email?: string; password?: string } = {};
    const result = SignInSchema.safeParse({ email, password });
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as 'email' | 'password';
        if (touched[field] && !errors[field]) {
          errors[field] = issue.message;
        }
      }
    }
    return errors;
  }, [email, password, touched]);

  const performSignIn = async (emailValue: string, passwordValue: string) => {
    setLoading(true);
    setError(null);
    setEmailNotConfirmed(false);
    setResendStatus(null);

    const signInResult = await signInAction(emailValue, passwordValue);

    setLoading(false);

    if (signInResult.error) {
      setError(signInResult.error);
      setEmailNotConfirmed('emailNotConfirmed' in signInResult && !!signInResult.emailNotConfirmed);
      return;
    }

    if ('success' in signInResult && signInResult.success) {
      router.refresh();
      router.push('/dashboard');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    const validation = SignInSchema.safeParse({ email, password });
    if (!validation.success) return;

    await performSignIn(email, password);
  };

  // One-click dev role logins (only rendered when connected to the dev DB).
  const handleQuickLogin = (quickEmail: string, quickPassword: string) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
    void performSignIn(quickEmail, quickPassword);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setResendStatus(null);
    const result = await resendVerificationEmail(email);
    setLoading(false);
    setResendStatus(
      result.error ? result.error : 'Confirmation email sent — check your inbox (and spam).'
    );
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <AuthLayout>
      <DbConnectionIndicator />
      <AuthHeader title="Sign in to Strummy" subtitle="Manage your studio with AI-powered tools." />

      <DevQuickLogin onLogin={handleQuickLogin} disabled={loading} />

      {/* Google Auth */}
      <GoogleAuthButton onClick={handleGoogleSignIn} disabled={loading} loading={loading} />

      <AuthDivider />

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              id="email"
              name="email"
              type="email"
              data-testid="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              onBlur={() => setTouched({ ...touched, email: true })}
              placeholder="name@example.com"
              aria-invalid={!!fieldErrors.email}
              className={cn(
                'h-12 pl-10 rounded-lg bg-card dark:bg-background border-0 focus:ring-2 focus:ring-primary/50',
                fieldErrors.email && 'ring-2 ring-destructive/50'
              )}
            />
          </div>
          {fieldErrors.email && (
            <p className="text-sm text-destructive" role="alert">
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Password Field */}
        <PasswordInput
          id="password"
          label="Password"
          data-testid="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          onBlur={() => setTouched({ ...touched, password: true })}
          error={fieldErrors.password}
          showForgotPassword
          autoComplete="current-password"
        />

        {/* Form Error */}
        {error && <FormAlert type="error" message={error} />}

        {/* Resend confirmation when the account exists but isn't confirmed yet */}
        {emailNotConfirmed && (
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={handleResend}
            className="w-full"
          >
            Resend confirmation email
          </Button>
        )}
        {resendStatus && (
          <p className="text-sm text-center text-muted-foreground" role="status">
            {resendStatus}
          </p>
        )}

        {/* Submit Button - gold gradient */}
        <Button
          type="submit"
          disabled={loading}
          data-testid="signin-button"
          className="w-full h-12 rounded-lg font-bold text-base mt-2 dark:bg-[image:var(--gradient-gold)] dark:text-primary-foreground dark:hover:opacity-90"
        >
          {loading ? 'Signing in...' : 'Continue'}
          {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
        </Button>
      </form>

      {/* Try Demo */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={loading}
        onClick={() => {
          setEmail('sarah@strummy.app');
          setPassword('Demo2024!');
          setTimeout(() => {
            const form = document.querySelector('form');
            if (form) form.requestSubmit();
          }, 100);
        }}
        className="w-full h-12 rounded-lg font-bold text-base border-primary/30 text-primary hover:bg-primary/5"
      >
        <Play className="mr-2 h-4 w-4" /> Try Demo Account
      </Button>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground mt-2">
        Don&apos;t have an account?{' '}
        <Link
          href="/sign-up"
          className="font-semibold text-primary hover:text-primary/80 underline-offset-4 ml-1 transition-colors"
        >
          Create your account
        </Link>
      </div>

      {/* Pro Tip Card - only visible on larger screens */}
      <div className="mt-8 rounded-xl overflow-hidden relative h-32 w-full group hidden sm:block dark:bg-muted/40">
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary/15 via-card to-card dark:from-primary/10 dark:via-transparent dark:to-transparent opacity-60"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent dark:from-card dark:via-card/60" />
        <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
          <div>
            <p className="text-xs font-medium text-primary mb-0.5">Pro Tip</p>
            <p className="text-xs text-muted-foreground">Automate your lesson scheduling today.</p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
