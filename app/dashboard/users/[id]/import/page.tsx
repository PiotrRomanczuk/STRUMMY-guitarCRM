import '@/app/design-preview/editorial-tokens.css';

import { Fraunces, Geist, Geist_Mono } from 'next/font/google';
import { notFound, redirect } from 'next/navigation';

import { SongImportForm } from '@/components/users/editorial/SongImportForm';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { getStudentProfile } from '@/lib/services/student-detail-queries';

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

type PageProps = { params: Promise<{ id: string }> };

export default async function SongImportPage({ params }: PageProps) {
  const { id } = await params;
  const { user, isAdmin, isTeacher } = await getUserWithRolesSSR();

  if (!user) redirect(`/sign-in?redirect=/dashboard/users/${id}/import`);
  if (!isAdmin && !isTeacher) redirect(`/dashboard/users/${id}`);

  const profile = await getStudentProfile(id);
  if (!profile) notFound();

  const studentName = profile.fullName ?? profile.email ?? 'Student';

  return (
    <div className={`theme-editorial ${geist.variable} ${geistMono.variable} ${fraunces.variable}`}>
      <SongImportForm studentId={id} studentName={studentName} />
    </div>
  );
}
