import { redirect } from 'next/navigation';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { NotificationPreferences } from '@/components/settings/NotificationPreferences';

export const metadata = {
  title: 'Notification preferences',
};

export default async function Page() {
  const { user } = await getUserWithRolesSSR();
  if (!user) {
    redirect('/sign-in?redirect=/dashboard/settings/notifications');
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
          Choose which updates you receive and how.
        </p>
      </div>
      <NotificationPreferences userId={user.id} />
    </div>
  );
}
