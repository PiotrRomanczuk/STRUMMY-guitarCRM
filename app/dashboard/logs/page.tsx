import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { redirect } from 'next/navigation';
import { getUIVersion } from '@/lib/ui-version.server';
import { LogsPageClient } from '@/components/logs/LogsPageClient';
import { LogViewerV2 } from '@/components/v2/admin';

export default async function LogsPage() {
  const { user, isAdmin, isTeacher } = await getUserWithRolesSSR();

  if (!user) {
    redirect('/sign-in');
  }

  // Only admins and teachers can view system logs
  if (!isAdmin && !isTeacher) {
    redirect('/dashboard');
  }

  const uiVersion = await getUIVersion();

  if (uiVersion === 'v2') {
    return <LogViewerV2 isAdmin={isAdmin} />;
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl">
      <LogsPageClient isAdmin={isAdmin} />
    </div>
  );
}
