'use client';

import { useState } from 'react';
import { ScrollText, Terminal } from 'lucide-react';
import { MobilePageShell } from '@/components/v2/primitives';
import { CollapsibleFilterBar } from '@/components/v2/primitives';
import { LEVEL_FILTERS } from './LogViewer.types';

/**
 * v2 LogViewer -- mobile-friendly log display with level filtering.
 * Displays a "coming soon" state until /api/admin/logs is implemented.
 */
export function LogViewerV2({ isAdmin }: { isAdmin?: boolean }) {
  const [levelFilter, setLevelFilter] = useState<string | null>(null);

  return (
    <MobilePageShell
      title="System Logs"
      subtitle={isAdmin ? 'All system activity' : 'Your activity logs'}
    >
      <CollapsibleFilterBar
        filters={LEVEL_FILTERS}
        active={levelFilter}
        onChange={setLevelFilter}
        allLabel="All Levels"
      />

      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Terminal className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold mb-1">Log viewer — coming soon</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {levelFilter
            ? `Filtering by "${levelFilter}" level will be available once the log API is ready.`
            : 'Real-time system logs will appear here once the logging API is connected.'}
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <ScrollText className="h-3.5 w-3.5" />
          <span>API endpoint: /api/admin/logs</span>
        </div>
      </div>
    </MobilePageShell>
  );
}
