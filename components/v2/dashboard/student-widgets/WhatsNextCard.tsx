import Link from 'next/link';

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
    <div className="rounded-[10px] bg-card border-l-4 border-primary p-5 space-y-4">
      {!hasContent && (
        <p className="text-sm text-muted-foreground py-2">
          Nothing scheduled. Enjoy your free time!
        </p>
      )}

      {nextLesson && (
        <Link
          href={`/dashboard/lessons/${nextLesson.id}`}
          className="block active:opacity-80 transition-opacity"
        >
          <p className="text-primary font-bold text-lg mb-0.5">
            {formatLessonDate(nextLesson.scheduled_at)}
          </p>
          <p className="text-muted-foreground text-sm mb-4">
            {nextLesson.title || 'Upcoming Lesson'}
          </p>
          <button className="w-full bg-gradient-to-r from-primary to-warning
                             text-primary-foreground font-bold py-3 rounded-[10px] text-sm
                             hover:opacity-90 transition-opacity active:scale-95">
            Join Lesson
          </button>
        </Link>
      )}

      {topAssignment && (
        <div className="bg-secondary p-4 rounded-lg">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">
            Current Focus
          </p>
          <p className="text-foreground font-bold">{topAssignment.title}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {topAssignment.due_date
              ? `Due ${formatShortDate(topAssignment.due_date)}`
              : 'No due date'}
          </p>
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
