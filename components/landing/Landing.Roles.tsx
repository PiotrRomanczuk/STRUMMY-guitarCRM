'use client';

import { Check } from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';

const teacherFeatures = [
  'Manage your entire studio from one dashboard',
  'AI lesson notes save hours of admin work',
  'Track student progress with visual charts',
  'Schedule lessons and sync with Google Calendar',
  'Assign homework with reusable templates',
];

const studentFeatures = [
  'See upcoming lessons and practice assignments',
  'Built-in practice timer with streak tracking',
  'Access song library with tabs and chords',
  'Track your own progress over time',
  'Song of the Week spotlight for inspiration',
];

function RoleCard({ title, items, delay }: { title: string; items: string[]; delay: number }) {
  return (
    <AnimatedSection delay={delay}>
      <div className="rounded-2xl border border-border dark:border-0 bg-card dark:bg-card p-8 landing-shadow-card h-full">
        <h3 className="text-xl font-bold text-foreground mb-6">{title}</h3>
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
              <Check size={16} className="text-primary mt-0.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </AnimatedSection>
  );
}

export function LandingRoles() {
  return (
    <section id="for-teachers" className="py-24">
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.01em] text-foreground mb-4">
            Built for everyone in the studio
          </h2>
          <p className="text-lg leading-[1.7] text-muted-foreground">
            Whether you teach or learn, Strummy adapts to your workflow.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <RoleCard title="For Teachers" items={teacherFeatures} delay={0} />
          <RoleCard title="For Students" items={studentFeatures} delay={0.1} />
        </div>
      </div>
    </section>
  );
}
