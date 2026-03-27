import { redirect } from 'next/navigation';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { SpotifyConnectClient } from './SpotifyConnectClient';

export const metadata = { title: 'Connect Spotify' };

export default async function SpotifyConnectPage() {
  const { user, isAdmin } = await getUserWithRolesSSR();
  if (!user) redirect('/sign-in');
  if (!isAdmin) redirect('/dashboard');

  return <SpotifyConnectClient />;
}
