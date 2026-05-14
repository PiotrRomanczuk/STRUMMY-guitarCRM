'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface AgendaItem {
  id: string;
  type: 'lesson' | 'assignment' | 'task';
  title: string;
  time?: string;
  studentName?: string;
  status: 'upcoming' | 'completed' | 'overdue';
}

/**
 * Subscribes to Supabase Realtime changes on the `lessons` and `assignments`
 * tables and triggers a router.refresh() (debounced 1 s) so Next.js
 * re-fetches the server-rendered data whenever something changes today.
 *
 * Returns the items array — initially `initialItems`, unchanged while the
 * server re-hydrates after the refresh.
 *
 * Gracefully no-ops when the Supabase client is unavailable (e.g. test env).
 */
export function useDashboardAgendaRealtime(initialItems: AgendaItem[]): AgendaItem[] {
  const [items] = useState<AgendaItem[]>(initialItems);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRefresh = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      router.refresh();
    }, 1000);
  };

  useEffect(() => {
    let supabase: ReturnType<typeof createClient> | null = null;

    try {
      supabase = createClient();
    } catch {
      // createClient() throws when env vars are missing (e.g. test env) — no-op.
      return;
    }

    if (!supabase) return;

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const channel = supabase
      .channel('dashboard-agenda-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lessons' }, (payload) => {
        // Only react to lessons that are scheduled today.
        const record = (payload.new ?? payload.old) as Record<string, unknown>;
        const scheduledAt = typeof record?.scheduled_at === 'string' ? record.scheduled_at : '';
        if (!scheduledAt || !scheduledAt.startsWith(today)) return;
        scheduleRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, (payload) => {
        // React to assignments with a due date of today.
        const record = (payload.new ?? payload.old) as Record<string, unknown>;
        const dueDate = typeof record?.due_date === 'string' ? record.due_date : '';
        if (!dueDate || !dueDate.startsWith(today)) return;
        scheduleRefresh();
      })
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase?.removeChannel(channel).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return items;
}
