'use client';

import { useCallback, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { FormPreviewPanel } from '@/components/_editorial/FormPreviewPanel';
import { CreateStudentFormFields } from './CreateStudentForm.Fields';
import { CreateStudentFormPreview } from './CreateStudentForm.Preview';

export const CreateStudentForm = () => {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!firstName.trim() || !lastName.trim() || !inviteEmail.trim()) {
        setError('First name, last name, and invite email are required.');
        return;
      }
      setError('');
      startTransition(async () => {
        try {
          const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              email: '',
              inviteEmail: inviteEmail.trim(),
              phone: phone.trim() || undefined,
              isStudent: true,
              isShadow: true,
            }),
          });
          const body = (await res.json()) as { id?: string; error?: string };
          if (!res.ok) throw new Error(body.error ?? 'Failed to create student');
          router.push(`/dashboard/users/${body.id}`);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to create student');
        }
      });
    },
    [firstName, lastName, inviteEmail, phone, router]
  );

  const previewName = [firstName, lastName].filter(Boolean).join(' ');

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
        <Link
          href="/dashboard/users"
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            color: 'var(--ink-4)',
            textDecoration: 'none',
            textTransform: 'uppercase',
            letterSpacing: '.14em',
          }}
        >
          ← Students
        </Link>
        <h1
          style={{
            margin: '12px 0 24px',
            fontFamily: 'var(--serif)',
            fontWeight: 400,
            fontSize: 40,
            letterSpacing: '-0.02em',
            fontStyle: 'italic',
          }}
        >
          Add student
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="ed-grid-form">
            <div>
              <CreateStudentFormFields
                firstName={firstName}
                lastName={lastName}
                inviteEmail={inviteEmail}
                phone={phone}
                onFirstName={setFirstName}
                onLastName={setLastName}
                onInviteEmail={setInviteEmail}
                onPhone={setPhone}
              />

              {error && (
                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--danger)' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 4 }}>
                <Link
                  href="/dashboard/users"
                  style={{
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
                  }}
                >
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
                  {isPending ? 'Creating…' : 'Create student'}
                </button>
              </div>
            </div>

            <FormPreviewPanel>
              <CreateStudentFormPreview name={previewName} inviteEmail={inviteEmail} />
            </FormPreviewPanel>
          </div>
        </form>
      </div>
    </div>
  );
};
