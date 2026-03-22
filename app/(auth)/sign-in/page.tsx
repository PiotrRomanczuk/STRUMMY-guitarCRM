'use client';

import { useEffect, useState, useMemo, useRef, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { SignInSchema } from '@/schemas/AuthSchema';
import { signIn as signInAction } from '@/app/auth/actions';
import { AuthLayout, AuthHeader, AuthDivider, GoogleAuthButton } from '@/components/auth';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { MFAChallengeDialog } from '@/components/auth/MFAChallengeDialog';
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
  const [touched, setTouched] = useState({ email: false, password: false });
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push('/dashboard');
      } else {
        setIsChecking(false);
      }
    };
    checkUser();
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    const validation = SignInSchema.safeParse({ email, password });
    if (!validation.success) return;

    setLoading(true);
    setError(null);

    const signInResult = await signInAction(email, password);

    setLoading(false);

    if (signInResult.error) {
      setError(signInResult.error);
      return;
    }

    if ('mfaRequired' in signInResult && signInResult.mfaRequired && 'factorId' in signInResult && signInResult.factorId) {
      setMfaFactorId(signInResult.factorId);
      setMfaRequired(true);
      return;
    }

    if ('success' in signInResult && signInResult.success) {
      router.refresh();
      router.push('/dashboard');
    }
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

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <AuthLayout>
      <AuthHeader
        title="Sign in to Strummy"
        subtitle="Manage your studio with AI-powered tools."
      />

      {/* Google Auth */}
      <GoogleAuthButton
        onClick={handleGoogleSignIn}
        disabled={loading}
        loading={loading}
      />

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

      {/* MFA Challenge Dialog */}
      {mfaFactorId && (
        <MFAChallengeDialog
          open={mfaRequired}
          factorId={mfaFactorId}
          onSuccess={() => {
            setMfaRequired(false);
            router.refresh();
            router.push('/dashboard');
          }}
          onCancel={() => {
            setMfaRequired(false);
            setMfaFactorId(null);
          }}
        />
      )}

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
            <p className="text-xs text-muted-foreground">
              Automate your lesson scheduling today.
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
