import Link from 'next/link';
import { Calendar, ClipboardList, ChevronRight } from 'lucide-react';

interface WhatsNextCardProps {
  nextLesson: {
    id: string;
    title: string | null;
    scheduled_at: string;
  } | null;
  topAssignment: {
    id: string;
    title: string;
    due_date: string | null;
    status: string;
  } | null;
}

export function WhatsNextCard({ nextLesson, topAssignment }: WhatsNextCardProps) {
  const hasContent = nextLesson || topAssignment;

  return (
    <div className="rounded-xl bg-card border border-border/50 p-4 space-y-3">
      <h2 className="text-sm font-semibold text-primary uppercase tracking-wide">
        What&apos;s Next
      </h2>

      {!hasContent && (
        <p className="text-sm text-muted-foreground py-2">
          Nothing scheduled. Enjoy your free time!
        </p>
      )}

      {nextLesson && (
        <Link
          href={`/dashboard/lessons/${nextLesson.id}`}
          className="flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/10
                     p-3 active:bg-primary/10 transition-colors min-h-[44px]"
        >
          <div className="shrink-0 p-2 rounded-lg bg-primary/10">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {nextLesson.title || 'Upcoming Lesson'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatLessonDate(nextLesson.scheduled_at)}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </Link>
      )}

      {topAssignment && (
        <div
          className="flex items-center gap-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10
                     p-3 min-h-[44px]"
        >
          <div className="shrink-0 p-2 rounded-lg bg-yellow-500/10">
            <ClipboardList className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {topAssignment.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {topAssignment.due_date
                ? `Due ${formatShortDate(topAssignment.due_date)}`
                : 'No due date'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function formatLessonDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (days === 1) {
    return `Tomorrow at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  return date.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
}
