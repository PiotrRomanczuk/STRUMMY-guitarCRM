'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { PhotoCollage } from '../motion/PhotoCollage';
import { TextReveal } from '../motion/TextReveal';
import { easeCine, stagger as staggerConst } from '../motion/easings';
import { heroCollage } from '../data/collages';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[var(--l-ink)] text-[var(--l-paper)]">
      {/* ambient gold radial */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 h-[60rem] w-[60rem] rounded-full opacity-[0.08] blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--l-gold) 0%, transparent 60%)' }}
      />
      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 px-6 py-24 md:grid-cols-12 md:py-32">
        <div className="md:col-span-6 md:pr-8">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeCine }}
            className="font-mono text-xs tracking-[0.18em] text-[var(--l-gold-dim)] uppercase"
          >
            For independent guitar teachers
          </motion.p>
          <TextReveal
            as="h1"
            text="Stop juggling spreadsheets and start teaching"
            className="font-display mt-6 text-5xl leading-[1.05] tracking-tight text-balance md:text-6xl"
            stagger={staggerConst.base}
          />
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: easeCine }}
            className="mt-6 max-w-md text-base text-[var(--l-ink-5)]"
          >
            Strummy brings your entire studio into one place. Track student progress, plan lessons,
            share tabs, and let parents see what their kids are learning. Built by teachers, for
            teachers.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55, ease: easeCine }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link
              href="/sign-up"
              className="rounded-md bg-[var(--l-paper)] px-5 py-2.5 text-sm font-medium text-[var(--l-ink)] transition-transform hover:scale-[1.02]"
            >
              Start free
            </Link>
            <Link
              href="/sign-in?demo=true"
              className="rounded-md border border-[var(--l-ink-3)]/40 bg-transparent px-5 py-2.5 text-sm font-medium text-[var(--l-paper)] transition-colors hover:bg-[var(--l-ink-2)]"
            >
              Try the live demo
            </Link>
          </motion.div>
        </div>
        <div className="md:col-span-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.25, ease: easeCine }}
          >
            <PhotoCollage items={heroCollage} aspect="5/6" className="w-full" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
