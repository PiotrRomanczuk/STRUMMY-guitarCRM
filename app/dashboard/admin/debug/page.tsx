import { redirect } from 'next/navigation';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { getUIVersion } from '@/lib/ui-version.server';
import { DebugDashboardClient } from './DebugDashboardClient';
import { HealthCheckV2 } from '@/components/v2/admin';

export const metadata = { title: 'System Debug' };

export default async function AdminDebugPage() {
  const { user, isAdmin } = await getUserWithRolesSSR();

  if (!user) redirect('/sign-in');
  if (!isAdmin) redirect('/dashboard');

  const uiVersion = await getUIVersion();

  if (uiVersion === 'v2') {
    return <HealthCheckV2 />;
  }

  return <DebugDashboardClient />;
}
