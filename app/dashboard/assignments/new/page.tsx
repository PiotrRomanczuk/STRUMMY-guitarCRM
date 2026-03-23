import { createClient } from '@/lib/supabase/server';
import { AssignmentForm } from '@/components/assignments';
import { AssignmentForm as AssignmentFormV2 } from '@/components/v2/assignments';
import { MobilePageShell } from '@/components/v2/primitives/MobilePageShell';
import { getUIVersion } from '@/lib/ui-version.server';
import { redirect } from 'next/navigation';
import { logger } from '@/lib/logger';

interface NewAssignmentPageProps {
  searchParams: Promise<{
    templateId?: string;
    studentId?: string;
  }>;
}

export default async function NewAssignmentPage({ searchParams }: NewAssignmentPageProps) {
  const { templateId, studentId } = await searchParams;
  const [supabase, uiVersion] = await Promise.all([createClient(), getUIVersion()]);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch students
  const { data: students, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('is_student', true);

  if (error) {
    logger.error('Error fetching students:', error);
  }

  let initialData: { id: string; title: string; description: string | null; due_date: string | null; status: string; student_id: string; teacher_id: string; song_id: string | null } | undefined = undefined;

  if (templateId) {
    const { data: template } = await supabase
      .from('assignment_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (template) {
      initialData = {
        title: template.title,
        description: template.description,
        status: 'not_started' as const,
        teacher_id: user.id,
        student_id: '', // User must select student
        due_date: null,
        song_id: null,
        id: '', // New assignment
      };
    }
  }

  if (!initialData && studentId) {
    initialData = {
      title: '',
      description: null,
      due_date: null,
      status: 'not_started' as const,
      teacher_id: user.id,
      student_id: studentId,
      song_id: null,
      id: '',
    };
  }

  if (uiVersion === 'v2') {
    return (
      <MobilePageShell title="New Assignment">
        <AssignmentFormV2
          mode="create"
          students={students || []}
          initialData={initialData ? { ...initialData, id: initialData.id ?? '' } : undefined}
          teacherId={user.id}
        />
      </MobilePageShell>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <AssignmentForm
        mode="create"
        students={students || []}
        initialData={initialData ? { id: initialData.id, title: initialData.title, description: initialData.description, due_date: initialData.due_date, status: initialData.status as 'not_started', student_id: initialData.student_id, teacher_id: initialData.teacher_id } : undefined}
        userId={user.id}
      />
    </div>
  );
}
