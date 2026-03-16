'use client';

import { CohortAnalytics } from '@/components/dashboard/cohorts';

/**
 * Desktop cohort view: reuses the existing v1 CohortAnalytics component
 * which already has a full desktop table + chart layout.
 */
export default function CohortDesktop() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <CohortAnalytics />
    </div>
  );
}
