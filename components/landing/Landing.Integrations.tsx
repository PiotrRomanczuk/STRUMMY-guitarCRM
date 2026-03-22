'use client';

import { Calendar, Music, Mail, FolderOpen } from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';

const integrations = [
  { icon: Calendar, name: 'Google Calendar', desc: 'Auto-sync lessons' },
  { icon: Music, name: 'Spotify', desc: 'Song metadata' },
  { icon: Mail, name: 'Gmail', desc: 'Student comms' },
  { icon: FolderOpen, name: 'Google Drive', desc: 'Sheet music storage' },
];

export function LandingIntegrations() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.01em] text-foreground mb-4">
            Works with tools you already use
          </h2>
          <p className="text-lg leading-[1.7] text-muted-foreground">
            Seamless integrations, zero friction.
          </p>
        </AnimatedSection>

        <div className="flex flex-wrap items-center justify-center gap-8 max-w-3xl mx-auto">
          {integrations.map((int, i) => (
            <AnimatedSection key={int.name} delay={i * 0.08}>
              <div className="flex flex-col items-center gap-2 w-36">
                <div className="w-14 h-14 rounded-2xl bg-secondary dark:bg-card flex items-center justify-center">
                  <int.icon size={24} className="text-muted-foreground dark:text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground">{int.name}</span>
                <span className="text-xs text-muted-foreground">{int.desc}</span>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
