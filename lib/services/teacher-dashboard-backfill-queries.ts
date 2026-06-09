import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export type AtRiskStudent = {
  studentId: string;
  name: string | null;
  email: string | null;
  lastPracticedAt: string | null;
  daysSincePractice: number;
};

export type RosterStudent = {
  studentId: string;
  name: string | null;
  email: string | null;
  lastLessonAt: string | null;
};

export type WeekDensityDay = {
  weekday: string;
  count: number;
};

export type Utilization = {
  bookedHours: number;
  nominalHours: number;
  pct: number;
};

export type SongLibrarySummary = {
  total: number;
  recent: { id: string; title: string; author: string | null }[];
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const startOfWeek = (now: Date): Date => {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
};

export async function getAtRiskStudents(
  teacherId: string,
  now: Date,
  limit = 5
): Promise<AtRiskStudent[]> {
  const supabase = await createClient();
  const { data: lessonsData } = await supabase
    .from('lessons')
    .select('student_id')
    .eq('teacher_id', teacherId)
    .is('deleted_at', null);

  const studentIds = Array.from(new Set((lessonsData ?? []).map((r) => r.student_id as string)));
  if (studentIds.length === 0) return [];

  const { data, error } = await supabase
    .from('student_repertoire')
    .select('student_id, last_practiced_at, profiles:student_id(full_name, email)')
    .in('student_id', studentIds)
    .order('last_practiced_at', { ascending: true, nullsFirst: true });

  if (error) {
    logger.warn('[teacher-dashboard-backfill] at-risk error', { error: error.message });
    return [];
  }

  const byStudent = new Map<
    string,
    { name: string | null; email: string | null; latest: string | null }
  >();
  for (const row of data ?? []) {
    const sid = row.student_id as string;
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const latest = (row.last_practiced_at as string) ?? null;
    const existing = byStudent.get(sid);
    if (!existing) {
      byStudent.set(sid, {
        name: (profile?.full_name as string) ?? null,
        email: (profile?.email as string) ?? null,
        latest,
      });
    } else if (latest && (!existing.latest || new Date(latest) > new Date(existing.latest))) {
      existing.latest = latest;
    }
  }

  const rows: AtRiskStudent[] = [];
  for (const [studentId, info] of byStudent) {
    const daysSince = info.latest
      ? Math.floor((now.getTime() - new Date(info.latest).getTime()) / 86_400_000)
      : 999;
    if (daysSince < 7) continue;
    rows.push({
      studentId,
      name: info.name,
      email: info.email,
      lastPracticedAt: info.latest,
      daysSincePractice: daysSince,
    });
  }
  rows.sort((a, b) => b.daysSincePractice - a.daysSincePractice);
  return rows.slice(0, limit);
}

export async function getWeekDensity(teacherId: string, now: Date): Promise<WeekDensityDay[]> {
  const supabase = await createClient();
  const start = startOfWeek(now);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const { data, error } = await supabase
    .from('lessons')
    .select('scheduled_at')
    .eq('teacher_id', teacherId)
    .is('deleted_at', null)
    .gte('scheduled_at', start.toISOString())
    .lt('scheduled_at', end.toISOString());

  if (error) {
    logger.warn('[teacher-dashboard-backfill] week density error', { error: error.message });
    return DAY_NAMES.map((d) => ({ weekday: d, count: 0 }));
  }

  const counts = DAY_NAMES.map((d) => ({ weekday: d, count: 0 }));
  for (const row of data ?? []) {
    const day = new Date(row.scheduled_at as string).getDay();
    if (counts[day]) counts[day].count += 1;
  }
  return counts;
}

const NOMINAL_HOURS_PER_DAY = 8;
const DEFAULT_LESSON_MINUTES = 45;

export const calcUtilization = (density: WeekDensityDay[]): Utilization => {
  const totalLessons = density.reduce((s, d) => s + d.count, 0);
  const bookedHours = (totalLessons * DEFAULT_LESSON_MINUTES) / 60;
  const nominalHours = NOMINAL_HOURS_PER_DAY * 5;
  return {
    bookedHours,
    nominalHours,
    pct: nominalHours > 0 ? Math.round((bookedHours / nominalHours) * 100) : 0,
  };
};

export async function getTeacherRoster(teacherId: string, limit = 8): Promise<RosterStudent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('lessons')
    .select('student_id, scheduled_at, profiles:student_id(full_name, email)')
    .eq('teacher_id', teacherId)
    .is('deleted_at', null)
    .order('scheduled_at', { ascending: false })
    .limit(200);

  if (error) {
    logger.warn('[teacher-dashboard-backfill] roster error', { error: error.message });
    return [];
  }

  const seen = new Map<string, RosterStudent>();
  for (const row of data ?? []) {
    const sid = row.student_id as string;
    if (seen.has(sid)) continue;
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    seen.set(sid, {
      studentId: sid,
      name: (profile?.full_name as string) ?? null,
      email: (profile?.email as string) ?? null,
      lastLessonAt: (row.scheduled_at as string) ?? null,
    });
    if (seen.size >= limit) break;
  }
  return Array.from(seen.values());
}

export async function getSongLibrarySummary(limit = 4): Promise<SongLibrarySummary> {
  const supabase = await createClient();
  const [total, recent] = await Promise.all([
    supabase.from('songs').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase
      .from('songs')
      .select('id, title, author')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit),
  ]);

  return {
    total: total.count ?? 0,
    recent: (recent.data ?? []).map((row) => ({
      id: row.id as string,
      title: (row.title as string) ?? 'Untitled',
      author: (row.author as string) ?? null,
    })),
  };
}
