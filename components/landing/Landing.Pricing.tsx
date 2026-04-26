'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, Sparkles } from 'lucide-react';

const plans = [
  {
    name: 'Solo',
    description: 'Perfect for individual teachers starting out',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'Up to 10 students',
      'Basic scheduling',
      'Lesson notes',
      'Student profiles',
      'Email support',
    ],
    cta: 'Start free',
    popular: false,
  },
  {
    name: 'Studio',
    description: 'For growing teachers with established practices',
    monthlyPrice: 19,
    yearlyPrice: 190,
    features: [
      'Unlimited students',
      'Advanced scheduling',
      'Payment tracking',
      'Repertoire library',
      'Student portal access',
      'Practice tracking',
      'Priority support',
    ],
    cta: 'Start free trial',
    popular: true,
  },
  {
    name: 'Academy',
    description: 'For music schools and multi-teacher studios',
    monthlyPrice: 49,
    yearlyPrice: 490,
    features: [
      'Everything in Studio',
      'Multiple teachers',
      'Student assignments',
      'AI practice tips',
      'Advanced analytics',
      'Custom branding',
      'API access',
      'Dedicated support',
    ],
    cta: 'Contact sales',
    popular: false,
  },
];

export function LandingPricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-muted/30" />
      <div className="absolute inset-0">
        <svg
          className="absolute bottom-0 left-0 w-full h-64 text-background"
          viewBox="0 0 1440 256"
          preserveAspectRatio="none"
        >
          <path
            d="M0,256 L0,128 Q360,64 720,128 T1440,128 L1440,256 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 dark:bg-primary/15 border border-primary/20 dark:border-0 mb-4">
            <span className="text-xs font-medium text-primary uppercase tracking-wider">Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">
            Simple, honest pricing
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Start free and upgrade as you grow. No hidden fees, no surprises.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-4 p-1 rounded-full bg-muted border border-border dark:border-0 dark:bg-card">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                !isYearly
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                isYearly
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs text-primary font-semibold">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 transition-all duration-500 ${
                plan.popular
                  ? 'bg-card border-2 border-primary dark:border-primary/60 shadow-2xl shadow-primary/10 scale-105 z-10'
                  : 'bg-card/50 dark:bg-card border border-border/50 dark:border-0 hover:border-border hover:bg-card dark:hover:bg-muted/40'
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-lg shadow-primary/30">
                    <Sparkles className="w-3 h-3" />
                    Most Popular
                  </div>
                </div>
              )}

              {/* Plan name */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">
                    ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  {plan.monthlyPrice > 0 && (
                    <span className="text-muted-foreground">/{isYearly ? 'year' : 'month'}</span>
                  )}
                </div>
                {plan.monthlyPrice === 0 && (
                  <span className="text-sm text-muted-foreground">Free forever</span>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        plan.popular
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link href="/sign-up" prefetch={false} className="block">
                <Button
                  className={`w-full ${
                    plan.popular
                      ? 'shadow-lg shadow-primary/25 hover:shadow-primary/40'
                      : ''
                  }`}
                  variant={plan.popular ? 'default' : 'outline'}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p className="text-center text-sm text-muted-foreground mt-12">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </div>
    </section>
  );
}
