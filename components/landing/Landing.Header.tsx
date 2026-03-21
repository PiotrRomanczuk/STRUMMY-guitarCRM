'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Moon, Sun, Menu, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

const links = [
  { label: 'Features', href: '#features' },
  { label: 'For Teachers', href: '#for-teachers' },
  { label: 'For Students', href: '#for-students' },
  { label: 'Pricing', href: '#pricing' },
];

export function LandingHeader() {
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link href="/" className="text-2xl font-bold text-primary tracking-tight">
          Strummy
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link
            href="/sign-in"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Log in
          </Link>
          <Button asChild className="rounded-full px-5 text-sm font-semibold bg-gradient-to-br from-[hsl(38,92%,50%)] to-[hsl(30,90%,42%)] text-[#271900] hover:opacity-90">
            <Link href="/sign-up">Start Free Trial</Link>
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 text-muted-foreground"
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => setOpen(!open)}
            className="p-2 text-foreground"
            aria-label="Menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-background px-4 pb-4 space-y-3">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="block py-2 text-sm font-medium text-muted-foreground"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <div className="flex items-center gap-3 pt-2">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-muted-foreground"
              onClick={() => setOpen(false)}
            >
              Log in
            </Link>
            <Button asChild className="rounded-full px-5 text-sm font-semibold">
              <Link href="/sign-up" onClick={() => setOpen(false)}>
                Start Free Trial
              </Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
