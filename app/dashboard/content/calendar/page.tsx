import { redirect } from 'next/navigation';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import ContentCalendar from '@/components/content/calendar/ContentCalendar';

export default async function ContentCalendarPage() {
  const { user, isAdmin, isTeacher } = await getUserWithRolesSSR();
  if (!user) redirect('/sign-in');
  if (!isAdmin && !isTeacher) redirect('/dashboard');
  return <ContentCalendar />;
}
