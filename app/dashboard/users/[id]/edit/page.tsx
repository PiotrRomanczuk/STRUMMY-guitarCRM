import '@/app/editorial-tokens.css';

import { Fraunces, Geist, Geist_Mono } from 'next/font/google';
import { notFound, redirect } from 'next/navigation';

import {
  UserEditFormEditorial,
  type EditableUser,
} from '@/components/users/editorial/UserEditFormEditorial';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { createClient } from '@/lib/supabase/server';

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

export default async function UserEditPage({ params }: PageProps) {
  const { id } = await params;
  const { user, isAdmin } = await getUserWithRolesSSR();
  if (!user) {
    redirect(`/sign-in?redirect=/dashboard/users/${id}/edit`);
  }
  if (!isAdmin) {
    redirect(`/dashboard/users/${id}`);
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select(
      'id, full_name, email, phone, invite_email, is_admin, is_teacher, is_student, is_active, student_status, skill_level, instrument, start_date, avatar_color, parent_name, parent_email, lesson_day, lesson_time, lesson_duration_minutes, lesson_rate, billing_cycle, notes'
    )
    .eq('id', id)
    .single();

  if (!data) {
    notFound();
  }

  const editable: EditableUser = {
    id: data.id,
    fullName: data.full_name,
    email: data.email,
    phone: data.phone ?? null,
    isAdmin: data.is_admin ?? false,
    isTeacher: data.is_teacher ?? false,
    isStudent: data.is_student ?? false,
    isActive: data.is_active ?? true,
    studentStatus: data.student_status ?? 'active',
    studentEmail: data.invite_email ?? null,
    skillLevel: data.skill_level ?? null,
    instrument: data.instrument ?? null,
    startDate: data.start_date ?? null,
    avatarColor: data.avatar_color ?? null,
    parentName: data.parent_name ?? null,
    parentEmail: data.parent_email ?? null,
    lessonDay: data.lesson_day ?? null,
    lessonTime: data.lesson_time ?? null,
    lessonDurationMinutes: data.lesson_duration_minutes ?? null,
    lessonRate: data.lesson_rate ?? null,
    billingCycle: data.billing_cycle ?? null,
    goals: data.notes ?? null,
  };

  return (
    <div className={`theme-editorial ${geist.variable} ${geistMono.variable} ${fraunces.variable}`}>
      <UserEditFormEditorial user={editable} />
    </div>
  );
}
