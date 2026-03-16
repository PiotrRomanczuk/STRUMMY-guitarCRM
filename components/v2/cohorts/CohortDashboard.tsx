'use client';

import { useState, lazy, Suspense, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLayoutMode } from '@/hooks/use-is-widescreen';
import { useCohortAnalytics } from '@/components/dashboard/cohorts/useCohortAnalytics';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import { MobilePageShell } from '@/components/v2/primitives/MobilePageShell';
import { CohortCard } from './CohortCard';
import { cn } from '@/lib/utils';
import { Layers } from 'lucide-react';
import type {
  CohortDimension,
  CohortMetric,
} from '@/lib/services/cohort-analytics';

const CohortDesktop = lazy(() => import('./CohortDashboard.Desktop'));

const DIMENSIONS: { label: string; value: CohortDimension }[] = [
  { label: 'Enrollment', value: 'enrollment_period' },
  { label: 'Status', value: 'status' },
  { label: 'Frequency', value: 'lesson_frequency' },
];

const METRICS: { label: string; value: CohortMetric; format: 'number' | 'percent' }[] = [
  { label: 'Mastery Rate', value: 'mastery_rate', format: 'percent' },
  { label: 'Completion', value: 'completion_rate', format: 'percent' },
  { label: 'Retention', value: 'retention_rate', format: 'percent' },
  { label: 'Lessons', value: 'lessons_completed', format: 'number' },
];

function CohortSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-3 animate-pulse">
          <div className="flex justify-between">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-3 bg-muted rounded w-12" />
          </div>
          <div className="h-2 bg-muted rounded w-full" />
        </div>
      ))}
    </div>
  );
}

function MobileCohortDashboard() {
  const [dimension, setDimension] = useState<CohortDimension>('enrollment_period');
  const [metric, setMetric] = useState<CohortMetric>('mastery_rate');

  const { data, isLoading, error } = useCohortAnalytics({ dimension, metric });

  const activeMetricDef = METRICS.find((m) => m.value === metric);
  const maxMetric = useMemo(() => {
    if (!data?.cohorts.length) return 1;
    return Math.max(...data.cohorts.map((c) => c.metricValue), 1);
  }, [data]);

  return (
    <MobilePageShell
      title="Cohorts"
      subtitle={data ? `${data.overall.totalStudents} total students` : 'Compare student groups'}
    >
      <div className="space-y-4">
        {/* Dimension filter chips */}
        <div>
          <span className="text-xs font-medium text-muted-foreground mb-1.5 block px-1">
            Group by
          </span>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
            {DIMENSIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDimension(d.value)}
                className={cn(
                  'shrink-0 h-11 min-h-[44px] px-4 rounded-full text-sm font-medium transition-colors border',
                  dimension === d.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border',
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Metric filter chips */}
        <div>
          <span className="text-xs font-medium text-muted-foreground mb-1.5 block px-1">
            Metric
          </span>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
            {METRICS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMetric(m.value)}
                className={cn(
                  'shrink-0 h-11 min-h-[44px] px-4 rounded-full text-sm font-medium transition-colors border',
                  metric === m.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border',
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        {data && !isLoading && (
          <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground">Average</span>
              <div className="text-xl font-bold">
                {activeMetricDef?.format === 'percent'
                  ? `${data.overall.averageMetric}%`
                  : data.overall.averageMetric.toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground">Cohorts</span>
              <div className="text-xl font-bold">{data.cohorts.length}</div>
            </div>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <CohortSkeleton />
        ) : error ? (
          <div className="text-center py-8 text-destructive text-sm">
            Failed to load cohort data
          </div>
        ) : !data || data.cohorts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Layers className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold mb-1">No cohort data</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Cohort data will appear once students have lessons and progress data.
            </p>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-2"
          >
            {data.cohorts.map((cohort) => (
              <motion.div key={cohort.cohortId} variants={listItem}>
                <CohortCard
                  cohort={cohort}
                  maxMetric={maxMetric}
                  metricLabel={activeMetricDef?.label ?? ''}
                  metricFormat={activeMetricDef?.format}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </MobilePageShell>
  );
}

export function CohortDashboard() {
  const mode = useLayoutMode();

  if (mode === 'mobile') return <MobileCohortDashboard />;

  return (
    <Suspense fallback={<MobileCohortDashboard />}>
      <CohortDesktop />
    </Suspense>
  );
}
