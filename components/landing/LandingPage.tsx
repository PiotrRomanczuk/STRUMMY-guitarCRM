'use client';

import { LandingHeader } from './Landing.Header';
import { LandingHero } from './Landing.Hero';
import { LandingSocialProof } from './Landing.SocialProof';
import { LandingFeatures } from './Landing.Features';
import { LandingDashboardPreview } from './Landing.DashboardPreview';
import { LandingRoles } from './Landing.Roles';
import { LandingTestimonials } from './Landing.Testimonials';
import { LandingIntegrations } from './Landing.Integrations';
import { LandingCTA } from './Landing.CTA';
import { LandingFooter } from './Landing.Footer';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <LandingHero />
      <LandingSocialProof />
      <LandingFeatures />
      <LandingDashboardPreview />
      <LandingRoles />
      <LandingTestimonials />
      <LandingIntegrations />
      <LandingCTA />
      <LandingFooter />
    </div>
  );
}
