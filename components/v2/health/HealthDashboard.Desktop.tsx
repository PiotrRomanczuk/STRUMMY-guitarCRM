'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  StudentHealthTable,
  type StudentHealth,
} from '@/components/dashboard/health/StudentHealthTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { HealthStatus } from '@/lib/utils/studentHealth';

async function fetchStudentHealth(): Promise<StudentHealth[]> {
  const response = await fetch('/api/students/health');
  if (!response.ok) {
    const status = response.status;
    if (status === 401) throw new Error('Not authenticated. Please sign in.');
    if (status === 403) throw new Error('You do not have permission to view health data.');
    if (status >= 500) throw new Error('Server error. Please try again later.');
    throw new Error(`Failed to load health data (HTTP ${status}).`);
  }
  return response.json();
}

const STATUS_ITEMS: { key: HealthStatus; label: string; color: string }[] = [
  { key: 'excellent', label: 'Excellent', color: 'text-green-600 dark:text-green-400' },
  { key: 'good', label: 'Good', color: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'needs_attention', label: 'Needs Attention', color: 'text-yellow-600 dark:text-yellow-400' },
  { key: 'at_risk', label: 'At Risk', color: 'text-orange-600 dark:text-orange-400' },
  { key: 'critical', label: 'Critical', color: 'text-red-600 dark:text-red-400' },
];

export default function HealthDesktop() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['student-health'],
    queryFn: fetchStudentHealth,
    refetchInterval: 180000,
    refetchOnWindowFocus: false,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    if (statusFilter === 'all') return data;
    return data.filter((s) => s.healthStatus === statusFilter);
  }, [data, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of STATUS_ITEMS) {
      counts[item.key] = data?.filter((s) => s.healthStatus === item.key).length ?? 0;
    }
    return counts;
  }, [data]);

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-8 w-8" />
            Student Health Monitor
          </h1>
          <p className="text-muted-foreground mt-1">
            Track student engagement and identify at-risk students
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-4">
        {STATUS_ITEMS.map((item) => (
          <Card
            key={item.key}
            className="cursor-pointer hover:border-primary/30 transition-all"
            onClick={() => setStatusFilter(statusFilter === item.key ? 'all' : item.key)}
          >
            <CardHeader className="pb-2">
              <CardDescription>{item.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${item.color}`}>
                {statusCounts[item.key] ?? 0}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter indicator */}
      {statusFilter !== 'all' && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtering by:</span>
          <Badge variant="secondary">{statusFilter.replace('_', ' ')}</Badge>
          <Button variant="ghost" size="sm" onClick={() => setStatusFilter('all')}>
            Clear
          </Button>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Health Details</CardTitle>
          <CardDescription>Sorted by health score (lowest first)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              Failed to load student health data
            </div>
          ) : (
            <StudentHealthTable students={filtered} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
