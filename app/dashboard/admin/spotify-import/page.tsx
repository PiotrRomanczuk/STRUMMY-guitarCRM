import { redirect } from 'next/navigation';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { SpotifyImportDebug } from './SpotifyImportDebug';

export const metadata = { title: 'Spotify Import Debug' };

export default async function SpotifyImportPage() {
  const { user, isAdmin, isTeacher } = await getUserWithRolesSSR();

  if (!user) redirect('/sign-in');
  if (!isAdmin && !isTeacher) redirect('/dashboard');

  return <SpotifyImportDebug />;
}
