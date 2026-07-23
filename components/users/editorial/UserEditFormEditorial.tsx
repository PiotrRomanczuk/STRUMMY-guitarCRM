'use client';

import Link from 'next/link';

import { FormSection } from '@/components/_editorial/FormSection';
import { StudentFieldsBilling } from './StudentFields.Billing';
import { StudentFieldsContact } from './StudentFields.Contact';
import { StudentFieldsIdentity } from './StudentFields.Identity';
import { StudentFieldsSchedule } from './StudentFields.Schedule';
import { inputStyle } from './StudentFields.shared';
import { UserEditFormAccount } from './UserEditFormEditorial.Account';
import { useUserEditForm } from './useUserEditForm';
import type { EditableUser, StudentStatus } from './UserEditFormEditorial.types';

export type { EditableUser, StudentStatus };

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 10,
  color: 'var(--ink-4)',
  textTransform: 'uppercase',
  letterSpacing: '.12em',
  marginBottom: 6,
};

export const UserEditFormEditorial = ({ user }: { user: EditableUser }) => {
  const form = useUserEditForm(user);
  const { values, setField, isStudent } = form;

  return (
    <div
      style={{
        background: 'var(--ivory)',
        color: 'var(--ink)',
        minHeight: '100%',
        padding: '28px 32px 64px',
      }}
    >
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <Link
          href={`/dashboard/users/${user.id}`}
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            color: 'var(--ink-4)',
            textDecoration: 'none',
            textTransform: 'uppercase',
            letterSpacing: '.14em',
          }}
        >
          ← Profile
        </Link>
        <h1
          style={{
            margin: '12px 0 20px',
            fontFamily: 'var(--serif)',
            fontWeight: 400,
            fontSize: 40,
            letterSpacing: '-0.02em',
            fontStyle: 'italic',
          }}
        >
          Edit {user.fullName ?? user.email ?? 'profile'}
        </h1>

        {isStudent ? (
          <>
            <StudentFieldsIdentity values={values} onChange={setField} />
            <StudentFieldsContact values={values} onChange={setField} showStudentEmail={false} />
            <StudentFieldsSchedule values={values} onChange={setField} />
            <StudentFieldsBilling values={values} onChange={setField} />
          </>
        ) : (
          <FormSection numeral="I · IDENTITY" title="Display name">
            <div style={labelStyle}>Full name</div>
            <input
              value={values.fullName}
              onChange={(e) => setField('fullName', e.target.value)}
              maxLength={200}
              style={inputStyle}
            />
          </FormSection>
        )}

        <UserEditFormAccount
          isAdmin={form.isAdmin}
          isTeacher={form.isTeacher}
          isStudent={form.isStudent}
          isActive={form.isActive}
          studentStatus={form.studentStatus}
          onIsAdmin={form.setIsAdmin}
          onIsTeacher={form.setIsTeacher}
          onIsStudent={form.setIsStudent}
          onIsActive={form.setIsActive}
          onStudentStatus={form.setStudentStatus}
        />

        {form.error && (
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 12,
              color: 'var(--danger)',
              marginBottom: 12,
            }}
          >
            {form.error}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
          {form.saved && !form.error && (
            <span
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                color: 'var(--success)',
                textTransform: 'uppercase',
                letterSpacing: '.12em',
              }}
            >
              ✓ Saved
            </span>
          )}
          <button
            type="button"
            onClick={form.save}
            disabled={form.isSaving}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: form.isSaving ? 'var(--ink-4)' : 'var(--ink)',
              color: 'var(--paper)',
              fontSize: 13,
              fontWeight: 500,
              cursor: form.isSaving ? 'wait' : 'pointer',
              fontFamily: 'var(--sans)',
            }}
          >
            {form.isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
