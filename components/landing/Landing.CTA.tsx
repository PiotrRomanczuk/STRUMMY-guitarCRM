'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AnimatedSection } from './AnimatedSection';

export function LandingCTA() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <AnimatedSection>
          <div className="landing-gradient-cta rounded-3xl p-12 md:p-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.01em] text-white mb-4">
              Ready to transform your teaching studio?
            </h2>
            <p className="text-lg leading-[1.7] text-white/80 max-w-xl mx-auto mb-8">
              Join the guitar teachers who&apos;ve simplified their daily workflow.
            </p>
            <Button
              asChild
              className="rounded-full bg-card text-foreground hover:bg-card/90 px-10 py-6 text-base font-semibold shadow-lg"
            >
              <Link href="/sign-up">Start Your Free Trial</Link>
            </Button>
            <p className="text-sm text-white/60 mt-4">
              No credit card required · Free for 14 days · Cancel anytime
            </p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
