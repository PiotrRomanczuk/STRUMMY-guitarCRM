import { Clock } from 'lucide-react';
import type { CronJobStatus } from '@/types/health';

export function CronSection({ crons }: { crons: CronJobStatus[] }) {
  if (crons.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-base font-semibold text-foreground">
          Cron Jobs ({crons.length})
        </h2>
      </div>
      <div className="space-y-2">
        {crons.map((cron) => (
          <div
            key={cron.path}
            className="bg-card rounded-xl border border-border p-4 flex items-center justify-between min-h-[44px]"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                {cron.name}
              </p>
              <p className="text-xs text-muted-foreground font-mono truncate">
                {cron.path}
              </p>
            </div>
            <code className="text-xs bg-muted px-2 py-1 rounded font-mono shrink-0 ml-2">
              {cron.schedule}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
}
