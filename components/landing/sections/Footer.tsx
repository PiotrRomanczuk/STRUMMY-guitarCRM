'use client';

import Link from 'next/link';
import { Instagram, Linkedin, Youtube, Twitter } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { footerColumns, footerSocial, type FooterColumn } from '../data/footer';

const socialIcons = {
  Instagram,
  X: Twitter,
  LinkedIn: Linkedin,
  YouTube: Youtube,
} as const;

type SocialName = keyof typeof socialIcons;

export function Footer() {
  return (
    <footer className="bg-[var(--l-ink)] py-16 text-[var(--l-paper)]">
      <div className="mx-auto w-full max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <BrandColumn />
          {footerColumns.map((col) => (
            <LinkColumn key={col.heading} col={col} />
          ))}
          <SocialColumn />
        </div>
        <LegalRow />
      </div>
    </footer>
  );
}

function BrandColumn() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'ok'>('idle');

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.includes('@')) return;
    setStatus('ok');
  }

  return (
    <div className="md:col-span-5">
      <p className="font-display text-2xl">Strummy</p>
      <p className="mt-4 max-w-sm text-sm text-[var(--l-ink-5)]">
        Get weekly tips on teaching, studio growth, and student wins.
      </p>
      <form onSubmit={onSubmit} className="mt-6 flex max-w-sm items-center gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          aria-label="Email address"
          className="flex-1 border-b border-[var(--l-ink-3)] bg-transparent py-2 text-sm placeholder-[var(--l-ink-4)] focus:border-[var(--l-gold)] focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-md bg-[var(--l-paper)] px-4 py-2 text-sm font-medium text-[var(--l-ink)] transition-opacity hover:opacity-90"
        >
          Subscribe
        </button>
      </form>
      {status === 'ok' && (
        <p className="mt-2 text-xs text-[var(--l-gold-dim)]">
          Thanks — check your inbox to confirm.
        </p>
      )}
      <p className="mt-3 text-xs text-[var(--l-ink-4)]">
        We respect your inbox. Unsubscribe anytime.
      </p>
    </div>
  );
}

function LinkColumn({ col }: { col: FooterColumn }) {
  return (
    <div className="md:col-span-3">
      <p className="font-display text-base">{col.heading}</p>
      <ul className="mt-4 space-y-2">
        {col.links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-sm text-[var(--l-ink-5)] transition-colors hover:text-[var(--l-paper)]"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialColumn() {
  return (
    <div className="md:col-span-1">
      <p className="font-display text-base">Social</p>
      <ul className="mt-4 space-y-2">
        {footerSocial.map((s) => {
          const Icon = socialIcons[s.label as SocialName];
          return (
            <li key={s.label}>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[var(--l-ink-5)] transition-colors hover:text-[var(--l-paper)]"
              >
                {Icon ? <Icon className="size-4" aria-hidden /> : null}
                {s.label}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function LegalRow() {
  return (
    <div className="mt-12 border-t border-[var(--l-ink-3)]/30 pt-6 text-xs text-[var(--l-ink-4)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} Strummy. All rights reserved.</p>
        {/* Legal pages aren't written yet; linking to 404s is worse than omitting
            them. Restore this row once /privacy, /terms and /cookies exist. */}
        <p>Built by Piotr Romanczuk.</p>
      </div>
    </div>
  );
}
