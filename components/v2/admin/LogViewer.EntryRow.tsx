'use client';

import { useState } from 'react';
import type { LogEntry } from './LogViewer.types';
import { LEVEL_CONFIG } from './LogViewer.types';

export function LogEntryRow({ entry }: { entry: LogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const config = LEVEL_CONFIG[entry.level];
  const Icon = config.icon;
  const time = new Date(entry.timestamp).toLocaleTimeString();

  return (
    <button
      type="button"
      onClick={() => entry.details && setExpanded((v) => !v)}
      className="w-full text-left bg-card rounded-xl border border-border p-4 min-h-[44px] active:bg-muted/50 transition-colors"
      aria-expanded={entry.details ? expanded : undefined}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}
        >
          <Icon className={`h-3.5 w-3.5 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-snug break-words">
            {entry.message}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">{time}</span>
            {entry.source && (
              <>
                <span className="text-xs text-muted-foreground">-</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {entry.source}
                </span>
              </>
            )}
          </div>
          {expanded && entry.details && (
            <div className="mt-2 overflow-x-auto -mx-1 px-1">
              <pre className="text-xs bg-muted/50 p-2 rounded-lg font-mono text-muted-foreground whitespace-pre min-w-0">
                {entry.details}
              </pre>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
