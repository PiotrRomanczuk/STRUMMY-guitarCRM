import { UserForm } from '@/components/users';
import { UserFormV2 } from '@/components/v2/users';
import { UserFormStitch } from '@/components/v2/stitch/users';
import { getUIVersion } from '@/lib/ui-version.server';

export const metadata = {
  title: 'Create User',
  description: 'Create a new user account',
};

export default async function CreateUserPage() {
  const uiVersion = await getUIVersion();

  if (uiVersion === 'v3') {
    return <UserFormStitch />;
  }

  if (uiVersion === 'v2') {
    return <UserFormV2 />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Create User</h1>
        <p className="text-muted-foreground">Add a new user to the system</p>
      </div>
      <UserForm />
    </div>
  );
}
