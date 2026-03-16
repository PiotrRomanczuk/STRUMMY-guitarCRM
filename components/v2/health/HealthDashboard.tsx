'use client';

import { useState, lazy, Suspense, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useLayoutMode } from '@/hooks/use-is-widescreen';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import { MobilePageShell } from '@/components/v2/primitives/MobilePageShell';
import { HealthCard, type HealthCardStudent } from './HealthCard';
import { cn } from '@/lib/utils';
import { RefreshCw, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { HealthStatus } from '@/lib/utils/studentHealth';

const HealthDesktop = lazy(() => import('./HealthDashboard.Desktop'));

async function fetchStudentHealth(): Promise<HealthCardStudent[]> {
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

type FilterStatus = 'all' | HealthStatus;

const FILTERS: { label: string; value: FilterStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Critical', value: 'critical' },
  { label: 'At Risk', value: 'at_risk' },
  { label: 'Needs Attn', value: 'needs_attention' },
  { label: 'Good', value: 'good' },
  { label: 'Excellent', value: 'excellent' },
];

function HealthSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-3 animate-pulse">
          <div className="flex justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
            <div className="h-6 w-8 bg-muted rounded" />
          </div>
          <div className="h-3 bg-muted rounded w-3/4" />
        </div>
      ))}
    </div>
  );
}

function MobileHealthDashboard() {
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['student-health'],
    queryFn: fetchStudentHealth,
    refetchInterval: 180000,
    refetchOnWindowFocus: false,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const sorted = [...data].sort((a, b) => a.healthScore - b.healthScore);
    if (activeFilter === 'all') return sorted;
    return sorted.filter((s) => s.healthStatus === activeFilter);
  }, [data, activeFilter]);

  const counts = useMemo(() => {
    if (!data) return { critical: 0, at_risk: 0, needs_attention: 0 };
    return {
      critical: data.filter((s) => s.healthStatus === 'critical').length,
      at_risk: data.filter((s) => s.healthStatus === 'at_risk').length,
      needs_attention: data.filter((s) => s.healthStatus === 'needs_attention').length,
    };
  }, [data]);

  const alertCount = counts.critical + counts.at_risk;

  return (
    <MobilePageShell
      title="Student Health"
      subtitle={alertCount > 0 ? `${alertCount} need attention` : 'All students healthy'}
      headerActions={
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          disabled={isRefetching}
          aria-label="Refresh data"
          className="min-h-[44px] min-w-[44px]"
        >
          <RefreshCw className={cn('h-5 w-5', isRefetching && 'animate-spin')} />
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={cn(
                'shrink-0 h-11 min-h-[44px] px-4 rounded-full text-sm font-medium transition-colors border',
                activeFilter === f.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <HealthSkeleton />
        ) : error ? (
          <div className="text-center py-8 text-destructive text-sm">
            {error instanceof Error ? error.message : 'Failed to load health data.'}{' '}
            <button
              type="button"
              onClick={() => refetch()}
              className="underline text-primary"
            >
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold mb-1">No students found</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {activeFilter === 'all'
                ? 'Student health data will appear once lessons are scheduled.'
                : 'No students match this filter.'}
            </p>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-2"
          >
            {filtered.map((student) => (
              <motion.div key={student.id} variants={listItem}>
                <HealthCard student={student} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </MobilePageShell>
  );
}

export function HealthDashboard() {
  const mode = useLayoutMode();

  if (mode === 'mobile') return <MobileHealthDashboard />;

  return (
    <Suspense fallback={<MobileHealthDashboard />}>
      <HealthDesktop />
    </Suspense>
  );
}
