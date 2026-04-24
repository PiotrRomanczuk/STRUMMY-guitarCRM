'use client';

import {
  Avatar,
  BtnPrimary,
  BtnGhost,
  BrowserFrame,
  ChordGrid,
  StaffLines,
} from './landing-primitives';
import { HeroDashboard } from './Landing.HeroDashboard';

const TRUST_AVATARS = [
  { initials: 'EJ', color: '#c89523' },
  { initials: 'CR', color: '#b84a3a' },
  { initials: 'LP', color: '#3a7d3a' },
  { initials: 'MP', color: '#6d4fa0' },
];

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-16 lg:pb-28 lg:pt-[72px]">
      {/* Staff line motif */}
      <div className="pointer-events-none absolute left-0 right-0 top-14 h-8 opacity-[0.18]">
        <StaffLines width="100%" height={32} color="var(--l-ink-4)" />
      </div>

      <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.18fr] lg:gap-[72px]">
          {/* LEFT — Typography */}
          <div>
            {/* Beta badge */}
            <div
              className="mb-9 inline-flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3"
              style={{ border: '1px solid var(--l-rule)', background: 'var(--l-card)' }}
            >
              <span
                className="rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em]"
                style={{ background: 'var(--l-gold-tint)', color: 'var(--l-gold-2)' }}
              >
                Public beta
              </span>
              <span className="text-xs" style={{ color: 'var(--l-ink-3)' }}>
                Free for teachers — no card.
              </span>
            </div>

            <h1
              className="mb-8 font-serif text-5xl font-normal lg:text-[76px]"
              style={{
                lineHeight: 1.04,
                letterSpacing: '-0.028em',
                color: 'var(--l-ink)',
                textWrap: 'balance',
              }}
            >
              The studio your students{' '}
              <em className="italic" style={{ color: 'var(--l-gold-2)' }}>
                deserve
              </em>
              .
            </h1>

            <p
              className="mb-10 max-w-[480px] text-lg leading-relaxed"
              style={{ color: 'var(--l-ink-3)', textWrap: 'pretty' }}
            >
              A calm, crafted workspace for guitar teachers. Lessons, students, songs, and progress
              — organised the way a working musician actually thinks.
            </p>

            <div className="mb-8 flex items-center gap-3">
              <BtnPrimary size="lg">
                Start free
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </BtnPrimary>
              <BtnGhost size="lg">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6,4 20,12 6,20" />
                </svg>
                Watch the 2-min tour
              </BtnGhost>
            </div>

            {/* Trust line */}
            <div
              className="flex items-center gap-3.5 text-[12.5px]"
              style={{ color: 'var(--l-ink-4)' }}
            >
              <div className="flex">
                {TRUST_AVATARS.map((s, i) => (
                  <div
                    key={i}
                    className="grid h-[26px] w-[26px] place-items-center rounded-full text-[10px] font-semibold text-white"
                    style={{
                      background: s.color,
                      border: '2px solid var(--l-ivory)',
                      marginLeft: i === 0 ? 0 : -8,
                    }}
                  >
                    {s.initials}
                  </div>
                ))}
              </div>
              <span>
                Used by teachers in{' '}
                <span className="font-medium" style={{ color: 'var(--l-ink-2)' }}>
                  3 countries
                </span>{' '}
                · 1,040 lessons tracked this month
              </span>
            </div>
          </div>

          {/* RIGHT — Product shot */}
          <div className="relative hidden lg:block">
            {/* Gold glow */}
            <div
              className="pointer-events-none absolute opacity-90"
              style={{
                inset: '-80px -40px',
                background:
                  'radial-gradient(50% 55% at 55% 45%, var(--l-gold-tint), transparent 70%)',
              }}
            />

            <div className="relative z-[1]">
              <BrowserFrame url="app.strummy.app/dashboard" height={420}>
                <HeroDashboard />
              </BrowserFrame>
            </div>

            {/* Floating chord card */}
            <div
              className="absolute -bottom-11 -left-13 z-[2] flex items-center gap-3.5 rounded-xl p-3 px-4"
              style={{
                background: 'var(--l-card)',
                border: '1px solid var(--l-rule)',
                boxShadow: '0 14px 30px -10px rgba(26,22,19,.18)',
              }}
            >
              <ChordGrid name="G" size={44} color="var(--l-ink-2)" />
              <div>
                <div
                  className="font-mono text-[9px] uppercase tracking-[0.14em]"
                  style={{ color: 'var(--l-ink-4)' }}
                >
                  Today · 4:00p · Emma
                </div>
                <div className="mt-0.5 font-serif text-[16px] italic leading-none">Blackbird</div>
                <div className="mt-0.5 text-[11px]" style={{ color: 'var(--l-ink-3)' }}>
                  Fingerpicking · 10 min
                </div>
              </div>
            </div>

            {/* Floating activity pill */}
            <div
              className="absolute -right-6 -top-5 z-[2] flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-3.5"
              style={{
                background: 'var(--l-card)',
                border: '1px solid var(--l-rule)',
                boxShadow: '0 14px 30px -10px rgba(26,22,19,.18)',
              }}
            >
              <Avatar initials="MP" color="#6d4fa0" size={24} />
              <div className="text-xs leading-tight">
                <span className="font-medium">Maya</span>{' '}
                <span className="font-medium" style={{ color: 'var(--l-success)' }}>
                  mastered
                </span>{' '}
                <span className="font-serif italic">Classical Gas</span>
              </div>
              <span className="font-mono text-[10px]" style={{ color: 'var(--l-ink-4)' }}>
                22m
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
