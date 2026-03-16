'use client';

import { NotificationCenter as V1NotificationCenter } from '@/components/notifications/NotificationCenter';

interface NotificationCenterDesktopProps {
  userId: string;
}

/**
 * Desktop notification center view.
 * Reuses the existing v1 NotificationCenter which works well on desktop.
 */
export default function NotificationCenterDesktop({ userId }: NotificationCenterDesktopProps) {
  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 py-6 space-y-6">
      <h1 className="text-2xl lg:text-3xl font-bold">Notifications</h1>
      <V1NotificationCenter userId={userId} />
    </div>
  );
}
