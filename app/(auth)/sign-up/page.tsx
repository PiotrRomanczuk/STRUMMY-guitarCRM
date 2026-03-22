'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthLayout, AuthHeader, AuthDivider, GoogleAuthButton } from '@/components/auth';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { useSignUpLogic } from '@/components/auth/useSignUpLogic';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import FormAlert from '@/components/shared/FormAlert';
import { Mail, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SignUpPage() {
  const router = useRouter();
  const state = useSignUpLogic();

  // Success confirmation screen
  if (state.success) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Success Icon */}
          <div className="rounded-full bg-success/10 p-4 ring-1 ring-success/20">
            <CheckCircle2 className="h-12 w-12 text-success" />
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Check Your Email</h2>
            <p className="text-muted-foreground">
              We&apos;ve sent a verification link to:
            </p>
            <p className="font-semibold text-foreground">{state.email}</p>
          </div>

          {/* Instructions */}
          <div className="bg-card rounded-xl p-4 text-left w-full border border-border dark:border-0 dark:bg-muted/40">
            <p className="text-sm font-medium text-foreground mb-2">What to do next:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Check your inbox (and spam folder)</li>
              <li>Click the verification link</li>
              <li>You&apos;ll be redirected back to sign in</li>
            </ol>
          </div>

          {/* Resend email option */}
          {state.canResendEmail && (
            <button
              type="button"
              onClick={state.handleResendEmail}
              disabled={state.resendLoading || state.resendCountdown > 0}
              className="text-sm text-primary hover:underline underline-offset-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.resendCountdown > 0
                ? `Resend available in ${state.resendCountdown}s`
                : state.resendLoading
                ? 'Sending...'
                : "Didn't receive the email? Resend"}
            </button>
          )}

          {/* Continue to Sign In */}
          <Button
            onClick={() => router.push('/sign-in')}
            className="w-full h-12 rounded-lg font-bold text-base dark:bg-[image:var(--gradient-gold)] dark:text-primary-foreground dark:hover:opacity-90"
          >
            Continue to Sign In
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-background">
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/8 dark:bg-primary/5 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Mobile container */}
      <div className="relative w-full max-w-[480px] mx-auto min-h-screen flex flex-col">
        {/* Top Navigation */}
        <div className="relative z-10 flex items-center p-4 pb-2 justify-between">
          <button
            type="button"
            onClick={() => router.push('/sign-in')}
            className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-muted dark:hover:bg-card transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">
            Sign Up
          </h2>
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 overflow-y-auto px-6 pt-2 pb-8">
          {/* Hero / Branding */}
          <AuthHeader
            title="Join Strummy"
            subtitle="Manage your students and lessons with AI-powered tools."
          />

          {/* Sign Up Form */}
          <form onSubmit={state.handleSubmit} className="flex flex-col gap-5 mt-8">
            {/* Name Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="firstName" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pl-1">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={state.firstName}
                  onChange={(e) => {
                    state.setFirstName(e.target.value);
                    if (state.touched.firstName) {
                      state.setTouched({ ...state.touched, firstName: false });
                    }
                  }}
                  onBlur={() => state.setTouched({ ...state.touched, firstName: true })}
                  placeholder="Jimi"
                  aria-invalid={!!state.fieldErrors?.firstName}
                  className={cn(
                    'h-12 rounded-xl bg-card dark:bg-background border-0 focus:ring-2 focus:ring-primary/50',
                    state.fieldErrors?.firstName && 'ring-2 ring-destructive/50'
                  )}
                />
                {state.fieldErrors?.firstName && (
                  <p className="text-xs text-destructive" role="alert">
                    {state.fieldErrors.firstName}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lastName" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pl-1">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={state.lastName}
                  onChange={(e) => {
                    state.setLastName(e.target.value);
                    if (state.touched.lastName) {
                      state.setTouched({ ...state.touched, lastName: false });
                    }
                  }}
                  onBlur={() => state.setTouched({ ...state.touched, lastName: true })}
                  placeholder="Hendrix"
                  aria-invalid={!!state.fieldErrors?.lastName}
                  className={cn(
                    'h-12 rounded-xl bg-card dark:bg-background border-0 focus:ring-2 focus:ring-primary/50',
                    state.fieldErrors?.lastName && 'ring-2 ring-destructive/50'
                  )}
                />
                {state.fieldErrors?.lastName && (
                  <p className="text-xs text-destructive" role="alert">
                    {state.fieldErrors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pl-1">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={state.email}
                  onChange={(e) => {
                    state.setEmail(e.target.value);
                    if (state.touched.email) {
                      state.setTouched({ ...state.touched, email: false });
                    }
                  }}
                  onBlur={() => state.setTouched({ ...state.touched, email: true })}
                  placeholder="jimi@experience.com"
                  aria-invalid={!!state.fieldErrors?.email}
                  className={cn(
                    'h-12 pl-11 rounded-xl bg-card dark:bg-background border-0 focus:ring-2 focus:ring-primary/50',
                    state.fieldErrors?.email && 'ring-2 ring-destructive/50'
                  )}
                />
              </div>
              {state.fieldErrors?.email && (
                <p className="text-xs text-destructive" role="alert">
                  {state.fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password with Strength Meter */}
            <PasswordInput
              id="password"
              label="Password"
              value={state.password}
              onChange={(e) => {
                state.setPassword(e.target.value);
                if (state.touched.password) {
                  state.setTouched({ ...state.touched, password: false });
                }
              }}
              onBlur={() => state.setTouched({ ...state.touched, password: true })}
              error={state.fieldErrors?.password}
              showStrength
              autoComplete="new-password"
            />

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <PasswordInput
                id="confirmPassword"
                label="Confirm Password"
                value={state.confirmPassword}
                onChange={(e) => {
                  state.setConfirmPassword(e.target.value);
                  if (state.touched.confirmPassword) {
                    state.setTouched({ ...state.touched, confirmPassword: false });
                  }
                }}
                onBlur={() => state.setTouched({ ...state.touched, confirmPassword: true })}
                error={state.fieldErrors?.confirmPassword}
                autoComplete="new-password"
              />
              {/* Password match indicator */}
              {state.confirmPassword && !state.fieldErrors?.confirmPassword && (
                <div className="flex items-center gap-1.5 px-1">
                  {state.password === state.confirmPassword ? (
                    <>
                      <div className="size-1.5 rounded-full bg-primary" />
                      <p className="text-xs text-primary font-bold">Passwords match</p>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                      <p className="text-xs text-destructive">Passwords do not match</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Form Error */}
            {state.error && <FormAlert type="error" message={state.error} />}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={state.loading}
              className="w-full h-14 rounded-xl font-bold text-base mt-4 shadow-[0_0_20px_hsl(var(--primary)/0.3)] dark:bg-[image:var(--gradient-gold)] dark:text-primary-foreground dark:hover:opacity-90"
            >
              {state.loading ? 'Creating Account...' : 'Create Account'}
              {!state.loading && <ArrowRight className="ml-2 h-5 w-5" />}
            </Button>
          </form>

          {/* Social Divider */}
          <div className="my-8">
            <AuthDivider text="Or continue with" />
          </div>

          {/* Google Login */}
          <GoogleAuthButton
            onClick={state.handleGoogleSignIn}
            disabled={state.loading}
            loading={state.loading}
          />

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground mt-8 mb-4">
            Already have an account?{' '}
            <Link
              href="/sign-in"
              className="text-primary hover:underline underline-offset-4 font-semibold"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
