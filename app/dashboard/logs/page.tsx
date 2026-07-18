import '@/app/editorial-tokens.css';

import { redirect } from 'next/navigation';

import { SystemLogsTable } from '@/components/admin/logs/SystemLogsTable';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { getSystemLogs, type SystemLogFilters } from '@/lib/services/system-logs-queries';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;

export default async function SystemLogsPage({ searchParams }: { searchParams: SearchParams }) {
  const { user, isAdmin } = await getUserWithRolesSSR();
  if (!user) {
    redirect('/sign-in?redirect=/dashboard/logs');
  }
  if (!isAdmin) {
    redirect('/dashboard');
  }

  const sp = await searchParams;
  const filters: SystemLogFilters = {
    level: first(sp.level),
    prefix: first(sp.prefix),
  };

  const rows = await getSystemLogs(filters);

  return <SystemLogsTable rows={rows} filters={filters} />;
}
