/**
 * Student Activity Widget
 *
 * Displays student engagement metrics and at-risk students
 * Shows students approaching inactivity (21-28 days without lesson)
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingDown, TrendingUp, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

interface AtRiskStudent {
  id: string;
  email: string;
  full_name: string | null;
  days_since_last_lesson: number;
  last_completed_lesson: string | null;
  has_future_lesson: boolean;
}

interface ActivityMetrics {
  totalActive: number;
  totalInactive: number;
  atRisk: number;
  recentlyReactivated: number;
}

export function StudentActivityWidget() {
  const [metrics, setMetrics] = useState<ActivityMetrics>({
    totalActive: 0,
    totalInactive: 0,
    atRisk: 0,
    recentlyReactivated: 0,
  });
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivityData();
  }, []);

  async function loadActivityData() {
    const supabase = createClient();

    try {
      // Get all students with counts by status
      const { data: students } = await supabase
        .from('profiles')
        .select('id, email, full_name, student_status, status_changed_at')
        .eq('is_student', true)
        .is('deleted_at', null);

      if (!students) return;

      const activeCount = students.filter((s) => s.student_status === 'active').length;
      const inactiveCount = students.filter((s) => s.student_status === 'archived').length;

      // Get recently reactivated (status changed in last 7 days to 'active')
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const reactivatedCount = students.filter(
        (s) =>
          s.student_status === 'active' &&
          s.status_changed_at &&
          new Date(s.status_changed_at) >= sevenDaysAgo
      ).length;

      // Get at-risk students (active but approaching 28 days)
      const atRiskData: AtRiskStudent[] = [];

      for (const student of students.filter((s) => s.student_status === 'active')) {
        const { data: lastLesson } = await supabase
          .from('lessons')
          .select('scheduled_at')
          .eq('student_id', student.id)
          .eq('status', 'COMPLETED')
          .is('deleted_at', null)
          .order('scheduled_at', { ascending: false })
          .limit(1)
          .single();

        const { data: futureLesson } = await supabase
          .from('lessons')
          .select('id')
          .eq('student_id', student.id)
          .eq('status', 'SCHEDULED')
          .gte('scheduled_at', new Date().toISOString())
          .is('deleted_at', null)
          .limit(1)
          .single();

        if (lastLesson) {
          const daysSince = Math.floor(
            (Date.now() - new Date(lastLesson.scheduled_at).getTime()) / (1000 * 60 * 60 * 24)
          );

          // At risk: 21-27 days without lesson and no future lesson scheduled
          if (daysSince >= 21 && daysSince < 28 && !futureLesson) {
            atRiskData.push({
              id: student.id,
              email: student.email,
              full_name: student.full_name,
              days_since_last_lesson: daysSince,
              last_completed_lesson: lastLesson.scheduled_at,
              has_future_lesson: !!futureLesson,
            });
          }
        }
      }

      // Sort at-risk by days descending (most urgent first)
      atRiskData.sort((a, b) => b.days_since_last_lesson - a.days_since_last_lesson);

      setMetrics({
        totalActive: activeCount,
        totalInactive: inactiveCount,
        atRisk: atRiskData.length,
        recentlyReactivated: reactivatedCount,
      });

      setAtRiskStudents(atRiskData);
    } catch (error) {
      logger.error('Failed to load activity data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Activity</CardTitle>
        <CardDescription>Engagement tracking based on lesson completion</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard
            label="Active"
            value={metrics.totalActive}
            icon={<TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />}
          />
          <MetricCard
            label="Inactive"
            value={metrics.totalInactive}
            icon={<TrendingDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />}
          />
          <MetricCard
            label="At Risk"
            value={metrics.atRisk}
            icon={<AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
          />
          <MetricCard
            label="Reactivated (7d)"
            value={metrics.recentlyReactivated}
            icon={<TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
          />
        </div>

        {/* At-Risk Students List */}
        {atRiskStudents.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              At-Risk Students (21-27 days)
            </h3>
            <div className="space-y-2">
              {atRiskStudents.slice(0, 5).map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <div className="flex-1">
                    <div className="font-medium">{student.full_name || student.email}</div>
                    {student.last_completed_lesson && (
                      <div className="text-xs text-muted-foreground">
                        Last lesson: {new Date(student.last_completed_lesson).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="ml-2">
                    <Clock className="mr-1 h-3 w-3" />
                    {student.days_since_last_lesson}d
                  </Badge>
                </div>
              ))}
              {atRiskStudents.length > 5 && (
                <div className="text-xs text-muted-foreground text-center pt-2">
                  +{atRiskStudents.length - 5} more students at risk
                </div>
              )}
            </div>
          </div>
        )}

        {atRiskStudents.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-4">
            No students at risk of becoming inactive
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold">{value}</div>
        {icon}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
