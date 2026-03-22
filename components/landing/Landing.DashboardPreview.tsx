'use client';

import { AnimatedSection } from './AnimatedSection';
import { LandingDashboardMockup } from './Landing.DashboardMockup';

export function LandingDashboardPreview() {
  return (
    <section className="py-24 bg-secondary/30 dark:bg-secondary/10">
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.01em] text-foreground mb-4">
            Everything you need, at a glance
          </h2>
          <p className="text-lg leading-[1.7] text-muted-foreground max-w-2xl mx-auto">
            Your teacher dashboard shows today&apos;s agenda, student progress, and actionable
            insights — all in real time.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.15}>
          <div className="max-w-5xl mx-auto landing-float">
            <LandingDashboardMockup />
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
