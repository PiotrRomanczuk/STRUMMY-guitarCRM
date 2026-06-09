import '@/app/design-preview/editorial-tokens.css';

import { Fraunces, Geist, Geist_Mono } from 'next/font/google';
import { redirect } from 'next/navigation';

import { NotificationsEditorial } from '@/components/notifications/editorial/NotificationsEditorial';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { getRecentNotifications } from '@/lib/services/notifications-queries';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  weight: ['400', '500'],
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  axes: ['opsz'],
  display: 'swap',
});

export default async function NotificationsPage() {
  const { user } = await getUserWithRolesSSR();
  if (!user) {
    redirect('/sign-in?redirect=/dashboard/notifications');
  }

  const now = new Date();
  const notifications = await getRecentNotifications(user.id);

  return (
    <div className={`theme-editorial ${geist.variable} ${geistMono.variable} ${fraunces.variable}`}>
      <NotificationsEditorial notifications={notifications} now={now} />
    </div>
  );
}
