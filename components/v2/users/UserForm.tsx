'use client';

import { useRef, ChangeEvent } from 'react';
import { useLayoutMode } from '@/hooks/use-is-widescreen';
import { useUserFormState } from '@/components/users/hooks/useUserFormState';
import { useFormErrorFocus } from '@/hooks/use-form-error-focus';
import { MobilePageShell } from '@/components/v2/primitives/MobilePageShell';
import { StepWizardForm } from '@/components/v2/primitives/StepWizardForm';
import { toast } from 'sonner';
import { buildSteps } from './UserForm.Steps';
import type { AvailableParent } from '@/components/users/form/UserForm';

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

  const steps = buildSteps(formData, validationErrors, handleChange, handleBlur, handleCheckbox);

  const onSubmit = (e: React.FormEvent) => {
    handleSubmit(e);
    if (error) toast.error(error);
  };

  const formContent = (
    <form ref={formRef} onSubmit={onSubmit}>
      <StepWizardForm
        steps={steps}
        formData={formData as unknown as Record<string, unknown>}
        errors={validationErrors}
        submitLabel={loading ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
      />
    </form>
  );

  if (mode === 'mobile') {
    return (
      <MobilePageShell title={isEdit ? 'Edit User' : 'New User'}>
        {formContent}
      </MobilePageShell>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold">
          {isEdit ? 'Edit User' : 'New User'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Step wizard</p>
      </div>
      {formContent}
    </div>
  );
}
