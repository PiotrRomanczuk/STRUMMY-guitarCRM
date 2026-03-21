'use client';

import { Calendar, Music, TrendingUp, ClipboardList, Sparkles, Guitar } from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';

const features = [
  {
    icon: Calendar,
    title: 'Smart Lesson Management',
    desc: 'Schedule, track, and review lessons. Auto-generate lesson notes with AI. Sync with Google Calendar.',
  },
  {
    icon: Music,
    title: 'Song Library',
    desc: '1,000+ songs with tabs, chords, and sheet music. Spotify integration for instant metadata enrichment.',
  },
  {
    icon: TrendingUp,
    title: 'Student Progress Tracking',
    desc: "Visual progress charts, practice streaks, and skill tracking. See exactly where each student stands.",
  },
  {
    icon: ClipboardList,
    title: 'Assignments & Homework',
    desc: 'Create assignments with templates, set due dates, and track completion. Students see everything in their dashboard.',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Insights',
    desc: 'AI-generated lesson notes, smart song recommendations, and automated assignment generation.',
  },
  {
    icon: Guitar,
    title: 'Student Repertoire',
    desc: 'Track every song each student is learning with difficulty ratings, progress percentages, and mastery status.',
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="py-24">
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.01em] text-foreground mb-4">
            The Teacher&apos;s Toolkit
          </h2>
          <p className="text-lg leading-[1.7] text-muted-foreground max-w-2xl mx-auto">
            Everything you need to inspire and manage without overhead.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <AnimatedSection key={f.title} delay={i * 0.08}>
              <div className="group rounded-2xl glass p-6 landing-shadow-card hover:landing-shadow-card-hover transition-all duration-300 h-full">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon size={20} className="text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
