import { ChangeEvent } from 'react';
import { Label } from '@/components/ui/label';
import { FieldGroup, CheckboxRow } from './UserForm.Fields';
import type { useUserFormState } from '@/components/users/hooks/useUserFormState';

export function buildSteps(
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
              <CheckboxRow id="isStudent" label="Student" checked={formData.isStudent} onChange={handleCheckbox('isStudent')} />
              <CheckboxRow id="isTeacher" label="Teacher" checked={formData.isTeacher} onChange={handleCheckbox('isTeacher')} />
              <CheckboxRow id="isAdmin" label="Admin" checked={formData.isAdmin} onChange={handleCheckbox('isAdmin')} />
              <CheckboxRow id="isParent" label="Parent / Guardian" checked={formData.isParent} onChange={handleCheckbox('isParent')} />
            </div>
          </div>
        </div>
      ),
    },
    {
      label: 'Status',
      content: (
        <div className="space-y-4">
          <CheckboxRow id="isActive" label="Active User" checked={formData.isActive} onChange={handleCheckbox('isActive')} />
          <CheckboxRow id="isShadow" label="Shadow User (no login, email optional)" checked={formData.isShadow} onChange={handleCheckbox('isShadow')} />
        </div>
      ),
    },
  ];
}
