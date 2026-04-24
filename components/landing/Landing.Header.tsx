'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

const NAV_LINKS = ['Features', 'How it works', 'For teachers', 'Changelog'];

export function LandingHeader() {
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        background: 'color-mix(in oklab, var(--l-ivory) 88%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid color-mix(in oklab, var(--l-rule) 65%, transparent)',
      }}
    >
      <div className="mx-auto flex max-w-[1440px] items-center gap-7 px-6 py-3.5 md:px-12">
        {/* Wordmark */}
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <span
            className="font-serif text-[22px] font-medium tracking-[-0.02em]"
            style={{ color: 'var(--l-ink)' }}
          >
            Strummy
            <span
              className="ml-0.5 inline-block h-1 w-1 rounded-full align-middle"
              style={{ background: 'var(--l-gold)' }}
            />
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="ml-4 hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase().replace(/\s/g, '-')}`}
              className="cursor-pointer text-[13px] no-underline"
              style={{ color: 'var(--l-ink-3)' }}
            >
              {l}
            </a>
          ))}
        </div>

        <div className="flex-1" />

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="cursor-pointer rounded-lg border-none bg-transparent p-2"
          style={{ color: 'var(--l-ink-4)' }}
          aria-label="Toggle theme"
        >
          {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/sign-in"
            className="mr-1 text-[13px] no-underline"
            style={{ color: 'var(--l-ink-3)' }}
          >
            Sign in
          </Link>
          <Link
            href="/sign-in?demo=true"
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium no-underline"
            style={{ border: '1px solid var(--l-rule)', color: 'var(--l-ink-2)' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="6,4 20,12 6,20" />
            </svg>
            Try the demo
          </Link>
          <Link
            href="/sign-up"
            className="rounded-full px-4 py-2.5 text-[13px] font-medium no-underline"
            style={{ background: 'var(--l-ink)', color: 'var(--l-paper)' }}
          >
            Get started — free
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/sign-up"
            className="rounded-full px-3 py-1.5 text-xs font-medium no-underline"
            style={{ background: 'var(--l-ink)', color: 'var(--l-paper)' }}
          >
            Get started
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="grid cursor-pointer place-items-center rounded-lg border bg-transparent p-1.5"
            style={{ borderColor: 'var(--l-rule)', color: 'var(--l-ink-3)' }}
            aria-label="Menu"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="space-y-2 border-t px-6 pb-4 md:hidden"
          style={{ borderColor: 'var(--l-rule)', background: 'var(--l-paper)' }}
        >
          {NAV_LINKS.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase().replace(/\s/g, '-')}`}
              className="block py-2 text-sm"
              style={{ color: 'var(--l-ink-3)' }}
              onClick={() => setOpen(false)}
            >
              {l}
            </a>
          ))}
          <div className="flex items-center gap-3 pt-2">
            <Link
              href="/sign-in"
              className="text-sm no-underline"
              style={{ color: 'var(--l-ink-3)' }}
            >
              Sign in
            </Link>
            <Link
              href="/sign-in?demo=true"
              className="rounded-full border px-4 py-2 text-sm font-medium no-underline"
              style={{ borderColor: 'var(--l-rule)', color: 'var(--l-ink-2)' }}
            >
              Try Demo
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
