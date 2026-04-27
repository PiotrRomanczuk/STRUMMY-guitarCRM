import { redirect } from 'next/navigation';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import HashtagSetManager from '@/components/content/hashtags/HashtagSetManager';

export default async function HashtagSetsPage() {
  const { user, isAdmin, isTeacher } = await getUserWithRolesSSR();
  if (!user) redirect('/sign-in');
  if (!isAdmin && !isTeacher) redirect('/dashboard');
  return <HashtagSetManager />;
}
