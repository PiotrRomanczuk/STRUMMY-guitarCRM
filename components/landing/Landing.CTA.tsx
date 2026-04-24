'use client';

import {
  LandingContainer,
  Display,
  BtnPrimary,
  BtnGhost,
  FretboardSVG,
} from './landing-primitives';

export function LandingCTA() {
  return (
    <section
      className="relative overflow-hidden border-y py-24 lg:py-[110px]"
      style={{
        background: `linear-gradient(135deg, var(--l-gold-tint) 0%, color-mix(in oklab, var(--l-gold-dim) 35%, var(--l-paper)) 60%, var(--l-gold-dim) 100%)`,
        borderColor: 'color-mix(in oklab, var(--l-gold-2) 35%, transparent)',
      }}
    >
      {/* Decorative fretboard */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.12]">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2">
          <FretboardSVG frets={24} width="100%" height={110} color="var(--l-ink)" />
        </div>
      </div>

      <div className="relative">
        <LandingContainer>
          <div className="mx-auto max-w-[820px] text-center">
            <div
              className="mb-6 font-mono text-[11px] uppercase tracking-[0.22em]"
              style={{ color: 'var(--l-ink-2)' }}
            >
              — Ready when you are —
            </div>

            <Display
              size={76}
              align="center"
              className="mb-6 max-md:!text-[44px]"
              style={{ color: 'var(--l-ink)' }}
            >
              Teach more.
              <br />
              <em style={{ color: 'var(--l-ink-2)' }}>Admin less.</em>
            </Display>

            <p
              className="mx-auto mb-9 max-w-[560px] text-lg leading-relaxed"
              style={{ color: 'var(--l-ink-2)', textWrap: 'pretty' }}
            >
              Start free. No credit card. Bring one student or twenty — Strummy scales to however
              you teach.
            </p>

            <div className="flex justify-center gap-3">
              <BtnPrimary size="lg">
                Get started — free
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
              <BtnGhost
                size="lg"
                style={{
                  borderColor: 'color-mix(in oklab, var(--l-ink) 25%, transparent)',
                  color: 'var(--l-ink-2)',
                }}
              >
                Try the demo
              </BtnGhost>
            </div>
          </div>
        </LandingContainer>
      </div>
    </section>
  );
}
