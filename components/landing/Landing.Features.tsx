'use client';

import type { ReactNode } from 'react';
import {
  LandingContainer,
  SectionKicker,
  Display,
  Eyebrow,
  Placeholder,
} from './landing-primitives';
import { LandingFeatureScreenshot } from './Landing.FeatureScreenshot';

interface Feature {
  n: string;
  kicker: string;
  title: string;
  body: string;
  bullets: string[];
  render: ReactNode;
}

const FEATURES: Feature[] = [
  {
    n: '01',
    kicker: 'Students',
    title: 'Every student, their whole journey.',
    body: 'Profiles, lesson history, repertoire, skill progression, practice streaks, parent contacts — all on one page. The thing you kept meaning to build in Notion.',
    bullets: [
      'AI-drafted progress reports',
      'Parent-ready PDF summaries',
      'Skill-tracked songs & scales',
    ],
    render: <LandingFeatureScreenshot />,
  },
  {
    n: '02',
    kicker: 'Lessons',
    title: 'Schedule it. Run it. Move on.',
    body: "Google Calendar sync means no double-booked 4 o'clocks. Live lesson view on your iPad. When you close the session, Strummy writes the notes for you.",
    bullets: [
      'Two-way Google Calendar sync',
      'In-lesson live session mode',
      'AI-generated lesson summaries',
    ],
    render: <Placeholder label="lessons.png" note="screenshot · drop in later" height={480} />,
  },
  {
    n: '03',
    kicker: 'Library',
    title: 'A thousand songs, tabs already found.',
    body: "1,000+ songs with chords, tabs, and Spotify-enriched metadata. Difficulty ratings. One click to add to a student's repertoire.",
    bullets: [
      'Auto-tagged difficulty',
      'Spotify previews attached',
      'Shared across your whole studio',
    ],
    render: <Placeholder label="songs.png" note="screenshot · drop in later" height={480} />,
  },
  {
    n: '04',
    kicker: 'Fretboard',
    title: 'A fretboard that plays back.',
    body: 'Scales, chords, and CAGED positions — mapped, coloured, audible. Quiz mode turns theory into muscle memory. Runs in any browser.',
    bullets: [
      'Scales · CAGED · arpeggios',
      'Click a note, hear a note',
      'Training quizzes for students',
    ],
    render: (
      <Placeholder label="fretboard screenshot" note="live component available" height={480} />
    ),
  },
];

function CheckIcon() {
  return (
    <span
      className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full"
      style={{ background: 'var(--l-gold-tint)', color: 'var(--l-gold-2)' }}
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12l5 5L20 7" />
      </svg>
    </span>
  );
}

function FeatureRow({ f, flip }: { f: Feature; flip: boolean }) {
  return (
    <div className="border-t py-14 lg:py-[72px]" style={{ borderColor: 'var(--l-rule)' }}>
      <div
        className={`grid items-center gap-12 lg:gap-[72px] ${flip ? 'lg:grid-cols-[1.15fr_1fr]' : 'lg:grid-cols-[1fr_1.15fr]'}`}
      >
        {/* Copy */}
        <div className={flip ? 'lg:order-2' : ''}>
          <div
            className="mb-3 font-mono text-[52px] leading-none tracking-[-0.02em]"
            style={{ color: 'var(--l-gold-dim)' }}
          >
            {f.n}
          </div>
          <Eyebrow style={{ marginBottom: 14, color: 'var(--l-gold-2)' }}>{f.kicker}</Eyebrow>
          <Display size={44} className="mb-4 max-w-[460px] max-md:!text-[30px]">
            {f.title}
          </Display>
          <p
            className="mb-5 max-w-[460px] text-[16px] leading-relaxed"
            style={{ color: 'var(--l-ink-3)', textWrap: 'pretty' }}
          >
            {f.body}
          </p>
          <div className="flex flex-col gap-2.5">
            {f.bullets.map((b, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 text-sm"
                style={{ color: 'var(--l-ink-2)' }}
              >
                <CheckIcon />
                {b}
              </div>
            ))}
          </div>
        </div>

        {/* Screenshot */}
        <div className={flip ? 'lg:order-1' : ''}>{f.render}</div>
      </div>
    </div>
  );
}

export function LandingFeatures() {
  return (
    <section
      id="features"
      className="py-14 pb-24 lg:py-[60px] lg:pb-[120px]"
      style={{ background: 'var(--l-paper)' }}
    >
      <LandingContainer>
        <div className="mx-auto max-w-[780px] pb-5 pt-10 text-center">
          <SectionKicker align="center">The product</SectionKicker>
          <Display size={56} align="center" className="mb-4 mt-3 max-md:!text-[32px]">
            Four corners of a <em style={{ color: 'var(--l-gold-2)' }}>teaching practice</em>.
          </Display>
        </div>
        {FEATURES.map((f, i) => (
          <FeatureRow key={f.n} f={f} flip={i % 2 === 1} />
        ))}
      </LandingContainer>
    </section>
  );
}
