import Link from 'next/link';
import { Calendar, Clock, FileText } from 'lucide-react';

interface LastLessonCardProps {
  lesson: {
    id: string;
    title: string | null;
    scheduled_at: string;
    notes: string | null;
  };
}

export function LastLessonCard({ lesson }: LastLessonCardProps) {
  return (
    <section className="bg-card rounded-[10px] p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 className="text-muted-foreground text-xs font-black uppercase tracking-widest">
          Last Lesson
        </h2>
      </div>

      <div className="space-y-2">
        <h3 className="font-bold text-lg text-foreground truncate">
          {lesson.title || 'Untitled Lesson'}
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" aria-hidden="true" />
          <span>{formatRelative(lesson.scheduled_at)}</span>
        </div>
      </div>

      {lesson.notes && (
        <div className="bg-secondary rounded-lg p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <FileText className="h-3 w-3" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-widest">Notes</span>
          </div>
          <p className="text-sm text-foreground line-clamp-2">{lesson.notes}</p>
          <Link
            href={`/dashboard/lessons/${lesson.id}`}
            className="text-xs text-primary font-bold hover:underline"
          >
            Read more
          </Link>
        </div>
      )}

      {!lesson.notes && (
        <Link
          href={`/dashboard/lessons/${lesson.id}`}
          className="block text-xs text-primary font-bold hover:underline"
        >
          View lesson details
        </Link>
      )}
    </section>
  );
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
}
