'use client';

import { useQuery } from '@tanstack/react-query';
import {
  StudentHealthTable,
  StudentHealth,
} from '@/components/dashboard/health/StudentHealthTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Download, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

async function fetchStudentHealth(): Promise<StudentHealth[]> {
  const response = await fetch('/api/students/health');
  if (!response.ok) {
    throw new Error('Failed to fetch student health');
  }
  return response.json();
}

export default function HealthDashboardPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['student-health'],
    queryFn: fetchStudentHealth,
    refetchInterval: 180000, // Refetch every 3 minutes
  });

  const filteredData = data?.filter((student) => {
    if (statusFilter === 'all') return true;
    return student.healthStatus === statusFilter;
  });

  const healthyCounts = {
    excellent: data?.filter((s) => s.healthStatus === 'excellent').length || 0,
    good: data?.filter((s) => s.healthStatus === 'good').length || 0,
    needs_attention: data?.filter((s) => s.healthStatus === 'needs_attention').length || 0,
    at_risk: data?.filter((s) => s.healthStatus === 'at_risk').length || 0,
    critical: data?.filter((s) => s.healthStatus === 'critical').length || 0,
  };

  const handleExportCSV = () => {
    if (!data) return;

    const csv = [
      [
        'Student',
        'Email',
        'Health Score',
        'Status',
        'Last Lesson',
        'Lessons/Month',
        'Overdue Assignments',
        'Recommended Action',
      ],
      ...data.map((student) => [
        student.name,
        student.email,
        student.healthScore,
        student.healthStatus,
        student.lastLesson ? new Date(student.lastLesson).toLocaleDateString() : 'Never',
        student.lessonsThisMonth,
        student.overdueAssignments,
        student.recommendedAction,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-health-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <main className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Activity className="h-6 sm:h-8 w-6 sm:w-8" />
              Student Health Monitor
            </h1>
            <p className="text-muted-foreground mt-1">
              Track student engagement and identify those needing attention
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isRefetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExportCSV} disabled={!data}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Health Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Excellent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{healthyCounts.excellent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Good</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success/80">{healthyCounts.good}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Needs Attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {healthyCounts.needs_attention}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>At Risk</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning/80">{healthyCounts.at_risk}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Critical</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{healthyCounts.critical}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Filter by status:</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students</SelectItem>
              <SelectItem value="excellent">Excellent</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="needs_attention">Needs Attention</SelectItem>
              <SelectItem value="at_risk">At Risk</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          {filteredData && (
            <Badge variant="secondary">
              {filteredData.length} {filteredData.length === 1 ? 'student' : 'students'}
            </Badge>
          )}
        </div>

        {/* Health Table */}
        <Card>
          <CardHeader>
            <CardTitle>Student Health Details</CardTitle>
            <CardDescription>
              Sorted by health score (lowest first). Click actions to schedule lessons or contact
              students.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">
                Failed to load student health data
              </div>
            ) : (
              <StudentHealthTable students={filteredData || []} />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
