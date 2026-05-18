'use client';

import { useState } from 'react';
import { ScrollText, Terminal, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { MobilePageShell } from '@/components/v2/primitives';
import { CollapsibleFilterBar } from '@/components/v2/primitives';
import { LEVEL_FILTERS, type LogEntry, type LogLevel } from './LogViewer.types';
import { LogEntryRow } from './LogViewer.EntryRow';

interface LogsResponse {
  logs: LogEntry[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

async function fetchLogs(level: string | null): Promise<LogsResponse> {
  const params = new URLSearchParams({ limit: '50' });
  if (level) params.set('level', level);
  const res = await fetch(`/api/admin/logs?${params}`);
  if (!res.ok) {
    if (res.status === 401) throw new Error('Not authenticated. Please sign in.');
    if (res.status === 403) throw new Error('Admin access required.');
    throw new Error(`Failed to load logs (HTTP ${res.status}).`);
  }
  return res.json();
}

/**
 * v2 LogViewer — admin-only persisted warn/error log viewer.
 * Data source: /api/admin/logs (backed by `system_logs` table; see ADR 0003).
 * Levels persisted: warn + error. Info/debug remain in stdout / Vercel logs.
 */
export function LogViewerV2({ isAdmin }: { isAdmin?: boolean }) {
  const [levelFilter, setLevelFilter] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-logs', levelFilter],
    queryFn: () => fetchLogs(levelFilter),
    enabled: !!isAdmin,
    refetchInterval: 15_000,
  });

  return (
    <MobilePageShell
      title="System Logs"
      subtitle={isAdmin ? 'Persisted warnings + errors' : 'Admin access required'}
    >
      <CollapsibleFilterBar
        filters={LEVEL_FILTERS}
        active={levelFilter}
        onChange={setLevelFilter}
        allLabel="All Levels"
      />

      {!isAdmin && <NotAdminState />}
      {isAdmin && error && <ErrorState message={(error as Error).message} />}
      {isAdmin && isLoading && <LoadingState />}
      {isAdmin && data && data.logs.length === 0 && <EmptyState level={levelFilter} />}
      {isAdmin && data && data.logs.length > 0 && (
        <div className="space-y-2 pt-3" data-testid="admin-logs-list">
          {data.logs.map((entry) => (
            <LogEntryRow key={entry.id} entry={normalizeLevel(entry)} />
          ))}
        </div>
      )}
    </MobilePageShell>
  );
}

function normalizeLevel(entry: LogEntry): LogEntry {
  const allowed: LogLevel[] = ['info', 'warn', 'error', 'debug'];
  return { ...entry, level: allowed.includes(entry.level) ? entry.level : 'info' };
}

function NotAdminState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <AlertCircle className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold mb-1">Admin only</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        System logs are restricted to administrators.
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="text-base font-semibold mb-1">Couldn&apos;t load logs</h3>
      <p className="text-sm text-muted-foreground max-w-xs">{message}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-2 pt-3" data-testid="admin-logs-loading">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-card rounded-xl border border-border p-4 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-muted rounded w-3/4" />
              <div className="h-2.5 bg-muted rounded w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ level }: { level: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Terminal className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold mb-1">No logs</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        {level
          ? `No ${level} entries in the persisted log stream.`
          : 'No warnings or errors persisted yet.'}
      </p>
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <ScrollText className="h-3.5 w-3.5" />
        <span>Info + debug logs stay in stdout / Vercel logs.</span>
      </div>
    </div>
  );
}
