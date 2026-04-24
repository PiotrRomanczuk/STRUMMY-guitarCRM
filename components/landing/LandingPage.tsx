'use client';

import { LandingHeader } from './Landing.Header';
import { LandingHero } from './Landing.Hero';
import { LandingDayInTheLife } from './Landing.DayInTheLife';
import { LandingFeatures } from './Landing.Features';
import { LandingIntegrations } from './Landing.Integrations';
import { LandingMetrics } from './Landing.Metrics';
import { LandingFounder } from './Landing.Founder';
import { LandingBetaCard } from './Landing.BetaCard';
import { LandingCTA } from './Landing.CTA';
import { LandingFooter } from './Landing.Footer';

export function LandingPage() {
  return (
    <div
      className="landing-editorial min-h-screen font-sans antialiased"
      style={{
        background: 'var(--l-ivory)',
        color: 'var(--l-ink)',
        fontFeatureSettings: '"ss01", "cv11"',
      }}
    >
      <LandingHeader />
      <LandingHero />
      <LandingDayInTheLife />
      <LandingFeatures />
      <LandingIntegrations />
      <LandingMetrics />
      <LandingFounder />
      <LandingBetaCard />
      <LandingCTA />
      <LandingFooter />
    </div>
  );
}
