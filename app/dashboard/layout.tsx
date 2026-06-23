import { redirect } from 'next/navigation';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Topbar } from '@/components/dashboard/Topbar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isTeacher, isStudent } = await getUserWithRolesSSR();
  if (!user) {
    redirect('/sign-in?redirect=/dashboard');
  }

  // Onboarding gate: a user with no role hasn't finished onboarding. The
  // /auth/callback route only enforces this for the OAuth/email-code flow, so
  // password sign-ins would otherwise reach the dashboard role-less. Centralize
  // the gate here so every entry path is covered.
  if (!isAdmin && !isTeacher && !isStudent) {
    redirect('/onboarding');
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  return (
    <div className="bg-background flex min-h-screen w-full">
      <Sidebar
        email={user.email ?? ''}
        fullName={profile?.full_name ?? null}
        isAdmin={isAdmin}
        isTeacher={isTeacher}
        isStudent={isStudent}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          email={user.email ?? ''}
          fullName={profile?.full_name ?? null}
          isAdmin={isAdmin}
          isTeacher={isTeacher}
          isStudent={isStudent}
        />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
