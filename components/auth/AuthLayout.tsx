'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Guitar, ArrowLeft } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Auth layout component with centered container, branding icon, and gradient background
 * Used for sign-in, sign-up, and password reset pages
 */
function AuthLayout({ children, className }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 bg-background">
      {/* Ambient gold glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/8 rounded-full blur-[120px] pointer-events-none"
        aria-hidden="true"
      />

      {/* Back to home link */}
      <Link
        href="/"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors z-10"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to home</span>
      </Link>

      {/* Glassmorphism container */}
      <div className={cn(
        'relative w-full max-w-[400px] flex flex-col gap-6',
        'dark:bg-[rgba(32,31,31,0.7)] dark:backdrop-blur-xl dark:rounded-2xl dark:p-8 dark:border dark:border-white/5',
        className,
      )}>
        {children}
      </div>
    </div>
  );
}

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
}

/**
 * Auth header with branding icon, title, and optional subtitle
 */
function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className="flex flex-col items-center">
      {/* Branding Icon */}
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-[hsl(38,92%,50%)] to-[hsl(30,90%,42%)] p-4 shadow-[0_0_40px_hsl(38_92%_50%/0.25)]">
        <Guitar className="h-8 w-8 text-[#271900]" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-center text-foreground">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-center text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}

/**
 * Divider with "OR" text between auth methods
 */
function AuthDivider({ text = 'OR' }: { text?: string }) {
  return (
    <div className="relative flex items-center">
      <div className="flex-grow border-t border-border" />
      <span className="mx-4 flex-shrink-0 text-xs text-muted-foreground uppercase tracking-wider">
        {text}
      </span>
      <div className="flex-grow border-t border-border" />
    </div>
  );
}

export { AuthLayout, AuthHeader, AuthDivider };
