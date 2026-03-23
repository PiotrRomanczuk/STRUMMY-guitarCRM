import Link from 'next/link';
import { Music, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardRepertoireItem } from '@/app/actions/student/dashboard';
import {
  STATUS_CONFIG,
  formatPracticeTime,
  formatRelativeDate,
  getPriorityIndicator,
} from './repertoire-progress.helpers';

interface RepertoireProgressProps {
  items: DashboardRepertoireItem[];
  maxItems?: number;
}

export function RepertoireProgress({ items, maxItems = 6 }: RepertoireProgressProps) {
  const displayItems = items.slice(0, maxItems);

  if (displayItems.length === 0) {
    return (
      <section className="rounded-[10px] bg-card p-5">
        <h2 className="text-foreground font-bold text-xl mb-2">My Repertoire</h2>
        <p className="text-sm text-muted-foreground py-2">
          No songs in your repertoire yet. Ask your teacher to add some!
        </p>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-foreground font-bold text-xl">My Repertoire</h2>
        <Link
          href="/dashboard/repertoire"
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest
                     text-muted-foreground hover:text-primary transition-colors"
        >
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {displayItems.map((item) => (
          <RepertoireProgressItem key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function RepertoireProgressItem({ item }: { item: DashboardRepertoireItem }) {
  const statusConfig = STATUS_CONFIG[item.current_status] ?? STATUS_CONFIG.to_learn;
  const priority = getPriorityIndicator(item.priority);

  return (
    <Link
      href={`/dashboard/songs/${item.song_id}`}
      className="bg-card rounded-xl border border-border p-4 flex flex-col gap-2.5
                 hover:border-primary/30 active:scale-[0.98] transition-all"
    >
      {/* Row 1: Icon + song info + status */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
          <Music className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {priority.isVisible && (
              <span
                className={cn('w-2 h-2 rounded-full shrink-0', priority.className)}
                title={priority.label}
              />
            )}
            <p className="text-sm font-medium text-foreground truncate">
              {item.song_title}
            </p>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {item.song_author || 'Unknown Artist'}
          </p>
        </div>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5',
            'text-[10px] font-medium border shrink-0',
            statusConfig.className
          )}
        >
          {statusConfig.label}
        </span>
      </div>

      {/* Row 2: Practice stats */}
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatPracticeTime(item.total_practice_minutes)}
        </span>
        <span className="text-muted-foreground/40">|</span>
        <span>{formatRelativeDate(item.last_practiced_at)}</span>
        {item.self_rating !== null && (
          <>
            <span className="text-muted-foreground/40">|</span>
            <span className="text-primary font-medium">
              {item.self_rating}/5
            </span>
          </>
        )}
      </div>
    </Link>
  );
}
