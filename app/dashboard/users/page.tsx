import '@/app/design-preview/editorial-tokens.css';

import { Fraunces, Geist, Geist_Mono } from 'next/font/google';
import { redirect } from 'next/navigation';

import { UsersListEditorial } from '@/components/users/editorial/UsersListEditorial';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { getUsersList, type UserListFilters } from '@/lib/services/users-list-queries';

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

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;

export default async function UsersListPage({ searchParams }: { searchParams: SearchParams }) {
  const { user, isAdmin, isTeacher, isStudent } = await getUserWithRolesSSR();
  if (!user) {
    redirect('/sign-in?redirect=/dashboard/users');
  }

  const sp = await searchParams;
  const filters: UserListFilters = {
    search: first(sp.search),
    role: first(sp.role),
    studentStatus: first(sp.studentStatus),
    active: first(sp.active),
  };

  const rows = await getUsersList({ userId: user.id, isAdmin, isTeacher, isStudent }, filters);

  return (
    <div className={`theme-editorial ${geist.variable} ${geistMono.variable} ${fraunces.variable}`}>
      <UsersListEditorial rows={rows} filters={filters} canEdit={isAdmin} />
    </div>
  );
}
