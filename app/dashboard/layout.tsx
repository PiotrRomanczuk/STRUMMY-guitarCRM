import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { Sidebar, SidebarMobileSheet, getNavItemsForRole } from '@/components/dashboard/Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isTeacher, isStudent } = await getUserWithRolesSSR();
  if (!user) {
    redirect('/sign-in?redirect=/dashboard');
  }
  const navItems = getNavItemsForRole({ isAdmin, isTeacher, isStudent });
  return (
    <div className="bg-background flex min-h-screen w-full">
      <Sidebar isAdmin={isAdmin} isTeacher={isTeacher} isStudent={isStudent} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-2 border-b px-3 md:hidden">
          <SidebarMobileSheet items={navItems} />
          <Link href="/dashboard" className="text-sm font-semibold">
            Strummy
          </Link>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
