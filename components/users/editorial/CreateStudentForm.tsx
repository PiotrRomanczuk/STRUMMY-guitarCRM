'use client';

import Link from 'next/link';

import { FormPreviewPanel } from '@/components/_editorial/FormPreviewPanel';
import { CreateStudentFormFields } from './CreateStudentForm.Fields';
import { CreateStudentFormPreview } from './CreateStudentForm.Preview';
import { useCreateStudentForm } from './useCreateStudentForm';

const backLinkStyle: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 11,
  color: 'var(--ink-4)',
  textDecoration: 'none',
  textTransform: 'uppercase',
  letterSpacing: '.14em',
};

const cancelStyle: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: 8,
  border: '1px solid var(--rule)',
  background: 'transparent',
  color: 'var(--ink)',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'var(--sans)',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
};

export const CreateStudentForm = () => {
  const { values, errors, error, isPending, setField, handleSubmit, previewName } =
    useCreateStudentForm();

  return (
    <div
      style={{
        background: 'var(--ivory)',
        color: 'var(--ink)',
        minHeight: '100%',
        padding: '28px 32px 64px',
      }}
    >
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <Link href="/dashboard/users" style={backLinkStyle}>
          ← Students
        </Link>
        <h1
          style={{
            margin: '12px 0 6px',
            fontFamily: 'var(--serif)',
            fontWeight: 400,
            fontSize: 40,
            letterSpacing: '-0.02em',
            fontStyle: 'italic',
          }}
        >
          Add a student
        </h1>
        <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--ink-3)', maxWidth: 520 }}>
          Contact info, billing, and lesson schedule. Only name and level are required to get
          started.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="ed-grid-form">
            <div>
              <CreateStudentFormFields values={values} onChange={setField} errors={errors} />

              {error && (
                <div
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 12,
                    color: 'var(--danger)',
                    marginBottom: 12,
                  }}
                >
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 4 }}>
                <Link href="/dashboard/users" style={cancelStyle}>
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isPending}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 8,
                    border: 'none',
                    background: isPending ? 'var(--ink-4)' : 'var(--ink)',
                    color: 'var(--paper)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: isPending ? 'wait' : 'pointer',
                    fontFamily: 'var(--sans)',
                  }}
                >
                  {isPending ? 'Adding…' : 'Add student'}
                </button>
              </div>
            </div>

            <FormPreviewPanel>
              <CreateStudentFormPreview
                name={previewName}
                skillLevel={values.skillLevel}
                avatarColor={values.avatarColor}
                lessonDay={values.lessonDay}
                lessonTime={values.lessonTime}
                lessonRate={values.lessonRate}
                billingCycle={values.billingCycle}
              />
            </FormPreviewPanel>
          </div>
        </form>
      </div>
    </div>
  );
};
