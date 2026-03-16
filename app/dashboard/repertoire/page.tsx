import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import UserRepertoireTab from '@/components/users/details/UserRepertoireTab';
import { RepertoirePageClient } from '@/components/v2/repertoire/RepertoirePageClient';
import { MobilePageShell } from '@/components/v2/primitives/MobilePageShell';
import { getUIVersion } from '@/lib/ui-version.server';
import type { StudentRepertoireWithSong } from '@/types/StudentRepertoire';

export default async function RepertoirePage() {
  const [supabase, uiVersion] = await Promise.all([createClient(), getUIVersion()]);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_student, is_teacher, is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_student && !profile?.is_teacher && !profile?.is_admin) {
    redirect('/dashboard');
  }

  const isTeacherView = !!profile?.is_teacher || !!profile?.is_admin;
  const viewMode = isTeacherView ? 'teacher' : 'student';

  const { data: repertoire } = await supabase
    .from('student_repertoire')
    .select(
      `
      id,
      student_id,
      song_id,
      current_status,
      priority,
      preferred_key,
      capo_fret,
      custom_strumming,
      teacher_notes,
      last_practiced_at,
      self_rating,
      self_rating_updated_at,
      song:songs!inner(id, title, author, key, level)
    `
    )
    .eq('student_id', user.id)
    .order('priority', { ascending: true });

  if (uiVersion === 'v2') {
    return (
      <MobilePageShell
        title={isTeacherView ? 'Student Repertoire' : 'My Repertoire'}
        subtitle="Rate each song to track your confidence level."
      >
        <RepertoirePageClient
          repertoire={(repertoire as unknown as StudentRepertoireWithSong[]) || []}
          userId={user.id}
          viewMode={viewMode}
        />
      </MobilePageShell>
    );
  }

  return (
    <main className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Repertoire</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All songs in your learning collection. Rate each song to track your confidence level.
          </p>
        </div>
        <UserRepertoireTab
          userId={user.id}
          repertoire={(repertoire as unknown as StudentRepertoireWithSong[]) || []}
          viewMode="student"
        />
      </div>
    </main>
  );
}
