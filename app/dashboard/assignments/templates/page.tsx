import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TemplateList from '@/components/assignments/templates/TemplateList';
import { TemplateList as TemplateListV2 } from '@/components/v2/assignments';
import { MobilePageShell } from '@/components/v2/primitives/MobilePageShell';
import { getUIVersion } from '@/lib/ui-version.server';
import Link from 'next/link';
import { logger } from '@/lib/logger';

export default async function TemplatesPage() {
  const [supabase, uiVersion] = await Promise.all([createClient(), getUIVersion()]);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is teacher or admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, is_teacher')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin && !profile?.is_teacher) {
    redirect('/dashboard');
  }

  // Fetch templates
  let query = supabase
    .from('assignment_templates')
    .select('*')
    .order('created_at', { ascending: false });

  // If not admin, only show own templates
  if (!profile.is_admin) {
    query = query.eq('teacher_id', user.id);
  }

  const { data: templates, error } = await query;

  if (error) {
    logger.error('Error fetching templates:', error);
  }

  if (uiVersion === 'v2') {
    return (
      <MobilePageShell title="Assignment Templates">
        <TemplateListV2 templates={(templates || []) as import('@/schemas/AssignmentTemplateSchema').AssignmentTemplate[]} />
      </MobilePageShell>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-foreground">Assignment Templates</h1>
          <p className="mt-2 text-sm text-muted-foreground">A list of reusable assignment templates.</p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/dashboard/assignments/templates/new"
            className="block rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Create Template
          </Link>
        </div>
      </div>
      <TemplateList templates={templates || []} />
    </div>
  );
}
