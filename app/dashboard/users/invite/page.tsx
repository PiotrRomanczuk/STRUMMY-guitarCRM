import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { InviteFlow } from '@/components/v2/users';
import { AddStudentStitch } from '@/components/v2/stitch/users';
import { getUIVersion } from '@/lib/ui-version.server';

export const metadata = {
  title: 'Add Student',
  description: 'Quick invite flow for adding a new student',
};

export default async function InvitePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, is_teacher')
    .eq('id', user.id)
    .single();

  // Only admins and teachers can invite students
  if (!profile?.is_admin && !profile?.is_teacher) {
    redirect('/dashboard');
  }

  const uiVersion = await getUIVersion();

  if (uiVersion === 'v3') {
    return <AddStudentStitch />;
  }

  return <InviteFlow />;
}
