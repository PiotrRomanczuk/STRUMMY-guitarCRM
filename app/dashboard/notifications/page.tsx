/**
 * Notifications Center Page
 *
 * Full-page view of all notifications with:
 * - Filter by read/unread status
 * - Pagination
 * - Mark all as read
 * - Real-time updates
 */

import { Metadata } from 'next';
import { NotificationCenter as V1NotificationCenter } from '@/components/notifications/NotificationCenter';
import { NotificationCenter as V2NotificationCenter } from '@/components/v2/notifications';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { getUIVersion } from '@/lib/ui-version.server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Notifications | Guitar CRM',
  description: 'View all your notifications',
};

export default async function NotificationsPage() {
  const [{ user }, uiVersion] = await Promise.all([
    getUserWithRolesSSR(),
    getUIVersion(),
  ]);

  if (!user) {
    redirect('/login');
  }

  if (uiVersion === 'v2') {
    return <V2NotificationCenter userId={user.id} />;
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-muted-foreground mt-1">
          Stay up to date with your lessons, assignments, and achievements
        </p>
      </div>

      <V1NotificationCenter userId={user.id} />
    </div>
  );
}
