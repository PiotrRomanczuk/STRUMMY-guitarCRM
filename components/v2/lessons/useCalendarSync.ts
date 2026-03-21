'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export interface SyncProgress {
  phase: 'idle' | 'connecting' | 'fetching' | 'syncing' | 'done' | 'error';
  current: number;
  total: number;
  detail: string;
  imported: number;
  skipped: number;
  updated: number;
}

const INITIAL: SyncProgress = {
  phase: 'idle',
  current: 0,
  total: 0,
  detail: '',
  imported: 0,
  skipped: 0,
  updated: 0,
};

/**
 * Streams calendar sync progress via SSE from /api/calendar-sync.
 */
export function useCalendarSync() {
  const router = useRouter();
  const [progress, setProgress] = useState<SyncProgress>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);

  const isSyncing = progress.phase !== 'idle' && progress.phase !== 'done' && progress.phase !== 'error';

  const syncCalendar = useCallback(async () => {
    if (isSyncing) return;

    setProgress({ ...INITIAL, phase: 'connecting', detail: 'Starting sync...' });
    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const res = await fetch('/api/calendar-sync', { signal: abort.signal });

      if (!res.ok || !res.body) {
        setProgress((p) => ({ ...p, phase: 'error', detail: 'Failed to connect' }));
        toast.error('Calendar sync failed to start');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const chunk of lines) {
          const dataLine = chunk.trim().replace(/^data: /, '');
          if (!dataLine) continue;
          try {
            const data = JSON.parse(dataLine);
            setProgress((prev) => ({
              phase: data.phase ?? prev.phase,
              current: data.current ?? prev.current,
              total: data.total ?? prev.total,
              detail: data.detail ?? prev.detail,
              imported: data.imported ?? prev.imported,
              skipped: data.skipped ?? prev.skipped,
              updated: data.updated ?? prev.updated,
            }));

            if (data.phase === 'done') {
              const msg = [
                data.imported && `${data.imported} imported`,
                data.updated && `${data.updated} updated`,
                data.skipped && `${data.skipped} skipped`,
              ]
                .filter(Boolean)
                .join(', ');
              toast.success(msg || 'No new lessons found');
              router.refresh();
            }

            if (data.phase === 'error') {
              toast.error(data.detail || 'Sync failed');
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setProgress((p) => ({ ...p, phase: 'error', detail: 'Connection lost' }));
        toast.error('Calendar sync connection lost');
      }
    }
  }, [isSyncing, router]);

  const cancelSync = useCallback(() => {
    abortRef.current?.abort();
    setProgress(INITIAL);
  }, []);

  const dismiss = useCallback(() => {
    setProgress(INITIAL);
  }, []);

  return { syncCalendar, cancelSync, dismiss, progress, isSyncing };
}
