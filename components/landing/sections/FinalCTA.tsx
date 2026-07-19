'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ScrollReveal } from '../motion/ScrollReveal';
import { useReducedMotionSafe } from '../motion/useReducedMotionSafe';
import { textures } from '../data/collages';

export function FinalCTA() {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotionSafe();
  const { scrollYProgress } = useScroll({
    target: ref as React.RefObject<HTMLElement>,
    offset: ['start end', 'end start'],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], [reduced ? 0 : 60, reduced ? 0 : -60]);

  return (
    <section ref={ref} className="relative overflow-hidden bg-[var(--l-ink)] text-[var(--l-paper)]">
      <motion.div
        aria-hidden
        className="absolute inset-0 z-0 will-change-transform"
        style={{ y: bgY }}
      >
        <Image src={textures.concrete} alt="" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--l-ink)]/40 via-[var(--l-ink)]/35 to-[var(--l-ink)]/55" />
      </motion.div>
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-6 px-6 py-24 md:flex-row md:items-center md:py-32">
        <ScrollReveal y={20} stagger={0.08} className="max-w-2xl">
          <h2 className="font-display text-4xl tracking-tight text-balance md:text-5xl">
            Start teaching, not managing
          </h2>
          <p className="mt-4 text-[var(--l-ink-5)]">
            Join independent teachers who&apos;ve reclaimed their time.
          </p>
        </ScrollReveal>
        <ScrollReveal y={16} delay={0.15} className="flex flex-wrap gap-3">
          <Link
            href="/sign-up"
            className="group relative overflow-hidden rounded-md bg-[var(--l-paper)] px-5 py-2.5 text-sm font-medium text-[var(--l-ink)] transition-transform hover:scale-[1.02]"
          >
            <span className="relative z-10">Start free</span>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent_35%,rgba(232,184,74,0.5)_50%,transparent_65%)] opacity-0 transition-[transform,opacity] duration-700 group-hover:translate-x-full group-hover:opacity-100"
            />
          </Link>
          <Link
            href="/sign-in?demo=true"
            className="rounded-md border border-[var(--l-paper)]/40 px-5 py-2.5 text-sm font-medium text-[var(--l-paper)] transition-colors hover:bg-[var(--l-paper)]/10"
          >
            Try the live demo
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
