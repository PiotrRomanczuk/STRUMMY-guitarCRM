'use client';

import { AnimatedSection } from './AnimatedSection';

const integrations = [
  'Next.js',
  'Supabase',
  'Spotify',
  'Google Calendar',
  'OpenAI',
  'Vercel',
];

export function LandingSocialProof() {
  return (
    <section className="py-16 border-y border-border/50 dark:border-transparent dark:bg-card/30">
      <div className="container mx-auto px-4 text-center">
        <AnimatedSection>
          <p className="text-sm font-medium text-muted-foreground mb-8">
            Built for real guitar studios &mdash; powered by{' '}
            <span className="text-foreground font-semibold">{integrations.length} integrations</span>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {integrations.map((name) => (
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
