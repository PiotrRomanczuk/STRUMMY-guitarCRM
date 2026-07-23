'use client';

import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FormSection } from '@/components/_editorial/FormSection';
import { inputStyle } from './StudentFields.shared';
import type { StudentStatus } from './UserEditFormEditorial.types';

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 10,
  color: 'var(--ink-4)',
  textTransform: 'uppercase',
  letterSpacing: '.12em',
  marginBottom: 6,
};

const Toggle = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span style={{ fontSize: 14 }}>{label}</span>
  </label>
);

type Props = {
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isActive: boolean;
  studentStatus: StudentStatus;
  onIsAdmin: (v: boolean) => void;
  onIsTeacher: (v: boolean) => void;
  onIsStudent: (v: boolean) => void;
  onIsActive: (v: boolean) => void;
  onStudentStatus: (v: StudentStatus) => void;
};

/** Roles / status / account-active controls for the user edit form. */
export const UserEditFormAccount = ({
  isAdmin,
  isTeacher,
  isStudent,
  isActive,
  studentStatus,
  onIsAdmin,
  onIsTeacher,
  onIsStudent,
  onIsActive,
  onStudentStatus,
}: Props) => {
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);

  return (
    <FormSection numeral="V · ACCESS" title="Roles & account">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <div style={labelStyle}>Roles</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Toggle label="Admin" checked={isAdmin} onChange={onIsAdmin} />
            <Toggle label="Teacher" checked={isTeacher} onChange={onIsTeacher} />
            <Toggle label="Student" checked={isStudent} onChange={onIsStudent} />
          </div>
        </div>

        {isStudent && (
          <div>
            <div style={labelStyle}>Student status</div>
            <select
              value={studentStatus}
              onChange={(e) => onStudentStatus(e.target.value as StudentStatus)}
              style={inputStyle}
            >
              <option value="lead">Lead</option>
              <option value="trial">Trial</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="churned">Churned</option>
            </select>
          </div>
        )}

        <div>
          <div style={labelStyle}>Account</div>
          <Toggle
            label="Active (login enabled)"
            checked={isActive}
            onChange={(v) => {
              if (!v && isActive) {
                setShowDeactivateDialog(true);
              } else {
                onIsActive(v);
              }
            }}
          />
        </div>
      </div>

      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate this student?</AlertDialogTitle>
            <AlertDialogDescription>
              They won&apos;t be able to log in until reactivated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onIsActive(false);
                setShowDeactivateDialog(false);
              }}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FormSection>
  );
};
