'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { ScrollReveal } from '../motion/ScrollReveal';
import { RevealItem } from '../motion/RevealItem';
import { TextReveal } from '../motion/TextReveal';
import { easeSnap } from '../motion/easings';
import { pricingTiers, type PricingTier } from '../data/pricing';

export function Pricing() {
  return (
    <section
      id="pricing"
      className="relative overflow-hidden py-28 text-[var(--l-paper)] md:py-36"
      style={{ backgroundColor: 'var(--l-navy)' }}
    >
      {/* ambient gold radial */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 h-[80rem] w-[80rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.06] blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--l-gold) 0%, transparent 60%)' }}
      />
      <div className="relative mx-auto w-full max-w-7xl px-6">
        <ScrollReveal className="text-center" y={16}>
          <p className="font-mono text-xs tracking-[0.18em] text-[var(--l-gold-dim)] uppercase">
            Plans
          </p>
        </ScrollReveal>
        <TextReveal
          as="h2"
          text="Pricing"
          className="font-display mt-3 text-center text-5xl tracking-tight md:text-6xl"
          stagger={0.06}
          splitBy="char"
        />
        <ScrollReveal className="mt-4 text-center" y={12} delay={0.15}>
          <p className="text-[var(--l-ink-5)]">
            Free while Strummy is in active development. Paid tiers below are planned, not yet
            billed.
          </p>
        </ScrollReveal>
        <ScrollReveal className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3" stagger={0.12} y={28}>
          {pricingTiers.map((tier) => (
            <PricingCard key={tier.name} tier={tier} />
          ))}
        </ScrollReveal>
      </div>
    </section>
  );
}

function PricingCard({ tier }: { tier: PricingTier }) {
  return (
    <RevealItem>
      <motion.div
        whileHover={tier.highlighted ? { scale: 1.04 } : { scale: 1.02 }}
        transition={{ duration: 0.4, ease: easeSnap }}
        className="group relative flex h-full flex-col rounded-2xl border p-8 transition-shadow"
        style={{
          borderColor: tier.highlighted ? 'var(--l-gold-dim)' : 'rgba(255,255,255,0.08)',
          background: 'var(--l-navy-2)',
          boxShadow: tier.highlighted
            ? '0 30px 60px -30px rgba(232,184,74,0.35), 0 0 0 1px rgba(232,184,74,0.3) inset'
            : '0 20px 40px -20px rgba(0,0,0,0.35)',
        }}
      >
        <div className="border-b border-white/10 pb-6">
          <h3 className="font-display text-2xl">{tier.name}</h3>
          <p className="mt-1 text-sm text-[var(--l-ink-5)]">{tier.description}</p>
        </div>
        <div className="flex flex-1 flex-col">
          <div className="py-8">
            <p className="font-display text-6xl tracking-tight">{tier.price}</p>
            <p className="mt-1 text-sm text-[var(--l-ink-5)]">{tier.period}</p>
          </div>
          <Link
            href={tier.cta.href}
            className="rounded-md bg-[var(--l-info)] py-2.5 text-center text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={
              tier.highlighted
                ? { background: 'linear-gradient(135deg, #6d8db8, #4f70a0)' }
                : undefined
            }
          >
            {tier.cta.label}
          </Link>
          <ul className="mt-8 space-y-3 text-sm">
            {tier.features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-[var(--l-gold-dim)]" aria-hidden />
                <span className="text-[var(--l-ink-5)]">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </RevealItem>
  );
}
