'use client';

import {
  LandingContainer,
  SectionKicker,
  Display,
  BtnGhost,
  StaffLines,
} from './landing-primitives';

export function LandingFounder() {
  return (
    <section
      className="border-y py-20 lg:py-24"
      style={{ background: 'var(--l-paper)', borderColor: 'var(--l-rule)' }}
    >
      <LandingContainer>
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
          {/* Portrait */}
          <div className="relative">
            <div
              className="relative grid w-full place-items-center overflow-hidden rounded-xl"
              style={{
                aspectRatio: '4 / 5',
                border: '1px solid var(--l-rule)',
                background: 'var(--l-paper)',
              }}
            >
              {/* Initials avatar as portrait stand-in */}
              <div className="flex flex-col items-center gap-4">
                <div
                  className="grid place-items-center rounded-full font-serif text-[64px] font-normal text-white"
                  style={{
                    width: 160,
                    height: 160,
                    background: 'linear-gradient(135deg, var(--l-gold), var(--l-gold-2))',
                    boxShadow: 'var(--l-shadow-lg)',
                  }}
                >
                  PR
                </div>
                <div
                  className="font-serif text-xl tracking-[-0.01em]"
                  style={{ color: 'var(--l-ink-2)' }}
                >
                  Piotr Romanczuk
                </div>
              </div>
              <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 opacity-10">
                <StaffLines width="100%" height={100} color="var(--l-ink)" />
              </div>
            </div>
            <div
              className="mt-3.5 font-mono text-[11px] uppercase tracking-[0.08em]"
              style={{ color: 'var(--l-ink-4)' }}
            >
              Poland · Est. 2024
            </div>
          </div>

          {/* Copy */}
          <div>
            <SectionKicker>Who made this</SectionKicker>
            <Display size={44} className="mb-6 mt-3 max-md:!text-[28px]">
              Built by a guitar teacher who was{' '}
              <em style={{ color: 'var(--l-gold-2)' }}>tired of his own spreadsheets</em>.
            </Display>
            <p
              className="mb-5 font-serif text-[17px] italic leading-[1.7]"
              style={{ color: 'var(--l-ink-2)', textWrap: 'pretty' }}
            >
              &ldquo;I teach guitar — twenty-odd students, week in, week out. I kept losing track of
              who played what, which songs we started, what I said last lesson. So I built the tool
              I wished existed. Strummy runs my entire studio now. I still teach every day, and I
              still ship code every night.&rdquo;
            </p>
            <p className="mb-2 text-sm font-medium" style={{ color: 'var(--l-ink-2)' }}>
              Piotr Romanczuk
            </p>
            <p className="mb-5 text-sm" style={{ color: 'var(--l-ink-4)' }}>
              Guitar teacher, solo founder &amp; developer
            </p>
            <BtnGhost>
              Read the full story
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </BtnGhost>
          </div>
        </div>
      </LandingContainer>
    </section>
  );
}
