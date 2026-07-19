'use client';

import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollReveal } from '../motion/ScrollReveal';
import { RevealItem } from '../motion/RevealItem';
import { faqItems } from '../data/faq';

export function FAQ() {
  return (
    <section id="faq" className="bg-[var(--l-paper)] py-28 md:py-36">
      <div className="mx-auto w-full max-w-3xl px-6">
        <ScrollReveal y={16}>
          <h2 className="font-display text-4xl tracking-tight md:text-5xl">Questions</h2>
          <p className="mt-4 text-[var(--l-ink-3)]">
            Everything you need to know about Strummy and how it works.
          </p>
        </ScrollReveal>
        <ScrollReveal stagger={0.06} y={12} className="mt-12">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, i) => (
              <RevealItem key={item.question}>
                <AccordionItem value={`faq-${i}`} className="border-[var(--l-rule)]">
                  <AccordionTrigger className="font-display py-6 text-left text-lg text-[var(--l-ink)] hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-[var(--l-ink-3)]">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              </RevealItem>
            ))}
          </Accordion>
        </ScrollReveal>
        <ScrollReveal y={16} delay={0.2} className="mt-20">
          <h3 className="font-display text-2xl">Still have questions?</h3>
          <p className="mt-2 text-[var(--l-ink-3)]">
            The fastest answer is to try it — the demo studio is fully populated with lessons,
            students and practice history.
          </p>
          <Link
            href="/sign-in?demo=true"
            className="mt-5 inline-flex rounded-md border border-[var(--l-rule)] bg-[var(--l-card)] px-4 py-2 text-sm text-[var(--l-ink)] transition-colors hover:bg-[var(--l-paper)]"
          >
            Try the live demo
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
