'use client';

import { Calendar, Users, ClipboardList, TrendingUp, Clock } from 'lucide-react';

const stats = [
  { icon: Users, label: 'Students', value: '12' },
  { icon: Calendar, label: 'This Week', value: '8 lessons' },
  { icon: ClipboardList, label: 'Due', value: '3 assignments' },
  { icon: TrendingUp, label: 'Progress', value: '+14%' },
];

const agenda = [
  { time: '10:00 AM', name: 'Emily Chen', topic: 'Fingerpicking Basics' },
  { time: '2:00 PM', name: 'Jake Wilson', topic: 'Barre Chords Practice' },
  { time: '4:30 PM', name: 'Mia Torres', topic: 'Song Review: Wonderwall' },
];

const attention = [
  { name: 'Lucas Brown', reason: 'No practice logged in 7 days' },
  { name: 'Sophia Kim', reason: '3 overdue assignments' },
];

export function LandingDashboardMockup() {
  return (
    <div className="rounded-2xl border border-border dark:border-0 bg-card landing-shadow-card overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border dark:border-muted bg-secondary/50 dark:bg-muted/40">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-destructive/60" />
          <span className="w-3 h-3 rounded-full bg-primary/60" />
          <span className="w-3 h-3 rounded-full bg-green-500/60" />
        </div>
        <span className="text-xs text-muted-foreground ml-2 font-medium">
          Strummy — Teacher Dashboard
        </span>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-secondary/60 dark:bg-muted/40 p-3">
              <div className="flex items-center gap-2 mb-1">
                <s.icon size={14} className="text-primary" />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <span className="text-lg font-bold text-foreground">{s.value}</span>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Today's Agenda */}
          <div className="rounded-xl border border-border dark:border-0 p-4 bg-card dark:bg-muted/30">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Clock size={14} className="text-primary" /> Today&apos;s Agenda
            </h4>
            <div className="space-y-2.5">
              {agenda.map((l) => (
                <div key={l.time} className="flex items-center gap-3 text-sm">
                  <span className="text-xs font-mono text-muted-foreground w-16 shrink-0">
                    {l.time}
                  </span>
                  <span className="font-medium text-foreground">{l.name}</span>
                  <span className="text-muted-foreground text-xs hidden sm:inline">
                    — {l.topic}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Needs Attention */}
          <div className="rounded-xl border border-border dark:border-0 p-4 bg-card dark:bg-muted/30">
            <h4 className="text-sm font-semibold text-foreground mb-3">Needs Attention</h4>
            <div className="space-y-2.5">
              {attention.map((s) => (
                <div key={s.name} className="text-sm">
                  <span className="font-medium text-foreground">{s.name}</span>
                  <p className="text-xs text-muted-foreground">{s.reason}</p>
                </div>
              ))}
            </div>

            {/* Mini chart */}
            <div className="mt-4 flex items-end gap-1 h-12">
              {[40, 65, 50, 80, 70, 90, 75].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-primary/70"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Weekly practice overview</p>
          </div>
        </div>
      </div>
    </div>
  );
}
