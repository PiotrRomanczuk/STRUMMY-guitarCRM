import { z } from 'zod';
import { fail, ok } from '../format.js';
import { getSupabase } from '../supabase.js';

// ----------------------------------------------------------------------------
// Schemas
// ----------------------------------------------------------------------------

export const getOverviewInput = z.object({
  since_days: z.number().int().min(1).max(365).default(30),
});

export const lessonTrendsInput = z.object({
  months: z.number().int().min(1).max(24).default(6),
});

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function sinceISO(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function monthsAgoStart(months: number): Date {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCMonth(d.getUTCMonth() - (months - 1));
  return d;
}

// ----------------------------------------------------------------------------
// Handlers
// ----------------------------------------------------------------------------

export async function getOverview(input: z.infer<typeof getOverviewInput>) {
  const sb = getSupabase();
  const since = sinceISO(input.since_days);

  // All counts in parallel — service-role bypasses RLS.
  // Note: prod's student_status enum only has {active, archived}; do not query
  // for lead/trial/churned even though the schema files reference them.
  const [
    activeStudents,
    archivedStudents,
    completedLessons,
    scheduledLessons,
    cancelledLessons,
    songsTotal,
    repertoireMastered,
    repertoireActive,
  ] = await Promise.all([
    sb
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_student', true)
      .eq('student_status', 'active'),
    sb
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_student', true)
      .eq('student_status', 'archived'),
    sb
      .from('lessons')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'COMPLETED')
      .gte('scheduled_at', since)
      .is('deleted_at', null),
    sb
      .from('lessons')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'SCHEDULED')
      .gte('scheduled_at', since)
      .is('deleted_at', null),
    sb
      .from('lessons')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'CANCELLED')
      .gte('scheduled_at', since)
      .is('deleted_at', null),
    sb
      .from('songs')
      .select('id', { count: 'exact', head: true })
      .eq('is_draft', false)
      .is('deleted_at', null),
    sb
      .from('student_repertoire')
      .select('id', { count: 'exact', head: true })
      .eq('current_status', 'mastered')
      .eq('is_active', true),
    sb
      .from('student_repertoire')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),
  ]);

  const results = [
    { name: 'activeStudents', r: activeStudents },
    { name: 'archivedStudents', r: archivedStudents },
    { name: 'completedLessons', r: completedLessons },
    { name: 'scheduledLessons', r: scheduledLessons },
    { name: 'cancelledLessons', r: cancelledLessons },
    { name: 'songsTotal', r: songsTotal },
    { name: 'repertoireMastered', r: repertoireMastered },
    { name: 'repertoireActive', r: repertoireActive },
  ];
  for (const { name, r } of results) {
    if (r.error) return fail(`Failed to compute overview (${name})`, r.error.message);
  }

  const masteryRate =
    (repertoireActive.count ?? 0) > 0
      ? Math.round(((repertoireMastered.count ?? 0) / (repertoireActive.count ?? 1)) * 1000) / 10
      : 0;

  return ok({
    window_days: input.since_days,
    students: {
      active: activeStudents.count ?? 0,
      archived: archivedStudents.count ?? 0,
    },
    lessons_in_window: {
      completed: completedLessons.count ?? 0,
      scheduled: scheduledLessons.count ?? 0,
      cancelled: cancelledLessons.count ?? 0,
    },
    catalog: {
      published_songs: songsTotal.count ?? 0,
    },
    repertoire: {
      active_assignments: repertoireActive.count ?? 0,
      mastered: repertoireMastered.count ?? 0,
      mastery_rate_percent: masteryRate,
    },
  });
}

export async function lessonTrends(input: z.infer<typeof lessonTrendsInput>) {
  const sb = getSupabase();
  const start = monthsAgoStart(input.months).toISOString();

  // Fetch all lessons in window, aggregate per month in JS.
  const { data, error } = await sb
    .from('lessons')
    .select('scheduled_at, status')
    .gte('scheduled_at', start)
    .is('deleted_at', null);

  if (error) return fail('Failed to fetch lesson trends', error.message);

  type Row = { scheduled_at: string; status: string };
  const buckets = new Map<
    string,
    { month: string; completed: number; scheduled: number; cancelled: number; total: number }
  >();

  // Pre-seed every month in the window so empty months still show up.
  for (let i = 0; i < input.months; i++) {
    const d = monthsAgoStart(input.months);
    d.setUTCMonth(d.getUTCMonth() + i);
    const key = d.toISOString().slice(0, 7);
    buckets.set(key, { month: key, completed: 0, scheduled: 0, cancelled: 0, total: 0 });
  }

  for (const r of (data ?? []) as Row[]) {
    const key = r.scheduled_at.slice(0, 7);
    const b = buckets.get(key);
    if (!b) continue;
    b.total += 1;
    if (r.status === 'COMPLETED') b.completed += 1;
    else if (r.status === 'SCHEDULED') b.scheduled += 1;
    else if (r.status === 'CANCELLED') b.cancelled += 1;
  }

  const months = [...buckets.values()].sort((a, b) => a.month.localeCompare(b.month));

  return ok({
    months_window: input.months,
    months,
  });
}
