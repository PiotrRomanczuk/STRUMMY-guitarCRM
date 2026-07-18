import { redirect } from 'next/navigation';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { DebugDashboardClient } from './DebugDashboardClient';

export const metadata = { title: 'System Debug' };

export default async function AdminDebugPage() {
  const { user, isAdmin } = await getUserWithRolesSSR();

  if (!user) redirect('/sign-in?redirect=/dashboard/admin/debug');
  if (!isAdmin) redirect('/dashboard');

  return <DebugDashboardClient />;
}
