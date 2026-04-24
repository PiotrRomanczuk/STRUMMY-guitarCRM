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
          {/* Portrait placeholder */}
          <div className="relative">
            <div
              className="relative grid w-full place-items-center overflow-hidden rounded-xl"
              style={{
                aspectRatio: '4 / 5',
                border: '1px solid var(--l-rule)',
                background: `repeating-linear-gradient(135deg, var(--l-rule-2) 0px, var(--l-rule-2) 1px, transparent 1px, transparent 9px)`,
                backgroundColor: 'var(--l-card)',
              }}
            >
              <div
                className="rounded-md px-3 py-2 font-mono text-[11px] text-center"
                style={{
                  border: '1px solid var(--l-rule)',
                  background: 'var(--l-card)',
                  color: 'var(--l-ink-3)',
                }}
              >
                <div
                  className="text-[9px] uppercase tracking-[0.12em]"
                  style={{ color: 'var(--l-gold-2)' }}
                >
                  Portrait
                </div>
                <div>founder.jpg</div>
              </div>
              <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 opacity-15">
                <StaffLines width="100%" height={100} color="var(--l-ink)" />
              </div>
            </div>
            <div
              className="mt-3.5 font-mono text-[11px] uppercase tracking-[0.08em]"
              style={{ color: 'var(--l-ink-4)' }}
            >
              Brooklyn, NY · Est. 2024
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
              &ldquo;I taught guitar for nine years in Brooklyn — twenty-odd students, mostly kids.
              Every Sunday I&apos;d sit down with Google Sheets and try to remember what each of
              them worked on. I built Strummy because I didn&apos;t want to do that anymore.
              I&apos;m still teaching. I still use it every day.&rdquo;
            </p>
            <p className="mb-5 text-sm" style={{ color: 'var(--l-ink-3)' }}>
              <span className="font-medium" style={{ color: 'var(--l-ink-2)' }}>
                Placeholder copy
              </span>{' '}
              — drop in a real founder quote, name, and a photo.
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
