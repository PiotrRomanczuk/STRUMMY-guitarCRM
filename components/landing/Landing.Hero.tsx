'use client';

import Link from 'next/link';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedSection } from './AnimatedSection';
import { LandingDashboardMockup } from './Landing.DashboardMockup';

export function LandingHero() {
  return (
    <section className="landing-gradient-hero pt-20 pb-24 lg:pt-28 lg:pb-32 overflow-hidden">
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase">
            Now with AI-Powered Tab Scanning
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] tracking-[-0.02em] text-foreground mb-6">
            Manage your guitar students{' '}
            <span className="gradient-text">with ease</span>
          </h1>
          <p className="text-lg leading-[1.7] text-muted-foreground max-w-2xl mx-auto mb-8">
            A beautiful, editorial workspace for the modern guitar teacher. Track progress, schedule lessons, and scale your practice.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              className="rounded-full px-8 py-6 text-base font-semibold shadow-lg bg-gradient-to-br from-[hsl(38,92%,50%)] to-[hsl(30,90%,42%)] text-[#271900] hover:opacity-90"
            >
              <Link href="/sign-up">Start Free Trial</Link>
            </Button>
            <Button
              variant="outline"
              className="rounded-full px-8 py-6 text-base font-medium border-primary/40 text-primary hover:bg-primary/10"
            >
              <Play size={16} className="mr-2" /> See Demo
            </Button>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <div className="landing-perspective-tilt mx-auto max-w-5xl">
            <LandingDashboardMockup />
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
