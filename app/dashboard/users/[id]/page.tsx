import { UserDetail } from '@/components/users';
import { UserDetailV2 } from '@/components/v2/users';
import { Breadcrumbs } from '@/components/shared';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { getUIVersion } from '@/lib/ui-version.server';
import { notFound } from 'next/navigation';
import { createLogger } from '@/lib/logger';
import { UserDetailTabs } from '@/components/users/details/UserDetailTabs';
import type { Lesson } from '@/components/users/details/UserDetailTabs';
import type { StudentRepertoireWithSong } from '@/types/StudentRepertoire';
import type { ParentProfile } from '@/types/ParentProfile';

const log = createLogger('UserDetailPage');

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select('full_name, email').eq('id', id).single();
  const name = data?.full_name || data?.email || 'User';
  return { title: `${name} — User Detail`, description: `View and manage ${name}'s profile` };
}

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  is_development: boolean;
  is_admin: boolean;
  is_teacher: boolean;
  is_student: boolean;
  is_shadow: boolean | null;
  is_parent: boolean;
  parent_id: string | null;
  sign_in_count: number;
}

async function fetchUserData(supabase: SupabaseClient, userId: string) {
  // Fetch lessons (map scheduled_at → date for UI compatibility)
  const { data: rawLessons } = await supabase
    .from('lessons')
    .select(
      `
      id, lesson_teacher_number, status, scheduled_at, created_at,
      student:profiles!lessons_student_id_fkey(id, full_name, email),
      teacher:profiles!lessons_teacher_id_fkey(id, full_name, email)
    `
    )
    .or(`student_id.eq.${userId},teacher_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  const lessons = (rawLessons || []).map((l) => ({
    ...l,
    lesson_number: null,
    date: l.scheduled_at ?? null,
  }));

  // Fetch assignments
  const { data: assignments } = await supabase
    .from('assignments')
    .select('id, title, description, status, due_date, created_at')
    .eq('student_id', userId)
    .order('created_at', { ascending: false });

  // Fetch repertoire from student_repertoire (single source of truth)
  const { data: repertoire, error: repertoireError } = await supabase
    .from('student_repertoire')
    .select(
      `
      id, student_id, song_id, current_status, started_at, mastered_at,
      difficulty_rating, total_practice_minutes, practice_session_count,
      last_practiced_at, teacher_notes, student_notes, preferred_key,
      custom_strumming, assigned_by, sort_order, is_active, priority,
      self_rating, self_rating_updated_at, created_at, updated_at,
      song:songs!inner (
        id, title, author, level, key, capo_fret, strumming_pattern
      )
    `
    )
    .eq('student_id', userId)
    .order('current_status', { ascending: true });

  if (repertoireError) {
    log.error('Repertoire fetch error', { error: repertoireError });
  }

  // Map joined song (Supabase returns array for !inner joins)
  const mappedRepertoire: StudentRepertoireWithSong[] = (repertoire || []).map(
    (row: Record<string, unknown>) => ({
      ...row,
      song: Array.isArray(row.song) ? row.song[0] : row.song,
    })
  ) as StudentRepertoireWithSong[];

  log.debug('User data fetched', {
    lessons: lessons?.length,
    assignments: assignments?.length,
    repertoire: mappedRepertoire.length,
  });

  return { lessons: lessons ?? [], assignments, repertoire: mappedRepertoire };
}

export default async function UserDetailPage({ params, searchParams }: UserDetailPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const userId = id;
  const activeTab = (resolvedSearchParams.tab as string) || 'overview';

  const currentUser = await getUserWithRolesSSR();
  if (!currentUser) {
    notFound();
  }

  const supabase = await createClient();

  const { data: user, error } = await supabase
    .from('profiles')
    .select(
      'id, email, full_name, avatar_url, notes, created_at, updated_at, is_development, is_admin, is_teacher, is_student, is_shadow, is_parent, parent_id, sign_in_count'
    )
    .eq('id', userId)
    .single();

  if (error || !user) {
    notFound();
  }

  // Fetch parent profile if this is a student with a linked parent
  const parentFetch = user.parent_id
    ? supabase.from('profiles').select('id, full_name, email').eq('id', user.parent_id).single()
    : Promise.resolve({ data: null });

  // Fetch linked students if this is a parent profile
  const linkedStudentsFetch = user.is_parent
    ? supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('parent_id', user.id)
        .eq('is_student', true)
    : Promise.resolve({ data: [] });

  const [
    { data: parentProfile },
    { data: linkedStudents },
    { lessons, assignments, repertoire },
    uiVersion,
  ] = await Promise.all([
    parentFetch,
    linkedStudentsFetch,
    fetchUserData(supabase, userId),
    getUIVersion(),
  ]);

  const userName = user.full_name || user.email || 'User';

  if (uiVersion === 'v2') {
    return (
      <UserDetailV2
        user={user as UserProfile}
        tabsData={{
          userId,
          lessons: lessons as unknown as Lesson[],
          assignments: assignments || [],
          repertoire,
        }}
        parentProfile={parentProfile as ParentProfile | null}
        linkedStudents={(linkedStudents ?? []) as ParentProfile[]}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Users', href: '/dashboard/users' },
          { label: userName },
        ]}
      />

      <UserDetail
        user={user as UserProfile}
        parentProfile={parentProfile as ParentProfile | null}
        linkedStudents={(linkedStudents ?? []) as ParentProfile[]}
      />

      <UserDetailTabs
        userId={userId}
        activeTab={activeTab}
        lessons={lessons as unknown as Lesson[]}
        assignments={assignments || []}
        repertoire={repertoire}
        parentProfile={
          parentProfile as { id: string; full_name: string | null; email: string } | null
        }
      />
    </div>
  );
}
