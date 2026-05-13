import type { WeeklySummary } from '@/types/teacher-dashboard-v2';

interface WeeklySummaryWidgetProps {
  summary: WeeklySummary;
}

interface StatTileProps {
  value: number;
  label: string;
}

function StatTile({ value, label }: StatTileProps) {
  return (
    <div className="flex flex-col items-center justify-center bg-muted/40 rounded-[10px] px-4 py-3 text-center">
      <span className="font-serif text-2xl font-normal tracking-[-0.02em] text-foreground">
        {value}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground mt-0.5">
        {label}
      </span>
    </div>
  );
}

export function WeeklySummaryWidget({ summary }: WeeklySummaryWidgetProps) {
  const { lessonsTaught, lessonsScheduled, assignmentsCreated, assignmentsCompleted } = summary;

  const summaryLine =
    lessonsTaught > 0
      ? `You've taught ${lessonsTaught} ${lessonsTaught === 1 ? 'lesson' : 'lessons'} this week.`
      : 'No lessons taught yet this week — a quiet start.';

  return (
    <section className="bg-card border border-border rounded-[14px] p-5">
      <div className="mb-3">
        <div className="font-mono text-[11px] text-muted-foreground uppercase tracking-[.14em] font-medium">
          This week
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{summaryLine}</p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <StatTile value={lessonsTaught} label="Taught" />
        <StatTile value={lessonsScheduled} label="Remaining" />
        <StatTile value={assignmentsCreated} label="Created" />
        <StatTile value={assignmentsCompleted} label="Completed" />
      </div>
    </section>
  );
}
