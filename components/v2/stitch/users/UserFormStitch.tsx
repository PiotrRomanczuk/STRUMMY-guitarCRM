'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, Settings, Shield } from 'lucide-react';
import { useUserFormState } from '@/components/users/hooks/useUserFormState';
import {
  StitchFormShell,
  StitchSection,
  StitchFieldLabel,
  StitchInput,
  StitchFormActions,
  StitchAlert,
} from '@/components/v2/stitch';
import { UserFormAvatar } from './UserFormStitch.Avatar';
import { UserFormRoles } from './UserFormStitch.Roles';
import { UserFormStatus } from './UserFormStitch.Status';
import type { AvailableParent } from '@/components/users/form/UserForm';

interface UserFormStitchProps {
  initialData?: {
    id: string | number;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    username: string | null;
    isAdmin: boolean;
    isTeacher: boolean | null;
    isStudent: boolean | null;
    isParent?: boolean | null;
    isActive: boolean;
    parentId?: string | null;
  };
  isEdit?: boolean;
  availableParents?: AvailableParent[];
}

export function UserFormStitch({ initialData, isEdit }: UserFormStitchProps) {
  const router = useRouter();
  const {
    formData,
    loading,
    error,
    validationErrors,
    handleChange,
    handleBlur,
    handleSubmit,
    setFormData,
  } = useUserFormState(initialData, isEdit);

  const handleFieldChange = useCallback(
    (field: string) => (value: string) => {
      handleChange({
        target: { name: field, value, type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    },
    [handleChange]
  );

  const handleRoleToggle = useCallback(
    (role: string, value: boolean) => {
      setFormData((prev) => ({ ...prev, [role]: value }));
    },
    [setFormData]
  );

  const goToUsers = () => router.push('/dashboard/users');

  return (
    <form onSubmit={handleSubmit}>
      <StitchFormShell title={isEdit ? 'Edit User' : 'New User'} onClose={goToUsers}>
        <UserFormAvatar />

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
            {isEdit ? 'Edit Profile' : 'Create Profile'}
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Fill in the professional details for the new member of the guitar studio.
          </p>
        </div>

        {error && (
          <div className="mb-4">
            <StitchAlert variant="warning" message={error} />
          </div>
        )}

        <div className="space-y-4">
          {/* Personal Information */}
          <StitchSection
            icon={<User className="h-5 w-5" />}
            title="PERSONAL INFORMATION"
            collapsible={false}
          >
            <div className="space-y-4 mt-2">
              <div>
                <StitchFieldLabel label="First Name" required />
                <StitchInput
                  id="firstName"
                  value={formData.firstName}
                  placeholder="e.g. Julian"
                  onChange={handleFieldChange('firstName')}
                  onBlur={() => handleBlur('firstName')}
                  error={validationErrors.firstName}
                />
              </div>
              <div>
                <StitchFieldLabel label="Last Name" />
                <StitchInput
                  id="lastName"
                  value={formData.lastName}
                  placeholder="e.g. Bream"
                  onChange={handleFieldChange('lastName')}
                  onBlur={() => handleBlur('lastName')}
                  error={validationErrors.lastName}
                />
              </div>
              <div>
                <StitchFieldLabel label="Email" required />
                <StitchInput
                  id="email"
                  type="email"
                  value={formData.email}
                  placeholder="julian@strings-studio.com"
                  onChange={handleFieldChange('email')}
                  onBlur={() => handleBlur('email')}
                  error={validationErrors.email}
                />
              </div>
            </div>
          </StitchSection>

          {/* Account Settings */}
          <StitchSection
            icon={<Settings className="h-5 w-5" />}
            title="ACCOUNT SETTINGS"
            collapsible={false}
          >
            <div className="space-y-4 mt-2">
              <div>
                <StitchFieldLabel label="Username" />
                <div className="relative [&_input]:pl-8">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-stone-400 dark:text-stone-500 select-none z-10">
                    @
                  </span>
                  <StitchInput
                    id="username"
                    value={formData.username}
                    placeholder="username"
                    onChange={handleFieldChange('username')}
                    onBlur={() => handleBlur('username')}
                    error={validationErrors.username}
                  />
                </div>
              </div>
              <div>
                <StitchFieldLabel label="Roles" />
                <UserFormRoles
                  isStudent={formData.isStudent}
                  isTeacher={formData.isTeacher}
                  isAdmin={formData.isAdmin}
                  isParent={formData.isParent}
                  onToggle={handleRoleToggle}
                />
              </div>
            </div>
          </StitchSection>

          {/* Status */}
          <StitchSection
            icon={<Shield className="h-5 w-5" />}
            title="Status"
            fieldCount={2}
            defaultOpen={false}
          >
            <div className="mt-2">
              <UserFormStatus
                isActive={formData.isActive}
                isShadow={formData.isShadow}
                onToggleActive={(v) => setFormData((prev) => ({ ...prev, isActive: v }))}
                onToggleShadow={(v) => setFormData((prev) => ({ ...prev, isShadow: v }))}
              />
            </div>
          </StitchSection>
        </div>
      </StitchFormShell>

      <StitchFormActions
        onCancel={goToUsers}
        submitLabel={isEdit ? 'UPDATE USER' : 'CREATE USER'}
        loading={loading}
      />
    </form>
  );
}
