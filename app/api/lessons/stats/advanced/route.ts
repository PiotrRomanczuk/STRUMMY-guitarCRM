import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { logger } from '@/lib/logger';

interface LessonRow {
  id: string;
  student_id: string;
  status: string;
  scheduled_at: string;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
}

export async function GET(request: Request) {
  return withApiAuth(request, async ({ roles }) => {
    try {
      if (!roles.isAdmin && !roles.isTeacher) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const adminClient = createAdminClient();

      // Fetch all lessons
      const { data: lessons, error: lessonsError } = await adminClient
        .from('lessons')
        .select('id, student_id, status, scheduled_at')
        .order('scheduled_at', { ascending: true });

      if (lessonsError) {
        return NextResponse.json({ error: lessonsError.message }, { status: 500 });
      }

      // Fetch all student profiles
      const studentIds = [...new Set((lessons || []).map((l: LessonRow) => l.student_id))];
      const { data: profiles } = await adminClient
        .from('profiles')
        .select('id, full_name, email')
        .in('id', studentIds.length > 0 ? studentIds : ['__none__']);

      const profileMap = new Map((profiles || []).map((p: ProfileRow) => [p.id, p]));

      const allLessons = (lessons || []) as LessonRow[];
      const now = new Date();

      // --- Overview ---
      const totalLessons = allLessons.length;
      const uniqueStudents = new Set(allLessons.map((l) => l.student_id)).size;

      const completed = allLessons.filter((l) => l.status === 'COMPLETED');
      const cancelled = allLessons.filter((l) => l.status === 'CANCELLED');

      const completionRate = totalLessons > 0 ? (completed.length / totalLessons) * 100 : 0;
      const cancellationRate = totalLessons > 0 ? (cancelled.length / totalLessons) * 100 : 0;

      // Avg lessons per week
      const dates = allLessons.map((l) => new Date(l.scheduled_at).getTime());
      const firstDate = dates.length > 0 ? Math.min(...dates) : now.getTime();
      const lastDate = dates.length > 0 ? Math.max(...dates) : now.getTime();
      const weekSpan = Math.max(1, (lastDate - firstDate) / (7 * 24 * 60 * 60 * 1000));
      const avgLessonsPerWeek = totalLessons / weekSpan;

      // --- Monthly Trend ---
      const monthlyMap = new Map<
        string,
        { completed: number; cancelled: number; scheduled: number }
      >();
      for (const lesson of allLessons) {
        const month = lesson.scheduled_at.slice(0, 7);
        const entry = monthlyMap.get(month) || { completed: 0, cancelled: 0, scheduled: 0 };
        if (lesson.status === 'COMPLETED') entry.completed++;
        else if (lesson.status === 'CANCELLED') entry.cancelled++;
        else entry.scheduled++;
        monthlyMap.set(month, entry);
      }

      const monthlyTrend = [...monthlyMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, counts]) => ({
          month,
          ...counts,
          total: counts.completed + counts.cancelled + counts.scheduled,
        }));

      // --- Schedule Distribution ---
      const dayOfWeekCounts = Array.from({ length: 7 }, () => 0);
      const hourCounts = Array.from({ length: 24 }, () => 0);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      for (const lesson of allLessons) {
        const d = new Date(lesson.scheduled_at);
        dayOfWeekCounts[d.getDay()]++;
        hourCounts[d.getHours()]++;
      }

      const byDayOfWeek = dayOfWeekCounts.map((count, i) => ({ day: dayNames[i], count }));
      const byHourOfDay = hourCounts.map((count, i) => ({
        hour: `${i.toString().padStart(2, '0')}:00`,
        count,
      }));

      // --- Student Leaderboard ---
      const studentLessons = new Map<string, LessonRow[]>();
      for (const lesson of allLessons) {
        const existing = studentLessons.get(lesson.student_id) || [];
        existing.push(lesson);
        studentLessons.set(lesson.student_id, existing);
      }

      const studentLeaderboard = [...studentLessons.entries()]
        .map(([studentId, sLessons]) => {
          const p = profileMap.get(studentId);
          const sortedDates = sLessons.map((l) => l.scheduled_at).sort();
          const first = sortedDates[0];
          const last = sortedDates[sortedDates.length - 1];
          const spanMs = new Date(last).getTime() - new Date(first).getTime();
          const activeSpanMonths = Math.max(1, Math.round(spanMs / (30.44 * 24 * 60 * 60 * 1000)));

          return {
            name: p?.full_name || 'Unknown',
            email: p?.email || '',
            totalLessons: sLessons.length,
            firstLesson: first,
            lastLesson: last,
            activeSpanMonths,
          };
        })
        .sort((a, b) => b.totalLessons - a.totalLessons)
        .slice(0, 20);

      // --- Student Growth ---
      const firstLessonByStudent = new Map<string, string>();
      for (const lesson of allLessons) {
        const existing = firstLessonByStudent.get(lesson.student_id);
        if (!existing || lesson.scheduled_at < existing) {
          firstLessonByStudent.set(lesson.student_id, lesson.scheduled_at);
        }
      }

      const newStudentsByMonth = new Map<string, number>();
      for (const [, firstLessonDate] of firstLessonByStudent) {
        const month = firstLessonDate.slice(0, 7);
        newStudentsByMonth.set(month, (newStudentsByMonth.get(month) || 0) + 1);
      }

      const growthMonths = [...newStudentsByMonth.keys()].sort();
      let cumulative = 0;
      const studentGrowth = growthMonths.map((month) => {
        const newStudents = newStudentsByMonth.get(month) || 0;
        cumulative += newStudents;
        return { month, newStudents, cumulativeStudents: cumulative };
      });

      // --- Retention ---
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      let activeStudents = 0;
      let churnedStudents = 0;
      const lifetimes: number[] = [];

      for (const [, sLessons] of studentLessons) {
        const sortedDates = sLessons.map((l) => l.scheduled_at).sort();
        const last = new Date(sortedDates[sortedDates.length - 1]);
        const first = new Date(sortedDates[0]);
        const lifetimeMonths = Math.max(
          1,
          Math.round((last.getTime() - first.getTime()) / (30.44 * 24 * 60 * 60 * 1000))
        );
        lifetimes.push(lifetimeMonths);

        if (last >= threeMonthsAgo) {
          activeStudents++;
        } else {
          churnedStudents++;
        }
      }

      const avgLifetimeMonths =
        lifetimes.length > 0
          ? Math.round((lifetimes.reduce((a, b) => a + b, 0) / lifetimes.length) * 10) / 10
          : 0;

      const buckets = [
        { label: '1 mo', min: 0, max: 1 },
        { label: '2-3 mo', min: 2, max: 3 },
        { label: '4-6 mo', min: 4, max: 6 },
        { label: '7-12 mo', min: 7, max: 12 },
        { label: '13-24 mo', min: 13, max: 24 },
        { label: '25+ mo', min: 25, max: Infinity },
      ];

      const lifetimeHistogram = buckets.map(({ label, min, max }) => ({
        bucket: label,
        count: lifetimes.filter((l) => l >= min && l <= max).length,
      }));

      const retentionDays = [...studentLessons.values()].map((sLessons) => {
        const sorted = sLessons.map((l) => l.scheduled_at).sort();
        return (
          (new Date(sorted[sorted.length - 1]).getTime() - new Date(sorted[0]).getTime()) /
          (24 * 60 * 60 * 1000)
        );
      });
      const avgRetentionDays =
        retentionDays.length > 0
          ? Math.round(retentionDays.reduce((a, b) => a + b, 0) / retentionDays.length)
          : 0;

      return NextResponse.json({
        overview: {
          totalLessons,
          uniqueStudents,
          avgLessonsPerWeek: Math.round(avgLessonsPerWeek * 10) / 10,
          completionRate: Math.round(completionRate * 10) / 10,
          cancellationRate: Math.round(cancellationRate * 10) / 10,
          avgRetentionDays,
        },
        monthlyTrend,
        studentLeaderboard,
        scheduleDistribution: { byDayOfWeek, byHourOfDay },
        studentGrowth,
        retention: {
          avgLifetimeMonths,
          activeStudents,
          churnedStudents,
          lifetimeHistogram,
        },
      });
    } catch (error) {
      logger.error('[AdvancedLessonStats] Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  });
}
