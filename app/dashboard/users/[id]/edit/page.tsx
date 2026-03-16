import { createClient } from '@/lib/supabase/server';
import { UserForm } from '@/components/users';
import { UserFormV2 } from '@/components/v2/users';
import { getUIVersion } from '@/lib/ui-version.server';

export const metadata = {
  title: 'Edit User',
  description: 'Edit user information',
};

interface EditUserPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  is_admin: boolean;
  is_teacher: boolean;
  is_student: boolean;
  is_parent: boolean;
  is_active: boolean | null;
  is_shadow: boolean | null;
  parent_id: string | null;
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [userResult, parentsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, full_name, is_admin, is_teacher, is_student, is_parent, is_active, is_shadow, parent_id')
      .eq('id', id)
      .single(),
    supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('is_parent', true)
      .order('full_name', { ascending: true }),
  ]);

  if (userResult.error || !userResult.data) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
        User not found
      </div>
    );
  }

  const user = userResult.data;
  // Exclude the user being edited from the available parents list
  const availableParents = (parentsResult.data ?? [])
    .filter((p) => p.id !== id)
    .map((p) => ({ id: p.id, label: p.full_name || p.email || p.id }));

  const transformedUser = transformUser(user);
  const uiVersion = await getUIVersion();

  if (uiVersion === 'v2') {
    return (
      <UserFormV2
        initialData={transformedUser}
        isEdit={true}
        availableParents={availableParents}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Edit User</h1>
        <p className="text-muted-foreground">Update user information</p>
      </div>
      <UserForm initialData={transformedUser} isEdit={true} availableParents={availableParents} />
    </div>
  );
}

function transformUser(user: ProfileRow) {
  const { firstName, lastName } = getNameParts(user);

  return {
    id: user.id,
    firstName,
    lastName,
    email: user.email,
    username: null,
    isAdmin: user.is_admin ?? false,
    isTeacher: user.is_teacher ?? false,
    isStudent: user.is_student ?? false,
    isParent: user.is_parent ?? false,
    isActive: user.is_active ?? true,
    parentId: user.parent_id,
  };
}

function getNameParts(user: ProfileRow) {
  if (user.full_name) {
    const parts = user.full_name.split(' ');
    return {
      firstName: parts[0] ?? null,
      lastName: parts.slice(1).join(' ') || null,
    };
  }
  return { firstName: null, lastName: null };
}
