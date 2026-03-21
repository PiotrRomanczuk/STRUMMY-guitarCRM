'use client';

import { AnimatedSection } from './AnimatedSection';

const logos = [
  'Rockridge Music',
  'Fretboard Academy',
  'Harmony School',
  'SixString Studios',
  'Golden Note',
  'Acoustic Path',
];

export function LandingSocialProof() {
  return (
    <section className="py-16 border-y border-border/50">
      <div className="container mx-auto px-4 text-center">
        <AnimatedSection>
          <p className="text-sm font-medium text-muted-foreground mb-8">
            Trusted by <span className="text-primary font-semibold">20+ virtuoso teachers</span>{' '}
            daily
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {logos.map((name) => (
              <span
                key={name}
                className="text-base font-semibold text-muted-foreground/40 tracking-wide select-none"
              >
                {name}
              </span>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
