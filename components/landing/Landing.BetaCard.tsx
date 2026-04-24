'use client';

import { LandingContainer, Display, BtnPrimary, BtnGhost } from './landing-primitives';

export function LandingBetaCard() {
  return (
    <section className="pb-10 pt-20" style={{ background: 'var(--l-ivory)' }}>
      <LandingContainer>
        <div
          className="relative mx-auto max-w-[720px] overflow-hidden rounded-2xl px-8 py-10 lg:px-11"
          style={{ border: '1px solid var(--l-rule)', background: 'var(--l-card)' }}
        >
          {/* Gold glow */}
          <div
            className="pointer-events-none absolute -right-5 -top-5 h-40 w-40 opacity-80"
            style={{
              background: 'radial-gradient(circle, var(--l-gold-tint) 0%, transparent 70%)',
            }}
          />

          <div className="relative">
            <div className="mb-4 flex items-center gap-2.5">
              <span
                className="rounded-full px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em]"
                style={{ background: 'var(--l-gold-tint)', color: 'var(--l-gold-2)' }}
              >
                Public beta
              </span>
              <span className="font-mono text-xs" style={{ color: 'var(--l-ink-4)' }}>
                v0.113 · Apr 2026
              </span>
            </div>

            <Display size={34} className="mb-3.5 max-md:!text-[24px]">
              Free while we&apos;re in beta. All features included.
            </Display>

            <p
              className="mb-5 max-w-[540px] text-[15px] leading-relaxed"
              style={{ color: 'var(--l-ink-3)', textWrap: 'pretty' }}
            >
              No cards on file, no feature gates, no surprise upsells. When we launch paid tiers,
              beta teachers keep access to everything they&apos;re using at a permanent discount.
            </p>

            <div className="flex gap-3">
              <BtnPrimary>Start free</BtnPrimary>
              <BtnGhost>See what&apos;s shipped</BtnGhost>
            </div>
          </div>
        </div>
      </LandingContainer>
    </section>
  );
}
