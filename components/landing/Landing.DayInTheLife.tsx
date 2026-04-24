'use client';

import { LandingContainer, SectionKicker, Display } from './landing-primitives';

const BEFORE = [
  {
    time: '7:45a',
    text: 'Dig through 6 WhatsApp threads to remember what Emma worked on last week.',
  },
  { time: '11:20a', text: 'Email a parent a "progress update" you half-invent from memory.' },
  {
    time: '2:10p',
    text: 'Can\'t find the tab for "Blackbird" you promised Carlos three weeks ago.',
  },
  { time: '4:00p', text: 'Lesson starts. First ten minutes: catching up on your own notes.' },
  { time: '9:30p', text: "Tonight's admin: copy assignments into a spreadsheet. Again." },
];

const AFTER = [
  {
    time: '7:45a',
    text: "Open Strummy. See everyone you're teaching today, what they worked on, what broke.",
  },
  { time: '11:20a', text: 'Parent report auto-drafted from lesson notes. Send in one click.' },
  {
    time: '2:10p',
    text: '"Blackbird" is in the shared library, tabs attached, marked as started.',
  },
  { time: '4:00p', text: 'Lesson starts. AI summary from last session is already on screen.' },
  { time: '9:30p', text: "You're done. Admin happened automatically during the day." },
];

function TimelineColumn({ rows, tone }: { rows: typeof BEFORE; tone: 'before' | 'after' }) {
  const isBefore = tone === 'before';
  return (
    <div
      className="relative overflow-hidden rounded-[14px]"
      style={{
        background: isBefore ? 'var(--l-paper)' : 'var(--l-card)',
        border: '1px solid var(--l-rule)',
        padding: '28px 32px',
      }}
    >
      {isBefore && (
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            background: `repeating-linear-gradient(-45deg, transparent 0, transparent 9px, color-mix(in oklab, var(--l-ink-5) 25%, transparent) 9px, color-mix(in oklab, var(--l-ink-5) 25%, transparent) 10px)`,
          }}
        />
      )}
      <div className="relative">
        <div className="mb-6 flex items-baseline gap-2.5">
          <span
            className="font-mono text-[11px] uppercase tracking-[0.18em]"
            style={{ color: isBefore ? 'var(--l-danger)' : 'var(--l-success)' }}
          >
            {tone}
          </span>
          <span
            className="font-serif text-[28px] tracking-[-0.02em]"
            style={{ color: 'var(--l-ink)' }}
          >
            {isBefore ? 'Thursday, the hard way.' : 'Thursday, with Strummy.'}
          </span>
        </div>

        {rows.map((r, i) => (
          <div
            key={i}
            className="grid items-start gap-3.5"
            style={{
              gridTemplateColumns: '58px 14px 1fr',
              padding: '14px 0',
              borderTop: i === 0 ? '1px solid var(--l-rule)' : 'none',
              borderBottom: '1px solid var(--l-rule)',
            }}
          >
            <div
              className="pt-px font-mono text-xs font-medium"
              style={{ color: isBefore ? 'var(--l-ink-4)' : 'var(--l-ink-2)' }}
            >
              {r.time}
            </div>
            <div className="relative h-full">
              <span
                className="absolute left-[5px] top-[7px] h-1.5 w-1.5 rounded-full"
                style={{ background: isBefore ? 'var(--l-ink-5)' : 'var(--l-gold)' }}
              />
              {i !== rows.length - 1 && (
                <span
                  className="absolute bottom-[-14px] left-[7px] top-[17px] w-px opacity-60"
                  style={{ background: isBefore ? 'var(--l-ink-5)' : 'var(--l-gold-dim)' }}
                />
              )}
            </div>
            <div
              className="text-sm leading-relaxed"
              style={{
                color: isBefore ? 'var(--l-ink-3)' : 'var(--l-ink-2)',
                textWrap: 'pretty',
              }}
            >
              {r.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LandingDayInTheLife() {
  return (
    <section className="py-20 lg:py-[100px]" style={{ background: 'var(--l-ivory)' }}>
      <LandingContainer>
        <div className="mx-auto mb-14 max-w-[780px] text-center">
          <SectionKicker align="center">A Thursday</SectionKicker>
          <Display size={56} align="center" className="mb-4 mt-3 max-md:!text-[36px]">
            You didn&apos;t get into teaching to manage{' '}
            <em className="italic" style={{ color: 'var(--l-gold-2)' }}>
              spreadsheets
            </em>
            .
          </Display>
          <p
            className="mx-auto max-w-[620px] text-[17px] leading-relaxed"
            style={{ color: 'var(--l-ink-3)' }}
          >
            Most guitar teachers we talked to spend eight hours a week on admin they don&apos;t get
            paid for. Here&apos;s what a normal day looks like.
          </p>
        </div>

        {/* Desktop: side-by-side */}
        <div className="hidden gap-6 lg:grid lg:grid-cols-2">
          <TimelineColumn rows={BEFORE} tone="before" />
          <TimelineColumn rows={AFTER} tone="after" />
        </div>

        {/* Mobile: stacked */}
        <div className="flex flex-col gap-4 lg:hidden">
          <TimelineColumn rows={BEFORE} tone="before" />
          <TimelineColumn rows={AFTER} tone="after" />
        </div>
      </LandingContainer>
    </section>
  );
}
