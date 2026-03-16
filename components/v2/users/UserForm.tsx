'use client';

import { useRef, lazy, Suspense, ChangeEvent } from 'react';
import { useLayoutMode } from '@/hooks/use-is-widescreen';
import { useUserFormState } from '@/components/users/hooks/useUserFormState';
import { useFormErrorFocus } from '@/hooks/use-form-error-focus';
import { MobilePageShell } from '@/components/v2/primitives/MobilePageShell';
import { StepWizardForm } from '@/components/v2/primitives/StepWizardForm';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FieldGroup, CheckboxRow } from './UserForm.Fields';
import type { AvailableParent } from '@/components/users/form/UserForm';

const V1UserForm = lazy(() => import('@/components/users/form/UserForm'));

interface UserFormV2Props {
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

export function UserFormV2({
  initialData,
  isEdit,
  availableParents = [],
}: UserFormV2Props) {
  const mode = useLayoutMode();
  const {
    formData,
    loading,
    error,
    validationErrors,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useUserFormState(initialData, isEdit);
  const formRef = useRef<HTMLFormElement>(null);
  useFormErrorFocus(validationErrors, formRef);

  const handleCheckbox = (name: string) => (checked: boolean) => {
    handleChange({
      target: { name, type: 'checkbox', checked },
    } as ChangeEvent<HTMLInputElement>);
  };

  // Desktop: intentionally lazy-loads the v1 UserForm which already provides
  // a full-featured desktop layout with all fields visible at once.
  // The v2 step-wizard is mobile-only; desktop users prefer the single-page form.
  if (mode !== 'mobile') {
    return (
      <Suspense
        fallback={<div className="animate-pulse h-96 bg-muted rounded-xl" />}
      >
        <V1UserForm
          initialData={initialData}
          isEdit={isEdit}
          availableParents={availableParents}
        />
      </Suspense>
    );
  }

  const steps = buildSteps(
    formData,
    validationErrors,
    handleChange,
    handleBlur,
    handleCheckbox
  );

  return (
    <MobilePageShell title={isEdit ? 'Edit User' : 'New User'}>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <form ref={formRef} onSubmit={handleSubmit}>
        <StepWizardForm
          steps={steps}
          formData={formData as unknown as Record<string, unknown>}
          errors={validationErrors}
          submitLabel={
            loading ? 'Saving...' : isEdit ? 'Update User' : 'Create User'
          }
        />
      </form>
    </MobilePageShell>
  );
}

function buildSteps(
  formData: ReturnType<typeof useUserFormState>['formData'],
  validationErrors: Record<string, string>,
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void,
  handleBlur: (field: string) => void,
  handleCheckbox: (name: string) => (checked: boolean) => void
) {
  return [
    {
      label: 'Basic Info',
      requiredFields: ['firstName'],
      content: (
        <div className="space-y-4">
          <FieldGroup
            label="First Name *"
            id="firstName"
            value={formData.firstName}
            error={validationErrors.firstName}
            onChange={handleChange}
            onBlur={() => handleBlur('firstName')}
          />
          <FieldGroup
            label="Last Name"
            id="lastName"
            value={formData.lastName}
            error={validationErrors.lastName}
            onChange={handleChange}
            onBlur={() => handleBlur('lastName')}
          />
          <FieldGroup
            label="Email *"
            id="email"
            type="email"
            value={formData.email}
            error={validationErrors.email}
            onChange={handleChange}
            onBlur={() => handleBlur('email')}
            placeholder="user@example.com"
          />
        </div>
      ),
    },
    {
      label: 'Account',
      content: (
        <div className="space-y-4">
          <FieldGroup
            label="Username"
            id="username"
            value={formData.username}
            error={validationErrors.username}
            onChange={handleChange}
            onBlur={() => handleBlur('username')}
          />
          <div className="space-y-3">
            <Label>Roles</Label>
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <CheckboxRow
                id="isStudent"
                label="Student"
                checked={formData.isStudent}
                onChange={handleCheckbox('isStudent')}
              />
              <CheckboxRow
                id="isTeacher"
                label="Teacher"
                checked={formData.isTeacher}
                onChange={handleCheckbox('isTeacher')}
              />
              <CheckboxRow
                id="isAdmin"
                label="Admin"
                checked={formData.isAdmin}
                onChange={handleCheckbox('isAdmin')}
              />
              <CheckboxRow
                id="isParent"
                label="Parent / Guardian"
                checked={formData.isParent}
                onChange={handleCheckbox('isParent')}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      label: 'Status',
      content: (
        <div className="space-y-4">
          <CheckboxRow
            id="isActive"
            label="Active User"
            checked={formData.isActive}
            onChange={handleCheckbox('isActive')}
          />
          <CheckboxRow
            id="isShadow"
            label="Shadow User (no login, email optional)"
            checked={formData.isShadow}
            onChange={handleCheckbox('isShadow')}
          />
        </div>
      ),
    },
  ];
}
