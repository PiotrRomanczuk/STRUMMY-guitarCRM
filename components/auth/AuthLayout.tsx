'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Music, ArrowLeft } from 'lucide-react';

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
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/8 dark:bg-primary/5 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Back to home link */}
      <Link
        href="/"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to home</span>
      </Link>

      {/* Main container - card with surface styling */}
      <div
        className={cn(
          'relative w-full max-w-[400px] flex flex-col gap-6',
          'rounded-2xl p-6 sm:p-8',
          'dark:bg-card/80 dark:backdrop-blur-xl',
          className
        )}
      >
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
      {/* Branding Icon - gold gradient glow */}
      <div className="mb-6 rounded-full p-4 bg-primary/10 dark:bg-primary/15 shadow-[0_0_24px_hsl(42_90%_55%/0.15)]">
        <Music className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-3xl font-black tracking-tight text-center text-foreground">
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
      <div className="flex-grow border-t border-border/50 dark:border-muted" />
      <span className="mx-4 flex-shrink-0 text-xs text-muted-foreground uppercase tracking-wider">
        {text}
      </span>
      <div className="flex-grow border-t border-border/50 dark:border-muted" />
    </div>
  );
}

export { AuthLayout, AuthHeader, AuthDivider };
