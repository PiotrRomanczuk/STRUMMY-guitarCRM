'use client';

import { LandingContainer, Eyebrow } from './landing-primitives';

const INTEGRATIONS = [
  { name: 'Google Calendar', sub: 'Lesson sync' },
  { name: 'Spotify', sub: 'Song metadata' },
  { name: 'Gmail', sub: 'Student contact' },
  { name: 'Google Drive', sub: 'Sheet music' },
];

export function LandingIntegrations() {
  return (
    <section
      className="border-y py-14"
      style={{
        background: 'var(--l-ivory)',
        borderColor: 'var(--l-rule)',
      }}
    >
      <LandingContainer>
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_3fr] lg:gap-12">
          <div>
            <Eyebrow style={{ marginBottom: 10 }}>Works with</Eyebrow>
            <div
              className="font-serif text-2xl leading-snug tracking-[-0.02em]"
              style={{ color: 'var(--l-ink)' }}
            >
              The tools you already live in.
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            {INTEGRATIONS.map((it) => (
              <div
                key={it.name}
                className="flex flex-col gap-1 rounded-[10px] px-5 py-[18px]"
                style={{
                  border: '1px solid var(--l-rule)',
                  background: 'var(--l-card)',
                }}
              >
                <div
                  className="text-[15px] font-medium tracking-[-0.01em]"
                  style={{ color: 'var(--l-ink)' }}
                >
                  {it.name}
                </div>
                <div
                  className="font-mono text-[11px] uppercase tracking-[0.08em]"
                  style={{ color: 'var(--l-ink-4)' }}
                >
                  {it.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </LandingContainer>
    </section>
  );
}
