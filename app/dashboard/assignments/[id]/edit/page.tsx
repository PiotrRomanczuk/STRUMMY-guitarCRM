import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AssignmentForm } from '@/components/assignments';
import { AssignmentForm as AssignmentFormV2 } from '@/components/v2/assignments';
import { MobilePageShell } from '@/components/v2/primitives/MobilePageShell';
import { getUIVersion } from '@/lib/ui-version.server';

interface EditAssignmentPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditAssignmentPage({ params }: EditAssignmentPageProps) {
  const { id } = await params;
  const [supabase, uiVersion] = await Promise.all([createClient(), getUIVersion()]);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, is_teacher')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin && !profile?.is_teacher) {
    redirect('/dashboard/assignments');
  }

  const { data: assignment, error } = await supabase
    .from('assignments')
    .select('id, title, description, due_date, status, teacher_id, student_id')
    .eq('id', id)
    .single();

  if (error || !assignment) {
    redirect('/dashboard/assignments');
  }

  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('is_student', true);

  if (uiVersion === 'v2') {
    return (
      <MobilePageShell title="Edit Assignment">
        <AssignmentFormV2
          mode="edit"
          students={students || []}
          initialData={assignment}
          teacherId={user.id}
        />
      </MobilePageShell>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <AssignmentForm
        mode="edit"
        students={students || []}
        initialData={assignment}
        userId={user.id}
      />
    </div>
  );
}
