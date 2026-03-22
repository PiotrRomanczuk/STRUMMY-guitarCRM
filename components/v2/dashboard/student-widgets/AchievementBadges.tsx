import { Star, Flame, Hexagon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Badge {
  icon: LucideIcon;
  label: string;
}

const BADGES: Badge[] = [
  { icon: Star, label: 'First Song' },
  { icon: Flame, label: '7-Day Streak' },
  { icon: Hexagon, label: 'Chord Master' },
];

/**
 * Static achievement badges with gold glow effect.
 * Displays earned milestone icons in a horizontal row.
 */
export function AchievementBadges() {
  return (
    <section>
      <h3 className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-5">
        Achievements
      </h3>
      <div className="flex gap-6">
        {BADGES.map((badge) => {
          const Icon = badge.icon;
          return (
            <div key={badge.label} className="flex flex-col items-center gap-2 group">
              <div
                className="w-14 h-14 rounded-full bg-card flex items-center justify-center
                           text-primary shadow-[0_0_10px_hsl(var(--primary)/0.1)]
                           group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)] transition-all"
              >
                <Icon className="h-6 w-6" fill="currentColor" />
              </div>
              <span className="text-[10px] text-foreground font-bold text-center leading-tight">
                {badge.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
