import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { getUIVersion } from '@/lib/ui-version.server';
import { redirect } from 'next/navigation';
import ProfilePageClient from './profile.client';
import { ProfileV2 } from '@/components/v2/profile';

export default async function ProfilePage() {
  const { user } = await getUserWithRolesSSR();
  if (!user) redirect('/sign-in');

  const uiVersion = await getUIVersion();

  if (uiVersion === 'v2') {
    return <ProfileV2 userId={user.id} userEmail={user.email} />;
  }

  return <ProfilePageClient userId={user.id} />;
}
