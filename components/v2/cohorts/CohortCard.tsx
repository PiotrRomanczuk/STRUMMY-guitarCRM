'use client';

import { motion } from 'framer-motion';
import { tapScale } from '@/lib/animations/variants';
import { Users } from 'lucide-react';
import { SparklineBar } from './SparklineBar';
import type { CohortData } from '@/lib/services/cohort-analytics';

interface CohortCardProps {
  cohort: CohortData;
  /** Max metric value across all cohorts (for sparkline scale) */
  maxMetric: number;
  /** Human-readable metric label */
  metricLabel: string;
  /** Metric format: 'number' | 'percent' */
  metricFormat?: 'number' | 'percent';
}

/**
 * Single cohort card with sparkline bar.
 * Shows cohort name, student count, and metric value with relative bar.
 */
export function CohortCard({
  cohort,
  maxMetric,
  metricLabel,
  metricFormat = 'number',
}: CohortCardProps) {
  const formattedValue =
    metricFormat === 'percent'
      ? `${cohort.metricValue}%`
      : cohort.metricValue.toLocaleString();

  return (
    <motion.div
      {...tapScale}
      className="bg-card rounded-xl border border-border p-4 space-y-3 active:bg-muted/50 transition-colors"
    >
      {/* Header: Name + student count */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium truncate">{cohort.cohortName}</h4>
        <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <Users className="h-3 w-3" />
          {cohort.studentCount}
        </span>
      </div>

      {/* Metric value + sparkline */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-lg font-bold">{formattedValue}</span>
          <span className="text-xs text-muted-foreground">{metricLabel}</span>
        </div>
        <SparklineBar
          value={cohort.metricValue}
          max={maxMetric}
          color={
            cohort.metricValue >= maxMetric * 0.7
              ? 'bg-green-500'
              : cohort.metricValue >= maxMetric * 0.4
                ? 'bg-primary'
                : 'bg-orange-500'
          }
        />
      </div>
    </motion.div>
  );
}
