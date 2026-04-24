'use client';

import { LandingContainer, SectionKicker, Display, StaffLines } from './landing-primitives';

const STATS = [
  { value: '1,040', label: 'lessons tracked this month', footnote: 'Across live studios' },
  { value: '1,200+', label: 'songs in the library', footnote: 'Tabs, chords, Spotify enriched' },
  { value: '27', label: 'teachers in public beta', footnote: 'In 3 countries' },
  {
    value: '8hrs',
    label: 'of admin saved per teacher, weekly',
    footnote: 'Self-reported, early users',
  },
];

export function LandingMetrics() {
  return (
    <section className="py-20 lg:py-24" style={{ background: 'var(--l-ivory)' }}>
      <LandingContainer>
        <div className="mb-12 text-center">
          <SectionKicker align="center">Honest numbers</SectionKicker>
          <Display size={48} align="center" className="mt-3 max-md:!text-[32px]">
            Small studio, <em style={{ color: 'var(--l-gold-2)' }}>real traction</em>.
          </Display>
        </div>

        <div
          className="grid grid-cols-2 overflow-hidden rounded-[14px] lg:grid-cols-4"
          style={{ border: '1px solid var(--l-rule)', background: 'var(--l-card)' }}
        >
          {STATS.map((s, i) => (
            <div
              key={i}
              className="relative overflow-hidden px-6 py-8 lg:px-8 lg:py-9"
              style={{
                borderLeft: i % 2 === 0 ? 'none' : '1px solid var(--l-rule)',
                borderTop: i >= 2 ? '1px solid var(--l-rule)' : 'none',
              }}
            >
              <div
                className="font-serif text-5xl font-normal leading-none tracking-[-0.04em] lg:text-[64px]"
                style={{ color: 'var(--l-ink)' }}
              >
                {s.value}
              </div>
              <div className="mt-2.5 text-sm leading-snug" style={{ color: 'var(--l-ink-2)' }}>
                {s.label}
              </div>
              <div
                className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.08em]"
                style={{ color: 'var(--l-ink-4)' }}
              >
                {s.footnote}
              </div>
              <div className="pointer-events-none absolute -bottom-1 left-6 right-6 h-5 opacity-20">
                <StaffLines width="100%" height={20} color="var(--l-ink-4)" />
              </div>
            </div>
          ))}
        </div>
      </LandingContainer>
    </section>
  );
}
