import { CohortAnalytics } from '@/components/dashboard/cohorts';
import { CohortDashboard } from '@/components/v2/cohorts';
import { getUIVersion } from '@/lib/ui-version.server';

export const metadata = {
  title: 'Cohort Analytics | Guitar CRM',
  description: 'Compare student cohorts and identify patterns',
};

export default async function CohortsPage() {
  const uiVersion = await getUIVersion();

  if (uiVersion === 'v2') {
    return <CohortDashboard />;
  }

  return (
    <div className="container mx-auto p-6">
      <CohortAnalytics />
    </div>
  );
}
