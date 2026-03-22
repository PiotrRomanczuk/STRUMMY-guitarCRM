'use client';

import { AnimatedSection } from './AnimatedSection';

const testimonials = [
  {
    name: 'Alex M.',
    role: 'Guitar Instructor',
    quote:
      'Strummy replaced 4 different apps for me. The AI lesson notes alone save me an hour every day.',
    avatar: 'A',
  },
  {
    name: 'Sarah J.',
    role: 'Music School Owner',
    quote:
      "My students love the practice tracker. Parents can actually see progress now — it's been a game changer for retention.",
    avatar: 'S',
  },
  {
    name: 'Mike R.',
    role: 'Private Teacher',
    quote:
      'The song library integration with Spotify is incredible. I find the perfect song for each student in seconds.',
    avatar: 'M',
  },
];

export function LandingTestimonials() {
  return (
    <section className="py-24 bg-secondary/30 dark:bg-secondary/10">
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.01em] text-foreground mb-4">
            What teachers are saying
          </h2>
          <p className="text-lg leading-[1.7] text-muted-foreground">
            Feedback from our early adopters.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <AnimatedSection key={t.name} delay={i * 0.1}>
              <div className="rounded-2xl border border-border dark:border-0 bg-card dark:bg-card p-6 landing-shadow-card h-full flex flex-col">
                <span className="text-3xl text-primary font-serif leading-none mb-3">
                  &ldquo;
                </span>
                <p className="text-sm text-foreground leading-relaxed flex-1">{t.quote}</p>
                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border dark:border-muted">
                  <div className="w-9 h-9 rounded-full bg-primary/10 dark:bg-primary/15 flex items-center justify-center text-sm font-bold text-primary">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
